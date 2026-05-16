edge Presents {}
edge Supports {}
edge RaisesQuestion {}

node Patient {
    has case_id: str;
    has question: str;
    has options: dict;
    has ground_truth: str;
    has phase: str = "INITIAL";
}

node Symptom {
    has code: str;
    has text: str;
}

node Lab {
    has code: str;
    has text: str;
}

node History {
    has code: str;
    has text: str;
}

node Question {
    has text: str;
}

node Hypothesis {
    has specialist: str;
    has diagnosis_name: str;
    has confidence: float;
    has rationale: str;
    has citations: list[str];
    has benchmark_label: str = "";
}

obj EvidenceAssessment {
    has relevance_score: int;
    has assessment: str;
}

obj HypothesisDraft {
    has diagnosis_name: str;
    has confidence: float;
    has rationale: str;
}
