import re
from typing import Dict, Any, List, Optional
from app.events.emitter import EventCallback, create_event

BOT_CAPABILITY_MAPPINGS = {
    "chatbot": {
        "name": "ChatBot",
        "category": "Conversational",
        "keywords": ["explain", "help", "what is", "how do", "tell me", "overview", "chat", "discuss", "summarize briefly", "guide"],
        "capabilities": ["Conversational Reasoning", "Contextual Dialogue", "Task Guidance"]
    },
    "codebot": {
        "name": "CodeBot",
        "category": "Engineering",
        "keywords": ["function", "code", "python", "javascript", "typescript", "bug", "refactor", "algorithm", "regex", "sql", "api", "class", "async", "ast", "error", "stack trace", "lint", "complexity"],
        "capabilities": ["Syntax Analysis", "AST Parsing", "Complexity Profiling", "Security Linting", "Algorithmic Synthesis"]
    },
    "visionbot": {
        "name": "VisionBot",
        "category": "Computer Vision",
        "keywords": ["image", "photo", "picture", "visual", "pixel", "tensor", "detect", "segment", "bounding box", "ocr", "classify image", "features", "edges", "contour"],
        "capabilities": ["Tensor Transformation", "Spatial Feature Extraction", "Visual Classification", "Bounding & Salience Mapping"]
    },
    "researchbot": {
        "name": "ResearchBot",
        "category": "Research",
        "keywords": ["paper", "academic", "study", "literature", "citation", "reference", "hypothesis", "verify claim", "fact check", "source", "journal"],
        "capabilities": ["Literature Synthesis", "Semantic Ranking", "Citation Extraction", "Fact Verification"]
    },
    "documentbot": {
        "name": "DocumentBot",
        "category": "Documents",
        "keywords": ["pdf", "document", "contract", "invoice", "table", "extract text", "summarize document", "form", "markdown", "report", "doc"],
        "capabilities": ["Document Parsing", "Hierarchical Extraction", "Summary Generation", "Table Serialization"]
    },
    "databot": {
        "name": "DataBot",
        "category": "Data Science",
        "keywords": ["csv", "dataset", "dataframe", "anomaly", "outlier", "statistics", "mean", "correlation", "variance", "distribution", "trend", "matrix", "z-score", "scatter"],
        "capabilities": ["Anomaly Detection", "Distribution Profiling", "Correlation Analysis", "Matrix Transformation"]
    },
    "studybot": {
        "name": "StudyBot",
        "category": "Education",
        "keywords": ["quiz", "learn", "teach", "flashcard", "lesson", "concept breakdown", "curriculum", "pedagogy", "mnemonic", "study guide", "practice questions"],
        "capabilities": ["Pedagogical Deconstruction", "Step-by-Step Synthesis", "Conceptual Verification", "Knowledge Distillation"]
    }
}

class ClassificationPipeline:
    def __init__(self):
        self.mappings = BOT_CAPABILITY_MAPPINGS

    def classify(
        self,
        prompt: str,
        file_meta: Optional[Dict[str, Any]] = None,
        preferred_bot: Optional[str] = None,
        task_id: str = "task-local",
        on_event: Optional[EventCallback] = None
    ) -> Dict[str, Any]:
        if on_event:
            on_event(create_event(
                task_id=task_id,
                event_type="TASK_ANALYZED",
                layer="Orchestrator",
                status="running",
                progress=15,
                message="Analyzing lexical tokens and intent semantics"
            ))

        # Check explicit preference
        if preferred_bot and preferred_bot.lower() in self.mappings:
            target_slug = preferred_bot.lower()
            target_meta = self.mappings[target_slug]
            confidence = 0.99
            reason = f"Explicit bot selection: {target_meta['name']}"
        else:
            # Match capabilities via score heuristics
            scores = {slug: 0 for slug in self.mappings}
            prompt_lower = prompt.lower()

            for slug, config in self.mappings.items():
                for kw in config["keywords"]:
                    if kw in prompt_lower:
                        scores[slug] += 1
                        if len(kw.split()) > 1:
                            scores[slug] += 1.5

            if file_meta:
                mime = file_meta.get("mime_type", "").lower()
                name = file_meta.get("name", "").lower()
                if "image" in mime or any(name.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"]):
                    scores["visionbot"] += 5
                elif "csv" in mime or name.endswith(".csv"):
                    scores["databot"] += 5
                elif "pdf" in mime or name.endswith(".pdf"):
                    scores["documentbot"] += 5
                elif any(name.endswith(ext) for ext in [".ts", ".js", ".py", ".go", ".rs", ".java", ".c", ".cpp"]):
                    scores["codebot"] += 5

            best_slug = max(scores, key=scores.get)
            best_score = scores[best_slug]

            if best_score > 0:
                target_slug = best_slug
                target_meta = self.mappings[target_slug]
                confidence = min(0.65 + (best_score * 0.08), 0.98)
                reason = f"Semantic capability match: {target_meta['name']} (score {best_score})"
            else:
                target_slug = "chatbot"
                target_meta = self.mappings[target_slug]
                confidence = 0.50
                reason = "Default conversational reasoning routing"

        if on_event:
            on_event(create_event(
                task_id=task_id,
                event_type="BOT_SELECTED",
                layer="Orchestrator",
                status="running",
                progress=25,
                message=f"Routed task to {target_meta['name']} with confidence {confidence:.2f}",
                metadata={"bot_slug": target_slug, "capabilities": target_meta["capabilities"]}
            ))

        return {
            "bot_slug": target_slug,
            "bot_name": target_meta["name"],
            "category": target_meta["category"],
            "confidence": round(confidence, 2),
            "capabilities": target_meta["capabilities"],
            "reason": reason
        }
