# CONSILIUM Changelog

All notable changes to this project are documented here.

---

## [Phase 4] — 2026-05-17

### Added
- **TriageWalker** (`src/triage_walker.jac`): 3-tier case-complexity classification (SIMPLE/MODERATE/COMPLEX) using Flash-Lite model for routing decisions
- **TriageDecision node** in `src/schema.jac` with fields: case_complexity, confident_diagnosis, confidence, red_flags, recommended_specialties, reasoning
- **TRIAGE_MODEL** (`gemini/gemini-2.5-flash-lite`) in `src/models.jac` — verified ~3x cheaper than Flash
- **Dynamic specialist routing** in `src/moderator.jac`: SIMPLE cases skip specialists entirely, MODERATE spawns 1-3, COMPLEX spawns all 7 + advocate
- **Dynamic agreement_score divisor** in `src/consilium_benchmark_runner.jac` — adapts to number of specialists invoked
- **get_labels_text()** in `src/labels.py` for triage prompt label injection

### Fixed
- Removed stray `print(CONDITION_LABELS)` in `src/labels.py` that polluted Jac stdout

### Smoke Test
- 5/5 vignettes routed correctly (2 SIMPLE, 2 MODERATE, 1 COMPLEX)
- SIMPLE cases: ~20s runtime (no specialists) vs 157s full pipeline
- COMPLEX case: 4 red flags correctly identified, refused confident diagnosis

---

## [Phase 3] — 2026-05-16

### Added
- Full 7-specialist council (Cardiology, Endocrinology, Neurology, Rheumatology, Infectious Disease, Gastroenterology, Psychiatry)
- Devil's Advocate walker for adversarial hypothesis challenging
- ModeratorWalker for specialist orchestration, citation validation, and score aggregation
- Lean Config B architecture selected over Config A after benchmark comparison
- Audit harness and benchmark infrastructure (`eval/audit_harness.py`, `eval/consilium_benchmark.py`)

### Benchmark (Lean Config B, 10 cases, Pro)
- top-1: 70%, top-3: 80%, MRR: 0.750

---

## [Phase 2.5] — 2026-05-16

### Added
- LLM-derived final synthesis for specialist hypotheses
- Robust JSON parsing via `src/json_utils.py::safe_json_parse`
- Retry wrapper with exponential backoff for API connection drops

---

## [Phase 2] — 2026-05-15

### Added
- Graph schema (Patient, Symptom, Lab, History, Hypothesis, Question nodes)
- Initial Cardiology and Endocrinology specialist walkers
- Moderator walker with blinded-round phase enforcement

---

## [Phase 1] — 2026-05-15

### Added
- Audit harness (`eval/audit_harness.py`)
- Single-prompt baseline (`eval/baseline_single_prompt.py`)
- DDXPlus and MedQA dataset integration

---

## [Phase 0] — 2026-05-15

### Added
- Repository initialized
- PROJECT.md and BUILD_LOG.md
- Environment setup (Jac, byllm, litellm, python-dotenv)
- Dataset download and schema verification
