import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
with open(ROOT / "data" / "release_conditions.json", "r", encoding="utf-8") as f:
    CONDITION_LABELS = sorted(json.loads(f.read()))


def get_labels_text() -> str:
    return "\n".join(CONDITION_LABELS)
