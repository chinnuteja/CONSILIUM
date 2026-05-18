"""
Generate pre-recorded demo traces for frontend playback.
Runs each case through the full CONSILIUM pipeline (cross-exam ON)
and saves structured event JSONs.
"""
import json
import subprocess
import time
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Load condition labels for options
with open(ROOT / "data" / "release_conditions.json", "r", encoding="utf-8") as f:
    CONDITION_LABELS = sorted(json.loads(f.read()))
OPTIONS = {l: l for l in CONDITION_LABELS}

SPEC_NAMES = [
    "Cardiology", "Endocrinology", "Neurology",
    "Rheumatology", "InfectiousDisease", "Gastroenterology", "Psychiatry"
]

# ── Case definitions ──────────────────────────────────────────────

CASES = {
    "case_a": {
        "case_id": "case_a",
        "vignette": "25-year-old female, 2 days of runny nose, mild cough, low-grade fever (99.2F), sore throat. No travel, no contacts, exam unremarkable.",
        "age": 25,
        "sex": "F",
        "ground_truth": "URTI",
        "question": "Age: 25, Sex: F. Chief complaint: 2 days of runny nose, mild cough, low-grade fever (99.2F), sore throat. No travel, no sick contacts, exam unremarkable. What is the most likely diagnosis?",
        "evidence": [
            {"kind": "Symptom", "code": "E0", "text": "Runny nose for 2 days"},
            {"kind": "Symptom", "code": "E1", "text": "Mild cough, non-productive"},
            {"kind": "Symptom", "code": "E2", "text": "Low-grade fever (99.2F / 37.3C)"},
            {"kind": "Symptom", "code": "E3", "text": "Sore throat, mild"},
            {"kind": "Symptom", "code": "E4", "text": "No travel history"},
            {"kind": "Symptom", "code": "E5", "text": "No sick contacts"},
            {"kind": "Symptom", "code": "E6", "text": "Physical exam unremarkable"},
        ],
    },
    "case_b": {
        "case_id": "case_b",
        "vignette": "45-year-old male with persistent hypertension resistant to 3 medications, unexplained hypokalemia (K+ 2.9), muscle weakness, and polyuria. Labs show elevated aldosterone-to-renin ratio.",
        "age": 45,
        "sex": "M",
        "ground_truth": "Possible NSTEMI / Acute coronary syndrome",
        "question": "Age: 45, Sex: M. Chief complaint: Persistent hypertension resistant to 3 medications, unexplained hypokalemia (K+ 2.9), muscle weakness, and polyuria. Labs show elevated aldosterone-to-renin ratio. What is the most likely diagnosis?",
        "evidence": [
            {"kind": "Symptom", "code": "E0", "text": "Hypertension resistant to 3 antihypertensive medications"},
            {"kind": "Symptom", "code": "E1", "text": "Hypokalemia: K+ 2.9 mEq/L (low)"},
            {"kind": "Symptom", "code": "E2", "text": "Muscle weakness, progressive over 2 months"},
            {"kind": "Symptom", "code": "E3", "text": "Polyuria (increased urination frequency)"},
            {"kind": "Symptom", "code": "E4", "text": "Elevated aldosterone-to-renin ratio"},
            {"kind": "Symptom", "code": "E5", "text": "Metabolic alkalosis on ABG"},
            {"kind": "Symptom", "code": "E6", "text": "No edema"},
            {"kind": "Symptom", "code": "E7", "text": "BMI 28, no cushingoid features"},
            {"kind": "Symptom", "code": "E8", "text": "Family history of early-onset hypertension (father)"},
        ],
    },
    "case_c": {
        "case_id": "case_c",
        "vignette": "67-year-old male with new confusion, fever 102F, BP 80/50, HR 118, recent abdominal surgery 5 days ago.",
        "age": 67,
        "sex": "M",
        "ground_truth": "Sepsis / Possible abdominal sepsis",
        "question": "Age: 67, Sex: M. Chief complaint: New-onset confusion, high fever (102F), hypotension (BP 80/50), tachycardia (HR 118). Recent abdominal surgery 5 days ago. What is the most likely diagnosis?",
        "evidence": [
            {"kind": "Symptom", "code": "E0", "text": "New-onset confusion / altered mental status"},
            {"kind": "Symptom", "code": "E1", "text": "Fever 102F (38.9C)"},
            {"kind": "Symptom", "code": "E2", "text": "Hypotension: BP 80/50 mmHg"},
            {"kind": "Symptom", "code": "E3", "text": "Tachycardia: HR 118 bpm"},
            {"kind": "Symptom", "code": "E4", "text": "Recent abdominal surgery 5 days ago"},
            {"kind": "Symptom", "code": "E5", "text": "Abdominal tenderness on palpation"},
            {"kind": "Symptom", "code": "E6", "text": "WBC 18,000 (elevated)"},
            {"kind": "Symptom", "code": "E7", "text": "Lactate 4.2 mmol/L (elevated)"},
            {"kind": "Symptom", "code": "E8", "text": "Oliguria (low urine output)"},
        ],
    },
}


