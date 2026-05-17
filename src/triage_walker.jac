import from sleep { do_sleep }
import from byllm.lib { Model }
import from json_utils { safe_json_parse }
import from models { LLM_MAX_TOKENS, LLM_REASONING_EFFORT, TRIAGE_MODEL }
import from schema { Patient, Symptom, Lab, History, TriageDecision }
import from labels { get_labels_text }

glob triage_model = Model(model_name=TRIAGE_MODEL, call_params={"max_tokens": LLM_MAX_TOKENS, "reasoning_effort": LLM_REASONING_EFFORT});

def triage_classify(patient_info: str, evidence_list: str, labels_text: str) -> str by triage_model();
sem triage_classify = "You are a triage physician evaluating whether a case needs specialist consultation.\n\nClassify this case:\n- SIMPLE: common, straightforward presentation any general physician would confidently diagnose (e.g., uncomplicated viral URI, simple UTI, common migraine, mild allergic rhinitis). Name the diagnosis confidently.\n- MODERATE: ambiguous case that benefits from focused specialist input. Recommend 1-3 relevant specialties from: cardiology, endocrinology, neurology, rheumatology, infectious_disease, gastroenterology, psychiatry.\n- COMPLEX: multi-system involvement, red flags present, or atypical presentation requiring full multi-specialty review.\n\nRed flags (any of these forces COMPLEX):\n- Hemodynamic instability (low BP, tachycardia, signs of shock)\n- Neurological deficits (weakness, aphasia, vision change, altered mental status)\n- Suspected malignancy\n- Suspected severe infection (sepsis, meningitis, endocarditis)\n- Multi-system involvement\n- Atypical or rapidly progressive presentation\n- Immunocompromise\n\nBe honest about complexity. Do NOT over-call SIMPLE (we'd miss things). Do NOT over-call COMPLEX (we'd give scary reports for benign conditions).\n\nSPECIALTY ROUTING HINTS (apply as defaults for MODERATE cases):\n- Fever + respiratory symptoms → include infectious_disease\n- Fever + rash → include infectious_disease AND rheumatology\n- Chest pain → include cardiology\n- Severe acute headache → include neurology AND infectious_disease\n- Joint pain + systemic symptoms → include rheumatology\n- Unexplained weight changes → include endocrinology\n- For MODERATE cases with uncertainty, recommend MINIMUM 2 specialists, never just 1.\n\nOutput ONLY valid JSON in this exact schema:\n{\"case_complexity\": \"SIMPLE\" or \"MODERATE\" or \"COMPLEX\", \"confident_diagnosis\": \"<one diagnosis from allowed labels, or empty string>\", \"confidence\": <float between 0.0 and 1.0>, \"red_flags\": [\"<flag 1>\", ...], \"recommended_specialties\": [\"cardiology\", ...] or [] if SIMPLE or [\"ALL\"] for COMPLEX, \"reasoning\": \"<one paragraph explaining your classification>\"}";

def safe_triage_classify(patient_info: str, evidence_list: str, labels_text: str) -> str {
    for attempt in range(3) {
        try {
            return triage_classify(patient_info, evidence_list, labels_text);
        } except Exception as e {
            if attempt == 2 { raise e; }
            do_sleep(2 ** attempt);
        }
    }
    return "{}";
}

walker TriageWalker {
    has patient_info: str = "";
    has evidence_lines: list[str] = [];
    has triage_result: dict = {};

    can plan_path with Patient entry {
        self.patient_info = here.question;
        visit [-->];
    }

    can post_triage with Patient exit {
        evidence_text = "\n".join(self.evidence_lines);
        labels_text = get_labels_text();

        try {
            raw = safe_triage_classify(self.patient_info, evidence_text, labels_text);
            parsed = safe_json_parse(raw);

            complexity = str(parsed.get("case_complexity", "COMPLEX")).upper();
            if complexity not in ["SIMPLE", "MODERATE", "COMPLEX"] {
                complexity = "COMPLEX";
            }

            red_flags_raw = parsed.get("red_flags", []);
            red_flags: list[str] = list(red_flags_raw) if isinstance(red_flags_raw, list) else [];

            rec_specs_raw = parsed.get("recommended_specialties", []);
            rec_specs: list[str] = list(rec_specs_raw) if isinstance(rec_specs_raw, list) else [];

            if len(red_flags) > 0 and complexity != "COMPLEX" {
                complexity = "COMPLEX";
                rec_specs = ["ALL"];
            }

            if complexity == "COMPLEX" {
                rec_specs = ["ALL"];
            }

            conf_diag = str(parsed.get("confident_diagnosis", ""));
            conf_score = float(str(parsed.get("confidence", 0.0)));
            reasoning_text = str(parsed.get("reasoning", ""));

            triage_node = TriageDecision(
                case_complexity=complexity,
                confident_diagnosis=conf_diag,
                confidence=conf_score,
                red_flags=red_flags,
                recommended_specialties=rec_specs,
                reasoning=reasoning_text
            );
            here ++> triage_node;

            self.triage_result = {
                "case_complexity": complexity,
                "confident_diagnosis": conf_diag,
                "confidence": conf_score,
                "red_flags": red_flags,
                "recommended_specialties": rec_specs,
                "reasoning": reasoning_text
            };
        } except Exception {
            triage_node = TriageDecision(
                case_complexity="COMPLEX",
                confident_diagnosis="",
                confidence=0.0,
                red_flags=[],
                recommended_specialties=["ALL"],
                reasoning="Triage failed; defaulting to full council"
            );
            here ++> triage_node;

            self.triage_result = {
                "case_complexity": "COMPLEX",
                "confident_diagnosis": "",
                "confidence": 0.0,
                "red_flags": [],
                "recommended_specialties": ["ALL"],
                "reasoning": "Triage failed; defaulting to full council"
            };
        }
    }

    can examine_symptom with Symptom entry {
        self.evidence_lines = self.evidence_lines + [f"{here.code}: {here.text}"];
    }

    can examine_lab with Lab entry {
        self.evidence_lines = self.evidence_lines + [f"{here.code}: {here.text}"];
    }

    can examine_history with History entry {
        self.evidence_lines = self.evidence_lines + [f"{here.code}: {here.text}"];
    }
}
