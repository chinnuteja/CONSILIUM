import from schema { Patient }
import from specialists.cardiology { CardiologyWalker }
import from specialists.endocrinology { EndocrinologyWalker }
import from specialists.neurology { NeurologyWalker }
import from specialists.rheumatology { RheumatologyWalker }
import from specialists.infectious_disease { InfectiousDiseaseWalker }
import from specialists.gastroenterology { GastroenterologyWalker }
import from specialists.psychiatry { PsychiatryWalker }
import from devils_advocate { DevilsAdvocateWalker }
import from triage_walker { TriageWalker }
import from cross_examination { run_cross_examination }
import from sorter { sort_scores }

walker ModeratorWalker {
    has cardiology: dict = {}; has endocrinology: dict = {}; has neurology: dict = {}; has rheumatology: dict = {}; has infectious_disease: dict = {}; has gastroenterology: dict = {}; has psychiatry: dict = {};
    has advocate: dict = {};
    has triage: dict = {};
    has cross_exam_responses: list[dict] = [];
    has logs: list[str] = []; has validation: list[str] = []; has final_ranking: list[tuple] = [];
    has num_specialists: int = 0;

    can moderate with Patient entry {
        # --- TRIAGE PHASE ---
        here.phase = "TRIAGE";
        triage_walker = here spawn TriageWalker();
        self.triage = triage_walker.triage_result;

        complexity = self.triage.get("case_complexity", "COMPLEX");
        confidence = float(self.triage.get("confidence", 0.0));
        red_flags = self.triage.get("red_flags", []);
        rec_specs = self.triage.get("recommended_specialties", []);

        # SIMPLE: high confidence, no red flags -> return triage diagnosis directly
        if complexity == "SIMPLE" and confidence >= 0.90 and len(red_flags) == 0 {
            self.num_specialists = 0;
            self.final_ranking = [(self.triage["confident_diagnosis"], confidence)];
            here.phase = "FINAL";
            return;
        }

        # --- SPECIALIST PHASE ---
        here.phase = "INITIAL";
        specialist_hypotheses: list[dict] = [];

        if complexity == "MODERATE" and "ALL" not in rec_specs {
            # Spawn only recommended specialties
            if "cardiology" in rec_specs {
                w = here spawn CardiologyWalker();
                self.cardiology = w.hypothesis;
                specialist_hypotheses = specialist_hypotheses + [self.cardiology];
                self.logs = self.logs + w.llm_call_log;
            }
            if "endocrinology" in rec_specs {
                w = here spawn EndocrinologyWalker();
                self.endocrinology = w.hypothesis;
                specialist_hypotheses = specialist_hypotheses + [self.endocrinology];
                self.logs = self.logs + w.llm_call_log;
            }
            if "neurology" in rec_specs {
                w = here spawn NeurologyWalker();
                self.neurology = w.hypothesis;
                specialist_hypotheses = specialist_hypotheses + [self.neurology];
                self.logs = self.logs + w.llm_call_log;
            }
            if "rheumatology" in rec_specs {
                w = here spawn RheumatologyWalker();
                self.rheumatology = w.hypothesis;
                specialist_hypotheses = specialist_hypotheses + [self.rheumatology];
                self.logs = self.logs + w.llm_call_log;
            }
            if "infectious_disease" in rec_specs {
                w = here spawn InfectiousDiseaseWalker();
                self.infectious_disease = w.hypothesis;
                specialist_hypotheses = specialist_hypotheses + [self.infectious_disease];
                self.logs = self.logs + w.llm_call_log;
            }
            if "gastroenterology" in rec_specs {
                w = here spawn GastroenterologyWalker();
                self.gastroenterology = w.hypothesis;
                specialist_hypotheses = specialist_hypotheses + [self.gastroenterology];
                self.logs = self.logs + w.llm_call_log;
            }
            if "psychiatry" in rec_specs {
                w = here spawn PsychiatryWalker();
                self.psychiatry = w.hypothesis;
                specialist_hypotheses = specialist_hypotheses + [self.psychiatry];
                self.logs = self.logs + w.llm_call_log;
            }
        } else {
            # COMPLEX or fallback: spawn all 7
            cardiology_walker = here spawn CardiologyWalker();
            endocrinology_walker = here spawn EndocrinologyWalker();
            neurology_walker = here spawn NeurologyWalker();
            rheumatology_walker = here spawn RheumatologyWalker();
            id_walker = here spawn InfectiousDiseaseWalker();
            gi_walker = here spawn GastroenterologyWalker();
            psychiatry_walker = here spawn PsychiatryWalker();

            self.cardiology = cardiology_walker.hypothesis;
            self.endocrinology = endocrinology_walker.hypothesis;
            self.neurology = neurology_walker.hypothesis;
            self.rheumatology = rheumatology_walker.hypothesis;
            self.infectious_disease = id_walker.hypothesis;
            self.gastroenterology = gi_walker.hypothesis;
            self.psychiatry = psychiatry_walker.hypothesis;

            specialist_hypotheses = [self.cardiology, self.endocrinology, self.neurology, self.rheumatology, self.infectious_disease, self.gastroenterology, self.psychiatry];
            self.logs = cardiology_walker.llm_call_log + endocrinology_walker.llm_call_log + neurology_walker.llm_call_log + rheumatology_walker.llm_call_log + id_walker.llm_call_log + gi_walker.llm_call_log + psychiatry_walker.llm_call_log;
        }

        self.num_specialists = len(specialist_hypotheses);

        # Validate citations
        for hyp in specialist_hypotheses {
            self.validation = self.validation + [self.validate_hypothesis(hyp)];
        }

        # --- CROSS-EXAMINATION PHASE ---
        # Only run if >=2 specialists were invoked
        if len(specialist_hypotheses) >= 2 {
            here.phase = "CROSS_EXAM";
            evidence_summary = "\n".join(self.logs);
            self.cross_exam_responses = run_cross_examination(
                here, specialist_hypotheses, evidence_summary
            );
        }

        here.phase = "DEBATE";

        # Build revised maps from cross-exam responses
        # revised_conf_map: specialist::original_diag -> revised_confidence
        # revised_diag_map: specialist::original_diag -> revised_diagnosis (if conceded)
        revised_conf_map: dict = {};
        revised_diag_map: dict = {};
        for resp in self.cross_exam_responses {
            key = str(resp.get("responder", "")) + "::" + str(resp.get("original_diagnosis", ""));
            revised_conf_map[key] = float(resp.get("revised_confidence", 0.0));
            if bool(resp.get("conceded", False)) {
                revised_diag_map[key] = str(resp.get("revised_diagnosis", ""));
            }
        }

        # Aggregate scores — use revised confidence/diagnosis from cross-exam when available
        scores = {};
        for hyp in specialist_hypotheses {
            if "ACCEPTED" in self.validate_hypothesis(hyp) {
                spec = str(hyp.get("specialist", ""));
                orig_diag = hyp["diagnosis_name"];
                lookup_key = spec + "::" + orig_diag;
                # Use revised diagnosis if specialist conceded
                if lookup_key in revised_diag_map {
                    diag = str(revised_diag_map[lookup_key]);
                } else {
                    diag = orig_diag;
                }
                # Use revised confidence if cross-exam produced one
                if lookup_key in revised_conf_map {
                    conf = float(revised_conf_map[lookup_key]);
                } else {
                    conf = float(hyp["confidence"]);
                }
                if diag not in scores { scores[diag] = 0.0; }
                scores[diag] = scores[diag] + conf;
            }
        }

        # Sort to find leading
        sorted_diags = sort_scores(scores);

        if len(sorted_diags) > 0 and complexity == "COMPLEX" {
            leading_diag = sorted_diags[0][0];
            leading_rationale = "";
            for hyp in specialist_hypotheses {
                if hyp["diagnosis_name"] == leading_diag { leading_rationale = hyp["rationale"]; break; }
            }

            here.phase = "ADVERSARIAL";
            adv_walker = here spawn DevilsAdvocateWalker(question=here.question, options_text=str(here.options), leading_diagnosis=leading_diag, leading_rationale=leading_rationale);
            self.advocate = adv_walker.hypothesis;
            self.validation = self.validation + [self.validate_hypothesis(self.advocate)];

            if "ACCEPTED" in self.validate_hypothesis(self.advocate) {
                adv_diag = self.advocate["diagnosis_name"];
                if adv_diag not in scores { scores[adv_diag] = 0.0; }
                scores[adv_diag] = scores[adv_diag] + self.advocate["confidence"];
            }
        }

        here.phase = "FINAL";
        self.final_ranking = sort_scores(scores);
    }

    def validate_hypothesis(hypothesis: dict) -> str {
        if "citations" not in hypothesis or len(hypothesis["citations"]) == 0 { return f"REJECTED {hypothesis.get('specialist', 'Unknown')}: missing citations"; }
        return f"ACCEPTED {hypothesis['specialist']}: {len(hypothesis['citations'])} citations";
    }
}
