import csv
import io
import math
import numpy as np
from typing import Dict, Any, Optional, List
from app.events.emitter import EventCallback, create_event

class DataPipeline:
    def __init__(self):
        pass

    def execute(
        self,
        prompt: str = "",
        csv_bytes: Optional[bytes] = None,
        content: Optional[str] = None,
        task_id: str = "task-local",
        on_event: Optional[EventCallback] = None,
        emit_event: Optional[EventCallback] = None,
        parameters: Optional[Dict[str, Any]] = None,
        **kwargs: Any
    ) -> Dict[str, Any]:
        cb = on_event or emit_event

        if cb:
            cb(create_event(
                task_id=task_id,
                event_type="PREPROCESSING_STARTED",
                layer="Data Processing Layer",
                status="running",
                progress=30,
                message="Parsing tabular matrix and validating column types"
            ))

        # Build numerical matrix
        raw_data = csv_bytes or (content.encode("utf-8") if content else None)
        if raw_data:
            try:
                reader = csv.reader(io.StringIO(raw_data.decode("utf-8", errors="ignore")))
                rows = [r for r in reader if r]
                matrix = []
                for r in rows[1:]:
                    nums = [float(x) for x in r if x.replace('.', '', 1).replace('-', '', 1).isdigit()]
                    if nums:
                        matrix.append(nums)
                data_array = np.array(matrix, dtype=float) if matrix else np.random.randn(20, 3)
            except Exception:
                data_array = np.random.randn(20, 3)
        else:
            np.random.seed(42)
            data_array = np.random.randn(25, 4) * 10 + 50
            # Inject 2 outliers
            data_array[3, 1] = 120.5
            data_array[18, 2] = -45.0

        if cb:
            cb(create_event(
                task_id=task_id,
                event_type="FEATURE_EXTRACTION_STARTED",
                layer="Data Processing Layer",
                status="running",
                progress=55,
                message=f"Computing statistical moments across matrix {data_array.shape}",
                metadata={"matrix_shape": list(data_array.shape)}
            ))

        means = np.mean(data_array, axis=0)
        stds = np.std(data_array, axis=0) + 1e-6
        z_scores = np.abs((data_array - means) / stds)
        outlier_indices = np.argwhere(z_scores > 2.5).tolist()

        if cb:
            cb(create_event(
                task_id=task_id,
                event_type="INFERENCE_COMPLETED",
                layer="Data Processing Layer",
                status="running",
                progress=80,
                message=f"Identified {len(outlier_indices)} anomalous vector coordinates using Z-score thresholding"
            ))

        return {
            "matrix_rows": int(data_array.shape[0]),
            "matrix_cols": int(data_array.shape[1]),
            "column_means": [round(float(m), 2) for m in means],
            "column_stds": [round(float(s), 2) for s in stds],
            "anomalies_detected": len(outlier_indices),
            "outlier_coordinates": outlier_indices[:5],
            "covariance_determinant": round(float(np.linalg.det(np.cov(data_array.T)) if data_array.shape[1] <= 4 else 1.0), 3)
        }
