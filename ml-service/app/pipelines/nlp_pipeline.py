import re
import math
import numpy as np
from typing import Dict, Any, List, Optional
from app.events.emitter import EventCallback, create_event

class NLPPipeline:
    def __init__(self):
        self.vocab = {}
        self.embedding_dim = 16

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b\w+\b', text.lower())

    def _get_embedding_vector(self, tokens: List[str]) -> List[float]:
        vector = np.zeros(self.embedding_dim)
        for token in tokens:
            h = hash(token) % self.embedding_dim
            vector[h] += 1.0
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()

    def execute(
        self,
        prompt: str = "",
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
                layer="NLP Layer",
                status="running",
                progress=35,
                message="Tokenizing text and mapping vocabulary vectors"
            ))

        tokens = self._tokenize(prompt)
        vocab_size = len(set(tokens))

        if cb:
            cb(create_event(
                task_id=task_id,
                event_type="FEATURE_EXTRACTION_STARTED",
                layer="NLP Layer",
                status="running",
                progress=55,
                message=f"Projecting {len(tokens)} tokens into dense vector space (dim={self.embedding_dim})",
                metadata={"token_count": len(tokens), "vocab_size": vocab_size}
            ))

        embedding = self._get_embedding_vector(tokens)

        # Sentiment heuristics
        pos_words = {"good", "great", "excellent", "best", "fast", "efficient", "optimal", "clean", "success"}
        neg_words = {"bad", "poor", "slow", "error", "fail", "broken", "bug", "issue", "problem"}
        pos_score = sum(1 for t in tokens if t in pos_words)
        neg_score = sum(1 for t in tokens if t in neg_words)
        polarity = (pos_score - neg_score) / (pos_score + neg_score + 1e-5)

        if cb:
            cb(create_event(
                task_id=task_id,
                event_type="INFERENCE_COMPLETED",
                layer="NLP Layer",
                status="running",
                progress=80,
                message="Completed semantic classification and contextual inference"
            ))

        return {
            "token_count": len(tokens),
            "vocab_size": vocab_size,
            "embedding_norm": round(float(np.linalg.norm(embedding)), 4),
            "sentiment_polarity": round(float(polarity), 2),
            "top_tokens": list(set(tokens))[:8],
            "embedding_sample": [round(v, 4) for v in embedding[:4]]
        }
