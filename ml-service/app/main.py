import asyncio
import json
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.events.emitter import ExecutionEvent, create_event
from app.pipelines.classification_pipeline import ClassificationPipeline
from app.pipelines.nlp_pipeline import NLPPipeline
from app.pipelines.vision_pipeline import VisionPipeline
from app.pipelines.data_pipeline import DataPipeline
from app.pipelines.code_pipeline import CodePipeline
from app.pipelines.research_pipeline import ResearchPipeline
from app.pipelines.study_pipeline import StudyPipeline

app = FastAPI(
    title="NanoBot ML Processing Service",
    description="Deterministic Deep-Learning Execution Layer",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pipeline instances
classification_pipeline = ClassificationPipeline()
nlp_pipeline = NLPPipeline()
vision_pipeline = VisionPipeline()
data_pipeline = DataPipeline()
code_pipeline = CodePipeline()
research_pipeline = ResearchPipeline()
study_pipeline = StudyPipeline()

class ClassifyRequest(BaseModel):
    task_id: str = "task-local"
    prompt: str
    file_info: Optional[Dict[str, Any]] = None
    preferred_bot: Optional[str] = None

class TaskRequest(BaseModel):
    task_id: str = "task-local"
    prompt: str
    preferred_bot: Optional[str] = None
    file_info: Optional[Dict[str, Any]] = None
    file_content: Optional[str] = None
    image_data: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "nanobot-ml-service",
        "device": "cpu",
        "active_pipelines": [
            "nlp_pipeline",
            "vision_pipeline",
            "data_pipeline",
            "code_pipeline",
            "research_pipeline",
            "study_pipeline"
        ]
    }

@app.post("/classify")
async def classify_task(req: ClassifyRequest):
    events: List[Dict[str, Any]] = []

    def record_event(event: ExecutionEvent):
        events.append(event.model_dump())

    routing = classification_pipeline.classify(
        prompt=req.prompt,
        file_meta=req.file_info,
        preferred_bot=req.preferred_bot,
        task_id=req.task_id,
        on_event=record_event
    )

    return {
        "routing": routing,
        "events": events
    }

def run_pipeline(
    bot_slug: str,
    task_id: str,
    prompt: str,
    file_content: Optional[str] = None,
    image_data: Optional[str] = None,
    event_queue: Optional[asyncio.Queue] = None
) -> Dict[str, Any]:
    def sync_event_emitter(event: ExecutionEvent):
        if event_queue is not None:
            asyncio.run_coroutine_threadsafe(
                event_queue.put(event.model_dump()),
                asyncio.get_event_loop()
            )

    if bot_slug == "visionbot":
        img_bytes = image_data.encode("utf-8") if image_data else (file_content.encode("utf-8") if file_content else None)
        return vision_pipeline.execute(
            prompt=prompt,
            image_bytes=img_bytes,
            task_id=task_id,
            on_event=sync_event_emitter
        )
    elif bot_slug == "databot":
        csv_bytes = file_content.encode("utf-8") if file_content else None
        return data_pipeline.execute(
            prompt=prompt,
            csv_bytes=csv_bytes,
            task_id=task_id,
            on_event=sync_event_emitter
        )
    elif bot_slug == "codebot":
        return code_pipeline.execute(
            prompt=prompt,
            code_str=file_content or prompt,
            task_id=task_id,
            on_event=sync_event_emitter
        )
    elif bot_slug == "researchbot" or bot_slug == "documentbot":
        return research_pipeline.execute(
            prompt=file_content or prompt,
            task_id=task_id,
            on_event=sync_event_emitter
        )
    elif bot_slug == "studybot":
        return study_pipeline.execute(
            prompt=prompt,
            task_id=task_id,
            on_event=sync_event_emitter
        )
    else:  # chatbot or default
        return nlp_pipeline.execute(
            prompt=prompt,
            task_id=task_id,
            on_event=sync_event_emitter
        )

@app.post("/execute")
async def execute_task(req: TaskRequest):
    events: List[Dict[str, Any]] = []

    def record_event(event: ExecutionEvent):
        events.append(event.model_dump())

    # Step 1: Route and classify
    routing = classification_pipeline.classify(
        prompt=req.prompt,
        file_meta=req.file_info,
        preferred_bot=req.preferred_bot,
        task_id=req.task_id,
        on_event=record_event
    )

    bot_slug = routing["bot_slug"]

    # Step 2: Execute target pipeline
    if bot_slug == "visionbot":
        img_bytes = req.image_data.encode("utf-8") if req.image_data else (req.file_content.encode("utf-8") if req.file_content else None)
        result = vision_pipeline.execute(
            prompt=req.prompt,
            image_bytes=img_bytes,
            task_id=req.task_id,
            on_event=record_event
        )
    elif bot_slug == "databot":
        csv_bytes = req.file_content.encode("utf-8") if req.file_content else None
        result = data_pipeline.execute(
            prompt=req.prompt,
            csv_bytes=csv_bytes,
            task_id=req.task_id,
            on_event=record_event
        )
    elif bot_slug == "codebot":
        result = code_pipeline.execute(
            prompt=req.prompt,
            code_str=req.file_content or req.prompt,
            task_id=req.task_id,
            on_event=record_event
        )
    elif bot_slug == "researchbot" or bot_slug == "documentbot":
        result = research_pipeline.execute(
            prompt=req.file_content or req.prompt,
            task_id=req.task_id,
            on_event=record_event
        )
    elif bot_slug == "studybot":
        result = study_pipeline.execute(
            prompt=req.prompt,
            task_id=req.task_id,
            on_event=record_event
        )
    else:  # chatbot or fallback
        result = nlp_pipeline.execute(
            prompt=req.prompt,
            task_id=req.task_id,
            on_event=record_event
        )

    # Final completion event
    record_event(create_event(
        task_id=req.task_id,
        layer="response",
        step="Response Finalization",
        status="completed",
        progress=100,
        message="Task execution completed successfully",
        metadata={"bot": routing["bot_name"], "confidence": routing["confidence"]}
    ))

    return {
        "task_id": req.task_id,
        "routing": routing,
        "result": result,
        "events": events
    }

@app.get("/execute/stream/{task_id}")
async def stream_task_execution(
    task_id: str,
    prompt: str,
    preferred_bot: Optional[str] = None
):
    event_queue: asyncio.Queue = asyncio.Queue()

    async def event_generator():
        yield f"event: init\ndata: {json.dumps({'task_id': task_id, 'status': 'queued'})}\n\n"

        # Background task
        loop = asyncio.get_event_loop()
        routing_future = loop.run_in_executor(
            None,
            lambda: classification_pipeline.classify(
                prompt=prompt,
                preferred_bot=preferred_bot,
                task_id=task_id
            )
        )
        routing = await routing_future
        bot_slug = routing["bot_slug"]

        # Run pipeline in worker thread
        loop.run_in_executor(
            None,
            lambda: run_pipeline(
                bot_slug=bot_slug,
                task_id=task_id,
                prompt=prompt,
                event_queue=event_queue
            )
        )

        completed = False
        while not completed:
            try:
                event_data = await asyncio.wait_for(event_queue.get(), timeout=1.0)
                yield f"event: pipeline_event\ndata: {json.dumps(event_data)}\n\n"
                if event_data.get("progress") == 100 or event_data.get("status") in ["completed", "failed"]:
                    completed = True
            except asyncio.TimeoutError:
                yield f": ping\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )
