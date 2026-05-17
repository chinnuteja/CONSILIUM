import from json_loader { load_json, dumps_json }
import from sleep { do_sleep }
import from dotenv { load_dotenv }
import from moderator { ModeratorWalker }
import from schema { History, Lab, Patient, Question, Symptom }

with entry {
    load_dotenv();
    print("DRY RUN: All imports resolved successfully.");
    print("DRY RUN: Testing json_loader...");
    test_out = dumps_json([{"diagnosis": "Test", "confidence": 0.85}]);
    print("DRY RUN: dumps_json OK => " + test_out);
    print("DRY RUN: Testing graph construction...");
    patient = Patient(case_id="dry_run", question="test?", options={"A": "Test"}, ground_truth="Test");
    patient ++> Question(text="test?");
    patient ++> Symptom(code="S1", text="headache");
    root ++> patient;
    print("DRY RUN: Graph construction OK.");
    print("DRY RUN: All syntax and imports verified. Ready for benchmark.");
}
