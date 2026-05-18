import from sleep { do_sleep }
import from byllm.lib { Model }
import from json_utils { safe_json_parse }
import from models { LLM_MAX_TOKENS, LLM_REASONING_EFFORT, SPECIALIST_MODEL }
import from schema { Patient, ChallengeQuestion, ResponseHypothesis, Challenges }

glob cross_exam_model = Model(
    model_name=SPECIALIST_MODEL,
    call_params={"max_tokens": LLM_MAX_TOKENS, "reasoning_effort": LLM_REASONING_EFFORT}
);

# --- LLM-backed functions ---

def generate_challenge(
    challenger_spec: str,
    target_spec: str,
    target_diagnosis: str,
    target_rationale: str,
    patient_question: str,
    evidence_summary: str
) -> str by cross_exam_model();

sem generate_challenge = "You are a medical specialist acting as a peer reviewer. Another specialist has proposed a diagnosis. Your job is to pose ONE pointed challenge question that highlights a weakness, alternative interpretation, or overlooked evidence in their reasoning. Be specific and clinically relevant. Do NOT agree — find a genuine concern.\n\nOutput ONLY valid JSON:\n{\"question_text\": \"<your challenge question>\", \"reasoning\": \"<why this challenges the proposed diagnosis>\"}";

def generate_response(
    responder_spec: str,
    original_diagnosis: str,
    original_rationale: str,
    challenge_question: str,
    challenger_spec: str,
    patient_question: str,
    evidence_summary: str,
    options_text: str
) -> str by cross_exam_model();

sem generate_response = "You are a medical specialist defending or revising your diagnosis after receiving a challenge question from a peer. Consider the challenge carefully. You may: (1) defend your original diagnosis with additional reasoning, (2) revise your diagnosis to a different one from the allowed options, or (3) adjust your confidence. Be intellectually honest.\n\nOutput ONLY valid JSON:\n{\"revised_diagnosis\": \"<diagnosis from allowed options>\", \"revised_confidence\": <float 0.0-1.0>, \"response_text\": \"<your response addressing the challenge>\", \"conceded\": <true if you changed diagnosis, false if defending>}";

# --- Safe wrappers with retry ---

def safe_generate_challenge(
    challenger_spec: str,
    target_spec: str,
    target_diagnosis: str,
    target_rationale: str,
    patient_question: str,
    evidence_summary: str
) -> str {
    for attempt in range(3) {
        try {
            return generate_challenge(
                challenger_spec, target_spec, target_diagnosis,
                target_rationale, patient_question, evidence_summary
            );
        } except Exception as e {
            if attempt == 2 { raise e; }
            do_sleep(2 ** attempt);
        }
    }
}

def safe_generate_response(
    responder_spec: str,
    original_diagnosis: str,
    original_rationale: str,
    challenge_question: str,
    challenger_spec: str,
    patient_question: str,
    evidence_summary: str,
    options_text: str
) -> str {
    for attempt in range(3) {
        try {
            return generate_response(
                responder_spec, original_diagnosis, original_rationale,
                challenge_question, challenger_spec, patient_question,
                evidence_summary, options_text
            );
        } except Exception as e {
            if attempt == 2 { raise e; }
            do_sleep(2 ** attempt);
        }
    }
}

# --- Cross-Examination Runner ---
# Called by moderator with specialist_hypotheses list.
# Returns list of response dicts (may be empty if <2 specialists).

def run_cross_examination(
    patient_node: Patient,
    specialist_hypotheses: list[dict],
    evidence_summary: str
) -> list[dict] {
    responses: list[dict] = [];

    # Guard: need at least 2 specialists to cross-examine
    if len(specialist_hypotheses) < 2 {
        return responses;
    }

    # Each specialist challenges ONE other specialist (round-robin)
    for i in range(len(specialist_hypotheses)) {
        challenger = specialist_hypotheses[i];
        # Target the next specialist in the list (wrap around)
        target_idx = (i + 1) % len(specialist_hypotheses);
        target = specialist_hypotheses[target_idx];

        challenger_name = str(challenger.get("specialist", "Unknown"));
        target_name = str(target.get("specialist", "Unknown"));
        target_diag = str(target.get("diagnosis_name", ""));
        target_rationale = str(target.get("rationale", ""));

        # Skip if target has no real diagnosis
        if target_diag == "" or target_diag == "REJECTED_NO_CITATIONS" {
            continue;
        }

        # --- Generate challenge question ---
        try {
            raw_q = safe_generate_challenge(
                challenger_name, target_name, target_diag,
                target_rationale, patient_node.question, evidence_summary
            );
            q_parsed = safe_json_parse(raw_q);

            cq = ChallengeQuestion(
                challenger_specialist=challenger_name,
                target_specialist=target_name,
                target_diagnosis=target_diag,
                question_text=str(q_parsed.get("question_text", "")),
                reasoning=str(q_parsed.get("reasoning", ""))
            );
            patient_node ++> cq;
        } except Exception {
            continue;
        }

        # --- Generate response from target ---
        try {
            raw_r = safe_generate_response(
                target_name, target_diag, target_rationale,
                str(q_parsed.get("question_text", "")),
                challenger_name, patient_node.question,
                evidence_summary, str(patient_node.options)
            );
            r_parsed = safe_json_parse(raw_r);

            rh = ResponseHypothesis(
                responder_specialist=target_name,
                original_diagnosis=target_diag,
                revised_diagnosis=str(r_parsed.get("revised_diagnosis", target_diag)),
                revised_confidence=float(r_parsed.get("revised_confidence", target.get("confidence", 0.5))),
                response_text=str(r_parsed.get("response_text", "")),
                conceded=bool(r_parsed.get("conceded", False))
            );
            cq :Challenges:> rh;

            responses = responses + [{
                "responder": target_name,
                "challenger": challenger_name,
                "original_diagnosis": target_diag,
                "revised_diagnosis": str(r_parsed.get("revised_diagnosis", target_diag)),
                "revised_confidence": float(r_parsed.get("revised_confidence", target.get("confidence", 0.5))),
                "conceded": bool(r_parsed.get("conceded", False)),
                "question": str(q_parsed.get("question_text", "")),
                "response": str(r_parsed.get("response_text", ""))
            }];
        } except Exception {
            continue;
        }
    }

    return responses;
}
