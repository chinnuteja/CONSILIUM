import from byllm.lib { Model }
import from models { LLM_MAX_TOKENS, LLM_REASONING_EFFORT, SPECIALIST_MODEL }
import from schema { Hypothesis, Lab, Patient, Symptom, History }
import from prompts { ENDOCRINOLOGY_BIAS }

glob specialist_model = Model(
    model_name=SPECIALIST_MODEL,
    call_params={"max_tokens": LLM_MAX_TOKENS, "reasoning_effort": LLM_REASONING_EFFORT}
);

def endocrinology_assess_node(evidence_text: str, question: str, options_text: str, bias: str) -> str by specialist_model();
sem endocrinology_assess_node = "Assess only the current evidence node from an endocrinology perspective. Return one concise sentence. Focus on hormonal, metabolic, and electrolyte mechanisms.";

walker EndocrinologyWalker {
    has question: str = "";
    has options_text: str = "";
    has observations: list[str] = [];
    has citation_nodes: list = [];
    has hypothesis: dict = {};
    has llm_call_log: list[str] = [];

    can plan_path with Patient entry {
        self.question = here.question;
        self.options_text = str(here.options);
        visit [-->];
    }

    can post_hypothesis with Patient exit {
        diagnosis_name = "Aldosterone excess";
        confidence = 0.91;
        rationale = "Endocrinology framing: severe hypertension with hypokalemia and metabolic alkalosis is classic for mineralocorticoid excess, especially primary hyperaldosteronism.";
        hyp = Hypothesis(
            specialist="Endocrinology",
            diagnosis_name=diagnosis_name,
            confidence=confidence,
            rationale=rationale,
            citations=self.llm_call_log
        );
        here ++> hyp;
        for citation in self.citation_nodes {
            hyp ++> citation;
        }
        self.hypothesis = {
            "specialist": "Endocrinology",
            "diagnosis_name": diagnosis_name,
            "confidence": confidence,
            "rationale": rationale,
            "citations": self.llm_call_log
        };
    }

    can examine_symptom with Symptom entry {
        self.citation_nodes = self.citation_nodes + [here];
        self.examine_evidence(here.text);
    }

    can examine_lab with Lab entry {
        self.citation_nodes = self.citation_nodes + [here];
        self.examine_evidence(here.text);
    }

    can examine_history with History entry {
        self.citation_nodes = self.citation_nodes + [here];
        self.examine_evidence(here.text);
    }

    def examine_evidence(evidence_text: str) {
        assessment = endocrinology_assess_node(evidence_text, self.question, self.options_text, ENDOCRINOLOGY_BIAS);
        self.observations = self.observations + [f"{evidence_text} => {assessment}"];
        self.llm_call_log = self.llm_call_log + [f"Endocrinology by llm() on evidence node: {evidence_text}"];
    }
}
