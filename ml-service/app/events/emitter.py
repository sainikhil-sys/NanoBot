import time
from typing import Any, Dict, Optional, Callable
from pydantic import BaseModel

class ExecutionEvent(BaseModel):
    task_id: str
    step_id: Optional[str] = None
    layer: str
    step: str
    event_type: Optional[str] = None
    status: str  # waiting, running, completed, failed
    progress: int  # 0 to 100
    level: str = "info"  # info, warn, error, debug
    message: str
    metadata: Dict[str, Any] = {}
    timestamp_ms: int

EventCallback = Callable[[ExecutionEvent], None]

def create_event(
    task_id: str,
    layer: str,
    status: str,
    progress: int,
    message: str,
    step: Optional[str] = None,
    event_type: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    level: str = "info",
    step_id: Optional[str] = None
) -> ExecutionEvent:
    actual_step = step or event_type or "PIPELINE_STEP"
    return ExecutionEvent(
        task_id=task_id,
        step_id=step_id,
        layer=layer,
        step=actual_step,
        event_type=event_type or actual_step,
        status=status,
        progress=max(0, min(100, progress)),
        level=level,
        message=message,
        metadata=metadata or {},
        timestamp_ms=int(time.time() * 1000)
    )