def run_case(case_id: str, case_def: dict) -> dict:
    """Run a single case through CONSILIUM and parse all output markers."""
    case_data = {
        "case_id": case_def["case_id"],
        "question": case_def["question"],
        "options": OPTIONS,
        "answer": case_def["ground_truth"],
        "evidence": case_def["evidence"],
    }

    temp_file = ROOT / "data" / "current_case.json"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(case_data, f)

    jac_path = ROOT / ".venv" / "Scripts" / "jac.exe"
    jac_file = ROOT / "src" / "demo_trace_runner.jac"

    print(f"  Running {case_id}...", flush=True)
    start = time.time()
    result = subprocess.run(
        [str(jac_path), "run", str(jac_file)],
        capture_output=True, text=True, timeout=1200
    )
    elapsed = time.time() - start
    print(f"  {case_id} completed in {elapsed:.0f}s (exit={result.returncode})", flush=True)

    if result.returncode != 0:
        print(f"  [ERROR] {result.stderr[-500:]}")
        return None

    raw = result.stdout
    parsed = {}

    for marker in ["TRIAGE_RESULT", "SPECIALISTS", "CROSS_EXAM_RESULT", "ADVOCATE", "FINAL_RANKING"]:
        tag = f"==={marker}==="
        if tag in raw:
            try:
                json_str = raw.split(tag)[1].strip().split("\n")[0]
                parsed[marker] = json.loads(json_str)
            except Exception as e:
                print(f"  [WARN] Could not parse {marker}: {e}")
                parsed[marker] = None

    return {"parsed": parsed, "elapsed": elapsed, "raw": raw}


def build_trace(case_id: str, case_def: dict, parsed: dict, elapsed: float) -> dict:
    """Assemble structured trace JSON from parsed output."""
    triage = parsed.get("TRIAGE_RESULT", {})
    specialists_raw = parsed.get("SPECIALISTS", [])
    cross_exam = parsed.get("CROSS_EXAM_RESULT", [])
    advocate = parsed.get("ADVOCATE", {})
    final_ranking = parsed.get("FINAL_RANKING", [])

    events = []
    ts = 0

    # Event: case_received
    events.append({
        "timestamp_ms": ts,
        "type": "case_received",
        "data": {
            "case_id": case_id,
            "vignette": case_def["vignette"],
            "evidence_count": len(case_def["evidence"]),
        }
    })
    ts += 1500

    # Event: triage_decision
    events.append({
        "timestamp_ms": ts,
        "type": "triage_decision",
        "data": triage or {}
    })
    ts += 2000

    # Events: specialist_thinking + specialist_posted
    active_specialists = []
    if specialists_raw:
        for i, spec_hyp in enumerate(specialists_raw):
            if not spec_hyp or not spec_hyp.get("diagnosis_name"):
                continue
            spec_name = SPEC_NAMES[i] if i < len(SPEC_NAMES) else f"Specialist_{i}"

            events.append({
                "timestamp_ms": ts,
                "type": "specialist_thinking",
                "data": {"specialty": spec_name}
            })
            ts += 1500

            events.append({
                "timestamp_ms": ts,
                "type": "specialist_posted",
                "data": {
                    "specialty": spec_name,
                    "diagnosis": spec_hyp.get("diagnosis_name", ""),
                    "confidence": spec_hyp.get("confidence", 0.0),
                    "reasoning": spec_hyp.get("rationale", ""),
                    "citations": spec_hyp.get("citations", []),
                }
            })
            ts += 2000
            active_specialists.append(spec_name)

    # Events: cross-exam (challenge_posted + response_posted)
    if cross_exam:
        for cx in cross_exam:
            events.append({
                "timestamp_ms": ts,
                "type": "challenge_posted",
                "data": {
                    "from_specialty": cx.get("challenger", ""),
                    "to_specialty": cx.get("responder", ""),
                    "question": cx.get("question", ""),
                }
            })
            ts += 2000

            events.append({
                "timestamp_ms": ts,
                "type": "response_posted",
                "data": {
                    "from_specialty": cx.get("responder", ""),
                    "action": cx.get("action", "DEFEND"),
                    "revised_diagnosis": cx.get("revised_diagnosis", ""),
                    "revised_confidence": cx.get("revised_confidence", 0.0),
                    "response_text": cx.get("response", ""),
                }
            })
            ts += 2000

    # Event: devils_advocate (only if present)
    if advocate and advocate.get("diagnosis_name"):
        events.append({
            "timestamp_ms": ts,
            "type": "devils_advocate",
            "data": {
                "alternative_diagnosis": advocate.get("diagnosis_name", ""),
                "confidence": advocate.get("confidence", 0.0),
                "reasoning": advocate.get("rationale", ""),
                "citations": advocate.get("citations", []),
            }
        })
        ts += 2000

    # Event: final_differential
    events.append({
        "timestamp_ms": ts,
        "type": "final_differential",
        "data": {
            "top_3": final_ranking or []
        }
    })

    return {
        "case_id": case_id,
        "vignette": case_def["vignette"],
        "age": case_def["age"],
        "sex": case_def["sex"],
        "ground_truth": case_def["ground_truth"],
        "compute_time_seconds": round(elapsed, 1),
        "events": events,
    }


