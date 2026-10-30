import io
import os
import shutil
import subprocess
import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool

router = APIRouter()
MAX_UPLOAD_BYTES = int(os.getenv("NANOBOT_MAX_MEDIA_BYTES", str(100 * 1024 * 1024)))
MAX_VIDEO_FRAMES = int(os.getenv("NANOBOT_MAX_VIDEO_FRAMES", "8"))
FRAME_INTERVAL_SECONDS = float(os.getenv("NANOBOT_VIDEO_FRAME_INTERVAL", "2.0"))


async def _read_upload(file: UploadFile) -> bytes:
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the configured upload limit.")
    return data


@lru_cache(maxsize=1)
def _image_captioner():
    try:
        from transformers import pipeline
    except ImportError as exc:
        raise RuntimeError(
            "Image model dependencies are missing. Install ml-service/requirements-multimodal.txt."
        ) from exc
    model_name = os.getenv("NANOBOT_IMAGE_MODEL", "Salesforce/blip-image-captioning-base")
    return pipeline("image-to-text", model=model_name, device=-1)


@lru_cache(maxsize=1)
def _speech_model():
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise RuntimeError(
            "Audio model dependencies are missing. Install ml-service/requirements-multimodal.txt."
        ) from exc
    model_name = os.getenv("NANOBOT_WHISPER_MODEL", "small")
    return WhisperModel(model_name, device="cpu", compute_type="int8")


def _caption_image(data: bytes) -> dict[str, Any]:
    try:
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("The uploaded file is not a valid image.") from exc
    result = _image_captioner()(image, max_new_tokens=80)
    caption = result[0].get("generated_text", "").strip() if result else ""
    return {
        "caption": caption,
        "width": image.width,
        "height": image.height,
        "model": os.getenv("NANOBOT_IMAGE_MODEL", "Salesforce/blip-image-captioning-base"),
    }


def _transcribe_audio(data: bytes, suffix: str) -> dict[str, Any]:
    suffix = suffix if suffix and len(suffix) <= 10 else ".audio"
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
            temp.write(data)
            temp_path = temp.name
        segments, info = _speech_model().transcribe(temp_path, vad_filter=True)
        transcript_segments = [
            {
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "text": segment.text.strip(),
            }
            for segment in segments
        ]
        return {
            "text": " ".join(item["text"] for item in transcript_segments).strip(),
            "segments": transcript_segments,
            "language": info.language,
            "language_probability": round(info.language_probability, 4),
            "duration_seconds": round(info.duration, 2),
            "model": os.getenv("NANOBOT_WHISPER_MODEL", "small"),
        }
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


def _extract_video_frames(data: bytes, suffix: str) -> tuple[list[bytes], dict[str, Any]]:
    import cv2

    suffix = suffix if suffix and len(suffix) <= 10 else ".mp4"
    video_path = None
    capture = None
    frames: list[bytes] = []
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
            temp.write(data)
            video_path = temp.name
        capture = cv2.VideoCapture(video_path)
        if not capture.isOpened():
            raise ValueError("The uploaded file could not be decoded as a video.")

        fps = capture.get(cv2.CAP_PROP_FPS) or 0
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration = frame_count / fps if fps > 0 else 0
        if duration <= 0:
            raise ValueError("The video has no readable frames.")

        interval = max(1, int((fps or 1) * FRAME_INTERVAL_SECONDS))
        sampled_indices = []
        for frame_index in range(0, frame_count, interval):
            if len(frames) >= MAX_VIDEO_FRAMES:
                break
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = capture.read()
            if not ok:
                continue
            ok, encoded = cv2.imencode(".jpg", frame)
            if ok:
                frames.append(encoded.tobytes())
                sampled_indices.append(frame_index)
        if not frames:
            raise ValueError("No frames could be extracted from the video.")
        return frames, {
            "duration_seconds": round(duration, 2),
            "fps": round(fps, 2),
            "frame_count": frame_count,
            "frames_analyzed": len(frames),
            "frame_timestamps_seconds": [round(i / fps, 2) if fps > 0 else 0 for i in sampled_indices],
        }
    finally:
        if capture is not None:
            capture.release()
        if video_path and os.path.exists(video_path):
            os.remove(video_path)


def _transcribe_video_audio(data: bytes, suffix: str) -> dict[str, Any]:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return {"processed": False, "reason": "FFmpeg is not installed; video audio extraction is unavailable."}

    video_path = audio_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix or ".mp4", delete=False) as video_file:
            video_file.write(data)
            video_path = video_file.name
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as audio_file:
            audio_path = audio_file.name

        completed = subprocess.run(
            [ffmpeg, "-y", "-i", video_path, "-vn", "-ac", "1", "-ar", "16000", audio_path],
            capture_output=True,
            text=True,
            timeout=180,
            check=False,
        )
        if completed.returncode != 0 or not os.path.getsize(audio_path):
            return {"processed": False, "reason": "No decodable audio track was found in this video."}

        result = _transcribe_audio(Path(audio_path).read_bytes(), ".wav")
        return {"processed": True, **result}
    except RuntimeError as exc:
        return {"processed": False, "reason": str(exc)}
    except subprocess.TimeoutExpired:
        return {"processed": False, "reason": "Audio extraction exceeded the 180-second processing limit."}
    finally:
        for path in (video_path, audio_path):
            if path and os.path.exists(path):
                os.remove(path)


@router.get("/health")
async def multimodal_health():
    return {
        "audio": {"available": True, "model_loaded": _speech_model.cache_info().currsize > 0},
        "image": {"available": True, "model_loaded": _image_captioner.cache_info().currsize > 0},
        "video": {
            "available": True,
            "ffmpeg_available": shutil.which("ffmpeg") is not None,
            "max_frames_per_request": MAX_VIDEO_FRAMES,
        },
        "note": "Models load on first request; first inference may download model weights.",
    }


@router.post("/audio/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    data = await _read_upload(file)
    try:
        result = await run_in_threadpool(_transcribe_audio, data, Path(file.filename or "audio.wav").suffix)
        return {"media_type": "audio", **result}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Audio transcription failed: {exc}") from exc


@router.post("/image/analyze")
async def analyze_image(file: UploadFile = File(...)):
    data = await _read_upload(file)
    try:
        result = await run_in_threadpool(_caption_image, data)
        return {"media_type": "image", **result}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Image analysis failed: {exc}") from exc


@router.post("/video/analyze")
async def analyze_video(file: UploadFile = File(...)):
    data = await _read_upload(file)
    suffix = Path(file.filename or "video.mp4").suffix
    try:
        frames, metadata = await run_in_threadpool(_extract_video_frames, data, suffix)
        captions = []
        for timestamp, frame in zip(metadata["frame_timestamps_seconds"], frames):
            result = await run_in_threadpool(_caption_image, frame)
            captions.append({"timestamp_seconds": timestamp, "caption": result["caption"]})
        audio_result = await run_in_threadpool(_transcribe_video_audio, data, suffix)
        return {
            "media_type": "video",
            **metadata,
            "frame_summaries": captions,
            "summary": " ".join(item["caption"] for item in captions if item["caption"]),
            "model": os.getenv("NANOBOT_IMAGE_MODEL", "Salesforce/blip-image-captioning-base"),
            "audio_track": audio_result,
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Video analysis failed: {exc}") from exc
