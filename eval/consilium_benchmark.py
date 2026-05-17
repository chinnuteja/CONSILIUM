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

def consilium_get_differential(case: Case):
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
    
    # pacing
    time.sleep(2)
    
    start_time = time.time()
    result = subprocess.run([str(jac_path), "run", str(jac_file)], capture_output=True, text=True)
    cost = 0.0 # difficult to track exactly, estimate later
    
    if result.returncode != 0:
        print("Jac Error:", result.stderr)
        return {"differential": [], "raw_output": result.stdout, "cost_usd": 0.0}
        
    try:
        raw = result.stdout
        marker = "===CONSILIUM_RESULT==="
        if marker in raw:
            json_str = raw.split(marker)[1].strip().split("\n")[0].strip()
            parsed = json.loads(json_str)
            return {"differential": parsed, "raw_output": raw, "cost_usd": 0.0}
    except Exception as e:
        print("Parse Error:", e)
        print("Raw output:", result.stdout)
        
    return {"differential": [], "raw_output": result.stdout, "cost_usd": 0.0}

if __name__ == "__main__":
    count = int(os.getenv("CONSILIUM_BENCHMARK_N", "50"))
    result = run_benchmark(consilium_get_differential, n=count, label="consilium")
    print(json.dumps(result, indent=2, ensure_ascii=False))
