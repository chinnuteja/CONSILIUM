"""
Smoke test for TriageWalker: 5 vignettes (2 SIMPLE, 2 MODERATE, 1 COMPLEX).
Runs each through the full pipeline and prints the TriageDecision.
Uses Flash for smoke testing (cheap iteration).
"""
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Temporarily switch to Flash-Lite for triage smoke (already set) and Flash for specialists
# The triage model is already flash-lite. Specialists will use whatever is in models.jac.
# For smoke test cost savings, we only care about triage decisions.

VIGNETTES = [
    {
        "id": "smoke_simple_1",
        "label": "SIMPLE — common cold / URTI",
        "question": "Age: 25, Sex: F. Chief complaint: 2 days of runny nose, cough, and low-grade fever. What is the most likely diagnosis?",
        "evidence": [
            {"kind": "Symptom", "code": "E0", "text": "Runny nose for 2 days"},
            {"kind": "Symptom", "code": "E1", "text": "Nonproductive cough"},
            {"kind": "Symptom", "code": "E2", "text": "Low-grade fever 99.5F"},
            {"kind": "Symptom", "code": "E3", "text": "No red flags on examination"},
            {"kind": "Symptom", "code": "E4", "text": "Normal vital signs"},
        ],
        "expected_complexity": "SIMPLE",
    },
    {
        "id": "smoke_simple_2",
        "label": "SIMPLE — UTI / urinary symptoms",
        "question": "Age: 32, Sex: M. Chief complaint: 1 day of burning urination and mild suprapubic discomfort. What is the most likely diagnosis?",
        "evidence": [
            {"kind": "Symptom", "code": "E0", "text": "Burning sensation during urination for 1 day"},
            {"kind": "Symptom", "code": "E1", "text": "Mild suprapubic discomfort"},
            {"kind": "Symptom", "code": "E2", "text": "No fever"},
            {"kind": "Symptom", "code": "E3", "text": "No flank pain"},
            {"kind": "Symptom", "code": "E4", "text": "Normal vital signs"},
        ],
        "expected_complexity": "SIMPLE",
    },
    {
        "id": "smoke_moderate_1",
        "label": "MODERATE — exertional chest pain + diabetes",
        "question": "Age: 55, Sex: M. Chief complaint: intermittent chest pain on exertion for 2 weeks with controlled diabetes. What is the most likely diagnosis?",
        "evidence": [
            {"kind": "Symptom", "code": "E0", "text": "Intermittent chest pain on exertion for 2 weeks"},
            {"kind": "Symptom", "code": "E1", "text": "Controlled diabetes mellitus type 2"},
            {"kind": "Symptom", "code": "E2", "text": "No acute findings on examination"},
            {"kind": "Symptom", "code": "E3", "text": "Normal ECG at rest"},
            {"kind": "Symptom", "code": "E4", "text": "Blood pressure 135/85"},
        ],
        "expected_complexity": "MODERATE",
        "expected_specialties": ["cardiology", "endocrinology"],
    },
    {
        "id": "smoke_moderate_2",
        "label": "MODERATE — joint pain + rash + fatigue",
        "question": "Age: 42, Sex: F. Chief complaint: 3 months of joint pain, morning stiffness, fatigue, and mild rash. What is the most likely diagnosis?",
        "evidence": [
            {"kind": "Symptom", "code": "E0", "text": "Joint pain in hands and wrists for 3 months"},
            {"kind": "Symptom", "code": "E1", "text": "Morning stiffness lasting over 1 hour"},
            {"kind": "Symptom", "code": "E2", "text": "Persistent fatigue"},
            {"kind": "Symptom", "code": "E3", "text": "Mild malar rash on face"},
            {"kind": "Symptom", "code": "E4", "text": "No fever, normal vital signs"},
        ],
        "expected_complexity": "MODERATE",
        "expected_specialties": ["rheumatology", "infectious_disease"],
    },
    {
        "id": "smoke_complex_1",
        "label": "COMPLEX — confusion + fever + hypotension post-surgery",
        "question": "Age: 67, Sex: M. Chief complaint: new confusion, fever 102F, blood pressure 80/50 after recent abdominal surgery. What is the most likely diagnosis?",
        "evidence": [
            {"kind": "Symptom", "code": "E0", "text": "New onset confusion and altered mental status"},
            {"kind": "Symptom", "code": "E1", "text": "Fever 102F (38.9C)"},
            {"kind": "Symptom", "code": "E2", "text": "Blood pressure 80/50 (hypotension)"},
            {"kind": "Symptom", "code": "E3", "text": "Recent abdominal surgery 5 days ago"},
            {"kind": "Symptom", "code": "E4", "text": "Heart rate 115 bpm (tachycardia)"},
            {"kind": "Symptom", "code": "E5", "text": "White blood cell count elevated"},
        ],
        "expected_complexity": "COMPLEX",
    },
]


