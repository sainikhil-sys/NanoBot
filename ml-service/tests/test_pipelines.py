from app.pipelines.classification_pipeline import ClassificationPipeline
from app.pipelines.nlp_pipeline import NLPPipeline
from app.pipelines.vision_pipeline import VisionPipeline
from app.pipelines.data_pipeline import DataPipeline
from app.pipelines.code_pipeline import CodePipeline
from app.pipelines.research_pipeline import ResearchPipeline
from app.pipelines.study_pipeline import StudyPipeline

def test_intent_classification():
    events = []
    clf = ClassificationPipeline()
    res = clf.classify(
        task_id="t-1",
        prompt="Classify this image and extract spatial features",
        on_event=lambda e: events.append(e)
    )
    assert res["bot_slug"] == "visionbot"
    assert len(events) >= 2
    assert res["confidence"] > 0.5

def test_nlp_pipeline():
    events = []
    nlp = NLPPipeline()
    res = nlp.execute(task_id="t-2", prompt="Explain distributed neural computation", on_event=lambda e: events.append(e))
    assert res["token_count"] > 0
    assert len(events) >= 3

def test_vision_pipeline():
    events = []
    vision = VisionPipeline()
    res = vision.execute(task_id="t-3", prompt="Visual classification of tensor grid", on_event=lambda e: events.append(e))
    assert "tensor_shape" in res
    assert res["tensor_shape"] == [1, 3, 224, 224]
    assert len(events) >= 3

def test_data_pipeline():
    events = []
    data = DataPipeline()
    csv_bytes = b"metric_a,metric_b\n10.2,5.1\n11.1,5.2\n100.5,50.8\n10.5,4.9"
    res = data.execute(task_id="t-4", prompt="Analyze anomalies in tabular data", csv_bytes=csv_bytes, on_event=lambda e: events.append(e))
    assert res["matrix_rows"] >= 3
    assert len(events) >= 3

def test_code_pipeline():
    events = []
    code = CodePipeline()
    src = "def calculate_loss(y_true, y_pred):\n    return (y_true - y_pred) ** 2\n"
    res = code.execute(task_id="t-5", prompt="Calculate complexity", code_str=src, on_event=lambda e: events.append(e))
    assert res["is_valid_syntax"] is True
    assert res["ast_nodes_evaluated"] > 0
    assert len(events) >= 3

def test_research_pipeline():
    events = []
    research = ResearchPipeline()
    res = research.execute(task_id="t-6", prompt="Attention mechanisms in neural workflows", on_event=lambda e: events.append(e))
    assert len(res["citations_extracted"]) > 0
    assert len(events) >= 3

def test_study_pipeline():
    events = []
    study = StudyPipeline()
    res = study.execute(task_id="t-7", prompt="Teach backpropagation step-by-step", on_event=lambda e: events.append(e))
    assert len(res["curriculum_outline"]) > 0
    assert len(events) >= 3
