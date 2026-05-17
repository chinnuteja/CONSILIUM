import ast
import json
import re
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RESULTS_DIR = ROOT / "eval" / "results"


@dataclass
class Case:
    case_id: int
    age: int
    sex: str
    initial_evidence_code: str
    initial_evidence: str
    evidence_codes: list[str]
    evidence: list[str]
    pathology: str
    ground_truth_differential: list[tuple[str, float]]


def _load_evidence_map() -> dict[str, dict[str, Any]]:
    with open(DATA_DIR / "release_evidences.json", "r", encoding="utf-8") as f:
        return json.load(f)


def _parse_python_literal(value: str, fallback: Any) -> Any:
    try:
        return ast.literal_eval(value)
    except (SyntaxError, ValueError):
        return fallback


def translate_evidence_code(code: str, evidence_map: dict[str, dict[str, Any]]) -> str:
    base_code, _, raw_value = code.partition("_@_")
    record = evidence_map.get(base_code)
    if not record:
        return code

    question = record.get("question_en") or record.get("name") or base_code
    if not raw_value:
        return question

    value: Any = raw_value
    if raw_value.isdigit():
        value = int(raw_value)

    meaning = record.get("value_meaning", {}).get(str(raw_value))
    if isinstance(meaning, dict):
        value = meaning.get("en") or meaning.get("fr") or raw_value

    return f"{question} {value}"


def load_ddxplus_sample(n: int = 50, seed: int = 42) -> list[Case]:
    df = pd.read_csv(DATA_DIR / "ddxplus_validate.csv")
    sample = df.sample(n=n, random_state=seed).reset_index(drop=False)
    evidence_map = _load_evidence_map()
    cases: list[Case] = []

    for row in sample.itertuples(index=False):
        evidence_codes = _parse_python_literal(row.EVIDENCES, [])
        differential = _parse_python_literal(row.DIFFERENTIAL_DIAGNOSIS, [])
        translated = [
            translate_evidence_code(str(code), evidence_map) for code in evidence_codes
        ]
        initial = translate_evidence_code(str(row.INITIAL_EVIDENCE), evidence_map)
        cases.append(
            Case(
                case_id=int(row.index),
                age=int(row.AGE),
                sex=str(row.SEX),
                initial_evidence_code=str(row.INITIAL_EVIDENCE),
                initial_evidence=initial,
                evidence_codes=[str(code) for code in evidence_codes],
                evidence=translated,
                pathology=str(row.PATHOLOGY),
                ground_truth_differential=[
                    (str(item[0]), float(item[1])) for item in differential
                ],
            )
        )

    return cases


def normalize_diagnosis(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _prediction_names(predicted_differential: Any) -> list[str]:
    names: list[str] = []
    for item in predicted_differential or []:
        if isinstance(item, dict):
            diagnosis = item.get("diagnosis") or item.get("name")
        elif isinstance(item, (list, tuple)) and item:
            diagnosis = item[0]
        else:
            diagnosis = item
        if diagnosis:
            names.append(str(diagnosis))
    return names


def evaluate(predicted_differential: Any, ground_truth_differential: Any, pathology: str = "") -> dict[str, Any]:
    predictions = _prediction_names(predicted_differential)
    if isinstance(ground_truth_differential, dict):
        target = str(
            ground_truth_differential.get("pathology")
            or ground_truth_differential.get("diagnosis")
            or ""
        )
    else:
        gt_names = _prediction_names(ground_truth_differential)
        target = gt_names[0] if gt_names else ""

    normalized_target = normalize_diagnosis(target)
    normalized_predictions = [normalize_diagnosis(item) for item in predictions]
    rank = next(
        (
            idx + 1
            for idx, item in enumerate(normalized_predictions)
            if item == normalized_target
        ),
        None,
    )

    # Secondary metric: does the actual pathology appear in top-3 predictions?
    pathology_in_top3 = False
    if pathology:
        normalized_pathology = normalize_diagnosis(pathology)
        pathology_in_top3 = normalized_pathology in normalized_predictions[:3]

    return {
        "target": target,
        "predictions": predictions,
        "top_1_correct": rank == 1,
        "top_3_correct": rank is not None and rank <= 3,
        "pathology_in_top3": pathology_in_top3,
        "mrr": 0.0 if rank is None else 1.0 / rank,
        "rank": rank,
    }


def run_benchmark(
    differential_fn: Callable[[Case], Any],
    n: int = 50,
    label: str = "baseline",
    seed: int = 42,
) -> dict[str, Any]:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    cases = load_ddxplus_sample(n=n, seed=seed)
    started = time.perf_counter()
    rows = []
    total_cost = 0.0

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    partial_path = RESULTS_DIR / f"{label}_partial_{stamp}.json"

    for idx, case in enumerate(cases):
        prediction_result = differential_fn(case)
        if isinstance(prediction_result, dict) and "differential" in prediction_result:
            predicted = prediction_result["differential"]
            cost = float(prediction_result.get("cost_usd") or 0.0)
            raw_output = prediction_result.get("raw_output")
        else:
            predicted = prediction_result
            cost = 0.0
            raw_output = None

        metrics = evaluate(predicted, case.ground_truth_differential, pathology=case.pathology)
        total_cost += cost
        rows.append(
            {
                "case_id": case.case_id,
                "pathology": case.pathology,
                "ground_truth_differential": case.ground_truth_differential,
                "initial_evidence": case.initial_evidence,
                "predicted": predicted,
                "raw_output": raw_output,
                "cost_usd": cost,
                **metrics,
            }
        )

        # Partial save every 10 cases
        if (idx + 1) % 10 == 0:
            partial = {
                "label": label, "n_completed": idx + 1, "n_total": n,
                "top_1_accuracy": sum(r["top_1_correct"] for r in rows) / len(rows),
                "top_3_accuracy": sum(r["top_3_correct"] for r in rows) / len(rows),
                "cases": rows,
            }
            with open(partial_path, "w", encoding="utf-8") as f:
                json.dump(partial, f, indent=2, ensure_ascii=False)
            print(f"  [Partial save] {idx + 1}/{n} cases — top1={partial['top_1_accuracy']:.0%} top3={partial['top_3_accuracy']:.0%}")

    elapsed_seconds = time.perf_counter() - started
    summary = {
        "label": label,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "n": n,
        "top_1_accuracy": sum(row["top_1_correct"] for row in rows) / n,
        "top_3_accuracy": sum(row["top_3_correct"] for row in rows) / n,
        "pathology_in_top3_accuracy": sum(row["pathology_in_top3"] for row in rows) / n,
        "mrr": sum(row["mrr"] for row in rows) / n,
        "wall_clock_seconds": elapsed_seconds,
        "estimated_cost_usd": total_cost,
        "cases": rows,
    }

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    output_path = RESULTS_DIR / f"{label}_{stamp}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    summary["results_path"] = str(output_path)
    return summary


if __name__ == "__main__":
    cases = load_ddxplus_sample(n=3)
    print(json.dumps([asdict(case) for case in cases], indent=2, ensure_ascii=False))