def verify_trace(trace: dict) -> list[str]:
    """Verify trace quality, return list of issues (empty = OK)."""
    issues = []
    events = trace["events"]
    case_id = trace["case_id"]

    # Check timestamps monotonically increasing
    for i in range(1, len(events)):
        if events[i]["timestamp_ms"] <= events[i-1]["timestamp_ms"]:
            issues.append(f"Non-monotonic timestamp at event {i}")

    event_types = [e["type"] for e in events]

    # Required for ALL cases
    for req in ["case_received", "triage_decision", "final_differential"]:
        if req not in event_types:
            issues.append(f"Missing required event: {req}")

    triage = next((e for e in events if e["type"] == "triage_decision"), None)
    complexity = triage["data"].get("case_complexity", "") if triage else ""

    # SIMPLE: no cross-exam, no devil's advocate
    if case_id == "case_a":
        if "challenge_posted" in event_types:
            issues.append("SIMPLE case should NOT have cross-exam events")
        if "devils_advocate" in event_types:
            issues.append("SIMPLE case should NOT have devil's advocate")

    # MODERATE: should have specialists and cross-exam, no devil's advocate
    if case_id == "case_b":
        if "specialist_posted" not in event_types:
            issues.append("MODERATE case should have specialist events")
        if "challenge_posted" not in event_types:
            issues.append("MODERATE case should have cross-exam events")

    # COMPLEX: should have specialists, cross-exam, and devil's advocate
    if case_id == "case_c":
        if "specialist_posted" not in event_types:
            issues.append("COMPLEX case should have specialist events")
        if "challenge_posted" not in event_types:
            issues.append("COMPLEX case should have cross-exam events")
        if "devils_advocate" not in event_types:
            issues.append("COMPLEX case should have devil's advocate")

    # Check specialist citations
    for e in events:
        if e["type"] == "specialist_posted":
            if not e["data"].get("citations"):
                issues.append(f"Specialist {e['data'].get('specialty','')} missing citations")

    return issues


if __name__ == "__main__":
    print("=" * 60)
    print("CONSILIUM Demo Trace Generator")
    print("=" * 60)

    traces_dir = ROOT / "demo" / "traces"
    traces_dir.mkdir(parents=True, exist_ok=True)

    total_start = time.time()

    for case_id, case_def in CASES.items():
        print(f"\n--- {case_id.upper()} ---")
        result = run_case(case_id, case_def)
        if result is None:
            print(f"  FAILED — skipping {case_id}")
            continue

        trace = build_trace(case_id, case_def, result["parsed"], result["elapsed"])

        # Verify
        issues = verify_trace(trace)
        if issues:
            print(f"  ISSUES: {issues}")
        else:
            print(f"  Verification: PASS")

        # Save
        out_path = traces_dir / f"{case_id}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(trace, f, indent=2, ensure_ascii=False)
        print(f"  Saved: {out_path}")
        print(f"  Events: {len(trace['events'])}, Compute: {trace['compute_time_seconds']}s")

        time.sleep(2)

    total_elapsed = time.time() - total_start
    print(f"\n{'='*60}")
    print(f"All traces generated in {total_elapsed:.0f}s ({total_elapsed/60:.1f} min)")
    print(f"{'='*60}")
