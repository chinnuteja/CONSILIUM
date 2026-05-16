import json
import os
import re
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from litellm import completion, completion_cost

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from eval.audit_harness import Case, run_benchmark


ROOT = Path(__file__).resolve().parents[1]


def _load_jac_model_constants() -> dict[str, Any]:
    path = ROOT / "src" / "models.jac"
    constants: dict[str, Any] = {}
    pattern = re.compile(r"^([A-Z_]+)\s*=\s*(.+);$")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line.strip())
        if not match:
            continue
        key, raw_value = match.groups()
        raw_value = raw_value.strip()
        if raw_value.startswith('"') and raw_value.endswith('"'):
            constants[key] = raw_value.strip('"')
        elif raw_value.isdigit():
            constants[key] = int(raw_value)
        elif raw_value in constants:
            constants[key] = constants[raw_value]
    return constants


MODEL_CONFIG = _load_jac_model_constants()
BASELINE_MODEL = MODEL_CONFIG["BASELINE_MODEL"]
LLM_MAX_TOKENS = int(MODEL_CONFIG["LLM_MAX_TOKENS"])
LLM_REASONING_EFFORT = str(MODEL_CONFIG["LLM_REASONING_EFFORT"])
CONDITION_LABELS = sorted(
    json.loads((ROOT / "data" / "release_conditions.json").read_text(encoding="utf-8"))
)


def _get_api_key() -> str:
    load_dotenv(ROOT / ".env")
    keys = [os.getenv("GEMINI_API_KEY"), os.getenv("GOOGLE_API_KEY")]
    for key in keys:
        if key and key.strip() and "your-" not in key:
            return key.strip()
    raise RuntimeError("Missing real GEMINI_API_KEY or GOOGLE_API_KEY in .env")


def _extract_json_array(text: str) -> list[dict[str, Any]]:
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
    except json.JSONDecodeError:
        pass

    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.I | re.S)
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
    except json.JSONDecodeError:
        pass

    match = re.search(r"\[[\s\S]*\]", text)
    if match:
        parsed = json.loads(match.group(0))
        if isinstance(parsed, list):
            return parsed

    objects = []
    for object_match in re.finditer(r"\{[^{}]*\"diagnosis\"[^{}]*\}", text):
        try:
            parsed_object = json.loads(object_match.group(0))
        except json.JSONDecodeError:
            continue
        if isinstance(parsed_object, dict):
            objects.append(parsed_object)
    if objects:
        return objects

    raise ValueError(f"Could not parse JSON array from model output: {text[:300]}")


def _case_prompt(case: Case) -> str:
    evidence_lines = "\n".join(f"- {item}" for item in case.evidence)
    labels = "\n".join(f"- {label}" for label in CONDITION_LABELS)
    return f"""Act as a board of 7 medical specialists: cardiology, endocrinology, neurology, rheumatology, infectious disease, gastroenterology, and psychiatry.

Given this DDXPlus patient evidence, silently debate and produce a ranked top-3 differential diagnosis with confidence scores.

Patient:
- Age: {case.age}
- Sex: {case.sex}
- Chief complaint / initial evidence: {case.initial_evidence}

Evidence:
{evidence_lines}

Allowed diagnosis labels:
{labels}

Output only compact valid JSON in this exact shape:
[{{"diagnosis": "diagnosis name", "confidence": 0.0}}, {{"diagnosis": "diagnosis name", "confidence": 0.0}}, {{"diagnosis": "diagnosis name", "confidence": 0.0}}]
Each diagnosis must exactly match one allowed diagnosis label.
"""


def baseline_get_differential(case: Case) -> dict[str, Any]:
    api_key = _get_api_key()
    os.environ["GEMINI_API_KEY"] = api_key
    os.environ["GOOGLE_API_KEY"] = api_key

    response = completion(
        model=BASELINE_MODEL,
        messages=[{"role": "user", "content": _case_prompt(case)}],
        temperature=0.2,
        max_tokens=LLM_MAX_TOKENS,
        reasoning_effort=LLM_REASONING_EFFORT,
    )
    text = response.choices[0].message.content or ""
    differential = _extract_json_array(text)[:3]

    try:
        cost_usd = float(completion_cost(completion_response=response))
    except Exception:
        cost_usd = 0.0

    return {
        "differential": differential,
        "raw_output": text,
        "cost_usd": cost_usd,
        "model": BASELINE_MODEL,
    }


if __name__ == "__main__":
    count = int(os.getenv("CONSILIUM_BASELINE_N", "5"))
    result = run_benchmark(baseline_get_differential, n=count, label="baseline")
    print(json.dumps(result, indent=2, ensure_ascii=False))
