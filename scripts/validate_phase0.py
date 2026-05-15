"""Validate Phase 0 setup for CONSILIUM."""

import json
import os
import subprocess
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

print("=" * 70)
print("CONSILIUM Phase 0 Validation")
print("=" * 70)

# Jac version
print("\n[1] Jac version")
try:
    result = subprocess.run(
        [str(ROOT / ".venv" / "Scripts" / "jac.exe"), "--version"],
        capture_output=True,
        text=True,
        check=False,
    )
    version_line = next((line.strip() for line in result.stdout.splitlines() if "Version:" in line), "unknown")
    print(f"  ✓ {version_line}")
except Exception as exc:
    print(f"  ✗ Could not run jac --version: {exc}")

# DDXPlus
print("\n[2] DDXPlus validate CSV")
ddx_path = DATA / "ddxplus_validate.csv"
print(f"  Exists: {ddx_path.exists()}")
print(f"  Size MB: {ddx_path.stat().st_size / 1024 / 1024:.2f}" if ddx_path.exists() else "  Size MB: n/a")
if ddx_path.exists():
    ddx = pd.read_csv(ddx_path, nrows=3)
    print(f"  Columns: {list(ddx.columns)}")
    required = {"AGE", "SEX", "INITIAL_EVIDENCE", "EVIDENCES", "PATHOLOGY", "DIFFERENTIAL_DIAGNOSIS"}
    print(f"  Required columns present: {required.issubset(set(ddx.columns))}")
    print("  Sample rows:")
    for idx, row in ddx.iterrows():
        print(f"    - AGE={row.get('AGE')} SEX={row.get('SEX')} PATHOLOGY={row.get('PATHOLOGY')}")

# Supporting files
print("\n[3] DDXPlus support JSON files")
for name in ["release_evidences.json", "release_conditions.json"]:
    path = DATA / name
    print(f"  {name}: exists={path.exists()}, size_kb={(path.stat().st_size / 1024):.1f}" if path.exists() else f"  {name}: missing")

# MedQA
print("\n[4] MedQA test JSON")
medqa_path = DATA / "medqa_test.json"
print(f"  Exists: {medqa_path.exists()}")
print(f"  Size MB: {medqa_path.stat().st_size / 1024 / 1024:.2f}" if medqa_path.exists() else "  Size MB: n/a")
if medqa_path.exists():
    with open(medqa_path, "r", encoding="utf-8") as f:
        first_line = f.readline()
    sample = json.loads(first_line)
    print(f"  Sample keys: {list(sample.keys())}")
    required = {"question", "options", "answer", "answer_idx", "meta_info"}
    print(f"  Required schema present: {required.issubset(set(sample.keys()))}")
    print(f"  Sample answer: {sample.get('answer')} / {sample.get('answer_idx')}")

# Env/gitignore
print("\n[5] Environment files")
print(f"  .env.example exists: {(ROOT / '.env.example').exists()}")
print(f"  .env exists: {(ROOT / '.env').exists()}")
print(f"  .gitignore exists: {(ROOT / '.gitignore').exists()}")

print("\n" + "=" * 70)
print("Phase 0 validation complete")
print("=" * 70)
