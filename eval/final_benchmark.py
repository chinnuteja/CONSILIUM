"""
Final 30-case benchmark on Pro for submission.
Same seed (42), same DDXPlus subset, same Config B architecture.
"""
import sys
import json
import subprocess
import time
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from eval.audit_harness import Case, run_benchmark

with open(ROOT / "data" / "release_conditions.json", "r", encoding="utf-8") as f:
    CONDITION_LABELS = sorted(json.loads(f.read()))


case_counter = [0]

def consilium_get_differential(case: Case):
    case_counter[0] += 1
    print(f"  [{case_counter[0]}/30] Processing case {case.case_id} ({case.pathology})...", flush=True)
    case_dict = {
        "case_id": f"ddxplus_{case.case_id}",
        "question": f"Age: {case.age}, Sex: {case.sex}. Chief complaint: {case.initial_evidence}. What is the most likely diagnosis?",
        "options": {l: l for l in CONDITION_LABELS},
        "answer": case.pathology,
        "evidence": []
    }

    for i, e in enumerate(case.evidence):
        case_dict["evidence"].append({"kind": "Symptom", "code": f"E{i}", "text": e})

    temp_file = ROOT / "data" / "current_case.json"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(case_dict, f)

    jac_path = ROOT / ".venv" / "Scripts" / "jac.exe"
    jac_file = ROOT / "src" / "consilium_benchmark_runner.jac"

    time.sleep(1)

    result = subprocess.run([str(jac_path), "run", str(jac_file)], capture_output=True, text=True)

    if result.returncode != 0:
        print(f"  [ERROR] Case {case.case_id}: {result.stderr[-200:]}")
        return {"differential": [], "raw_output": result.stdout, "cost_usd": 0.0}

    try:
        raw = result.stdout
        marker = "===CONSILIUM_RESULT==="
        if marker in raw:
            json_str = raw.split(marker)[1].strip().split("\n")[0].strip()
            parsed = json.loads(json_str)
            return {"differential": parsed, "raw_output": raw, "cost_usd": 0.0}
    except Exception as e:
        print(f"  [PARSE ERROR] Case {case.case_id}: {e}")

    return {"differential": [], "raw_output": result.stdout, "cost_usd": 0.0}


if __name__ == "__main__":
    print("=" * 60)
    print("CONSILIUM Final Benchmark: 30 cases, Pro, seed=42")
    print("=" * 60)
    start = time.time()
    result = run_benchmark(consilium_get_differential, n=30, label="final", seed=42)
    elapsed = time.time() - start

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"  Top-1 Accuracy:       {result['top_1_accuracy']:.0%}")
    print(f"  Top-3 Accuracy:       {result['top_3_accuracy']:.0%}")
    print(f"  Pathology-in-top-3:   {result['pathology_in_top3_accuracy']:.0%}")
    print(f"  MRR:                  {result['mrr']:.3f}")
    print(f"  Wall Clock:           {elapsed:.0f}s ({elapsed/60:.1f} min)")
    print(f"  Cost (est):           ${result['estimated_cost_usd']:.2f}")
    print(f"  Results saved:        {result['results_path']}")
    print("=" * 60)
