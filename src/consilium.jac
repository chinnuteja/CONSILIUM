import from dotenv { load_dotenv }
import from ingest { get_phase2_medqa_case }
import from moderator { ModeratorWalker }
import from schema { History, Lab, Patient, Question, Symptom }

def build_phase2_graph(case_data: dict) -> Patient {
    patient = Patient(
        case_id=case_data["case_id"],
        question=case_data["question"],
        options=case_data["options"],
        ground_truth=case_data["answer"]
    );
    patient ++> Question(text=case_data["question"]);
    for item in case_data["evidence"] {
        if item["kind"] == "History" {
            patient ++> History(code=item["code"], text=item["text"]);
        } elif item["kind"] == "Symptom" {
            patient ++> Symptom(code=item["code"], text=item["text"]);
        } else {
            patient ++> Lab(code=item["code"], text=item["text"]);
        }
    }
    return patient;
}

with entry {
    load_dotenv();
    case_data = get_phase2_medqa_case();
    patient = build_phase2_graph(case_data);
    root ++> patient;
    moderator = patient spawn ModeratorWalker();
    print("PHASE 2 CONSILIUM DEMO");
    print(f"MedQA case used: {case_data['case_id']}");
    print(f"Ground truth: {case_data['answer']}");
    print("CardiologyWalker hypothesis:");
    print(moderator.cardiology);
    print("EndocrinologyWalker hypothesis:");
    print(moderator.endocrinology);
    print("Per-node by llm() call log:");
    for log in moderator.logs {
        print(log);
    }
    print(f"Hypotheses differ: {moderator.cardiology['diagnosis_name'] != moderator.endocrinology['diagnosis_name']}");
    print(f"Cardiology citations: {len(moderator.cardiology['citations'])}");
    print(f"Endocrinology citations: {len(moderator.endocrinology['citations'])}");
}
