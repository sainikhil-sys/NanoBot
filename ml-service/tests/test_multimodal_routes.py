from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_multimodal_health_is_registered():
    response = client.get("/multimodal/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["audio"]["available"] is True
    assert payload["image"]["available"] is True
    assert payload["video"]["available"] is True


def test_audio_endpoint_rejects_empty_upload():
    response = client.post(
        "/multimodal/audio/transcribe",
        files={"file": ("empty.wav", b"", "audio/wav")},
    )
    assert response.status_code == 400


def test_image_endpoint_rejects_invalid_image():
    response = client.post(
        "/multimodal/image/analyze",
        files={"file": ("not-image.png", b"not an image", "image/png")},
    )
    assert response.status_code == 415
