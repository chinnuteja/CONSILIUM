import from json_loader { load_json, dumps_json }
import from sleep { do_sleep }
import from dotenv { load_dotenv }
import from moderator { ModeratorWalker }
import from schema { History, Lab, Patient, Question, Symptom }

def build_benchmark_graph(case_data: dict) -> Patient {
    patient = Patient(case_id=case_data["case_id"], question=case_data["question"], options=case_data["options"], ground_truth=case_data["answer"]);
    patient ++> Question(text=case_data["question"]);
    for item in case_data["evidence"] {
        patient ++> Symptom(code=item["code"], text=item["text"]);
    }
    return patient;
}

with entry {
    load_dotenv();
    case_data = load_json("data/current_case.json");
    patient = build_benchmark_graph(case_data);
    root ++> patient;
    # Demo traces run with cross-exam ENABLED (full council mode)
    moderator = patient spawn ModeratorWalker(enable_cross_exam=True);

    # Dump all event data for trace assembly
    print("===TRIAGE_RESULT===");
    print(dumps_json(moderator.triage));

    print("===SPECIALISTS===");
    specs = [moderator.cardiology, moderator.endocrinology, moderator.neurology, moderator.rheumatology, moderator.infectious_disease, moderator.gastroenterology, moderator.psychiatry];
    print(dumps_json(specs));

    print("===CROSS_EXAM_RESULT===");
    print(dumps_json(moderator.cross_exam_responses));

    print("===ADVOCATE===");
    print(dumps_json(moderator.advocate));

    print("===FINAL_RANKING===");
    output = [];
    num_specs = moderator.num_specialists;
    if num_specs < 1 { num_specs = 1; }
    for diag_score in moderator.final_ranking[:3] {
        output = output + [{"diagnosis": diag_score[0], "agreement_score": diag_score[1] / float(num_specs)}];
    }
    print(dumps_json(output));
}
