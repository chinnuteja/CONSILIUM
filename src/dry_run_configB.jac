import from json_loader { load_json, dumps_json }
import from sleep { do_sleep }
import from dotenv { load_dotenv }
import from moderator_lean { ModeratorLeanWalker }
import from schema { History, Lab, Patient, Question, Symptom }

with entry {
    load_dotenv();
    print("DRY RUN CONFIG B: All imports resolved successfully.");
    patient = Patient(case_id="dry_run", question="test?", options={"A": "Test"}, ground_truth="Test");
    patient ++> Question(text="test?");
    patient ++> Symptom(code="S1", text="headache");
    patient ++> Symptom(code="S2", text="fever");
    root ++> patient;
    print("DRY RUN CONFIG B: Graph construction OK.");
    print("DRY RUN CONFIG B: All syntax verified. Ready for comparison.");
}
