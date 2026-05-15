"""Download DDXPlus and MedQA datasets for CONSILIUM."""

import os
import json
from datasets import load_dataset

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

print("=" * 60)
print("CONSILIUM Dataset Downloader")
print("=" * 60)

# --- DDXPlus (validate split) ---
print("\n[1/3] Downloading DDXPlus validate split...")
ddx = load_dataset("aai530-group6/ddxplus", split="validate")
ddx_path = os.path.join(DATA_DIR, "ddxplus_validate.csv")
ddx.to_csv(ddx_path)
print(f"  ✓ Saved {len(ddx)} rows to {ddx_path}")
print(f"  Columns: {ddx.column_names}")

# --- DDXPlus supporting files ---
print("\n[2/3] Downloading DDXPlus supporting files (evidence map, conditions)...")
# These are in the dataset repo as additional files
try:
    from huggingface_hub import hf_hub_download
    
    evidence_path = hf_hub_download(
        repo_id="aai530-group6/ddxplus",
        filename="release_evidences.json",
        repo_type="dataset",
        local_dir=DATA_DIR,
    )
    print(f"  ✓ release_evidences.json downloaded")
    
    conditions_path = hf_hub_download(
        repo_id="aai530-group6/ddxplus",
        filename="release_conditions.json",
        repo_type="dataset",
        local_dir=DATA_DIR,
    )
    print(f"  ✓ release_conditions.json downloaded")
except Exception as e:
    print(f"  ⚠ Could not download supporting files: {e}")
    print("  → You may need to manually download from https://huggingface.co/datasets/aai530-group6/ddxplus")

# --- MedQA-USMLE ---
print("\n[3/3] Downloading MedQA-USMLE (4-options)...")
medqa = load_dataset("GBaker/MedQA-USMLE-4-options")
# Save the test split
medqa_test = medqa["test"]
medqa_path = os.path.join(DATA_DIR, "medqa_test.json")
medqa_test.to_json(medqa_path)
print(f"  ✓ Saved {len(medqa_test)} questions to {medqa_path}")

# Also save train for potential use
medqa_train = medqa["train"]
print(f"  Train split: {len(medqa_train)} questions (not saving, test is enough for demo)")

print("\n" + "=" * 60)
print("DONE. Dataset summary:")
print(f"  DDXPlus validate: {len(ddx)} rows")
print(f"  MedQA test: {len(medqa_test)} questions")
print("=" * 60)