def load_condition_labels():
    with open(ROOT / "data" / "release_conditions.json", "r", encoding="utf-8") as f:
        return sorted(json.loads(f.read()))


def run_vignette(vignette):
    labels = load_condition_labels()
    case_dict = {
        "case_id": vignette["id"],
        "question": vignette["question"],
        "options": {l: l for l in labels},
        "answer": "SMOKE_TEST",
        "evidence": vignette["evidence"],
    }

    temp_file = ROOT / "data" / "current_case.json"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(case_dict, f)

    jac_path = ROOT / ".venv" / "Scripts" / "jac.exe"
    jac_file = ROOT / "src" / "consilium_benchmark_runner.jac"

    start = time.time()
    result = subprocess.run(
        [str(jac_path), "run", str(jac_file)],
        capture_output=True, text=True,
        cwd=str(ROOT),
    )
    elapsed = time.time() - start

    return result, elapsed


def extract_triage_from_output(stdout):
    """Extract triage decision from Jac runner output.
    The TriageDecision is attached to the patient node; we need to parse it from
    the moderator's triage dict which gets printed as part of debug output.
    For the smoke test, we'll also check the CONSILIUM_RESULT marker."""
    lines = stdout.strip().split("\n")
    result_data = {}

    marker = "===CONSILIUM_RESULT==="
    if marker in stdout:
        json_str = stdout.split(marker)[1].strip().split("\n")[0].strip()
        try:
            result_data["final_output"] = json.loads(json_str)
        except Exception:
            result_data["final_output"] = json_str

    # Also look for triage info
    marker2 = "===TRIAGE_RESULT==="
    if marker2 in stdout:
        json_str = stdout.split(marker2)[1].strip().split("\n")[0].strip()
        try:
            result_data["triage"] = json.loads(json_str)
        except Exception:
            result_data["triage"] = json_str

    return result_data


if __name__ == "__main__":
    print("=" * 70)
    print("CONSILIUM Triage Smoke Test — 5 Vignettes")
    print("=" * 70)

    for i, vignette in enumerate(VIGNETTES):
        print(f"\n{'='*70}")
        print(f"VIGNETTE {i+1}/5: {vignette['label']}")
        print(f"  ID: {vignette['id']}")
        print(f"  Expected complexity: {vignette['expected_complexity']}")
        if "expected_specialties" in vignette:
            print(f"  Expected specialties: {vignette.get('expected_specialties', [])}")
        print(f"{'='*70}")

        result, elapsed = run_vignette(vignette)

        if result.returncode != 0:
            print(f"  [ERROR] Return code {result.returncode}")
            print(f"  STDERR: {result.stderr[-500:]}")
            continue

        parsed = extract_triage_from_output(result.stdout)

        print(f"  Runtime: {elapsed:.1f}s")

        if "triage" in parsed and isinstance(parsed["triage"], dict):
            t = parsed["triage"]
            print(f"  TRIAGE DECISION:")
            print(f"    case_complexity:          {t.get('case_complexity', 'N/A')}")
            print(f"    confident_diagnosis:      {t.get('confident_diagnosis', 'N/A')}")
            print(f"    confidence:               {t.get('confidence', 'N/A')}")
            print(f"    red_flags:                {t.get('red_flags', [])}")
            print(f"    recommended_specialties:  {t.get('recommended_specialties', [])}")
            print(f"    reasoning:                {t.get('reasoning', 'N/A')}")

            # Check against expected
            expected = vignette["expected_complexity"]
            actual = t.get("case_complexity", "N/A")
            match = "✅" if actual == expected else "❌"
            print(f"  MATCH: {match} (expected={expected}, actual={actual})")
        else:
            print(f"  [WARNING] No triage data found in output")
            print(f"  Raw stdout (last 500 chars): {result.stdout[-500:]}")

        if "final_output" in parsed:
            print(f"  FINAL OUTPUT: {json.dumps(parsed['final_output'], indent=2)}")

        time.sleep(2)  # pacing

    print(f"\n{'='*70}")
    print("SMOKE TEST COMPLETE")
    print(f"{'='*70}")
