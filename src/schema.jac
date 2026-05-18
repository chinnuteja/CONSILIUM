edge Presents {}
edge Supports {}
edge RaisesQuestion {}
edge Challenges {}

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

node TriageDecision {
    has case_complexity: str;
    has confident_diagnosis: str;
    has confidence: float;
    has red_flags: list[str];
    has recommended_specialties: list[str];
    has reasoning: str;
}

node ChallengeQuestion {
    has challenger_specialist: str;
    has target_specialist: str;
    has target_diagnosis: str;
    has question_text: str;
    has reasoning: str;
}

node ResponseHypothesis {
    has responder_specialist: str;
    has original_diagnosis: str;
    has revised_diagnosis: str;
    has revised_confidence: float;
    has response_text: str;
    has conceded: bool;
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
