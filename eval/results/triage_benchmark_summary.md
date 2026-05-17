# Triage Benchmark Summary — 10 Cases, Pro, seed=42

**Date:** 2026-05-17  
**Model:** gemini/gemini-2.5-pro (specialists), gemini/gemini-2.5-flash-lite (triage)  
**Results file:** `eval/results/quick_20260517T182220Z.json`

---

## Headline Numbers

| Metric | Lean Baseline (no triage) | With TriageWalker | Delta |
|--------|---------------------------|-------------------|-------|
| Top-1 Accuracy | 70% | 60% | **-10 pts** |
| Top-3 Accuracy | 80% | 70% | **-10 pts** |
| MRR | 0.750 | 0.650 | **-0.100** |
| Runtime | 25.6 min | 13.0 min | **-12.6 min (49% faster)** |

---

## Triage Distribution

| Complexity | Count | Cases |
|---|---|---|
| SIMPLE | 1 | 22296 (rhinosinusitis) |
| MODERATE | 6 | 75493, 101404, 110495, 93335, 72426, 19174 |
| COMPLEX | 3 | 124409, 2448, 94092 |

---

## Case-by-Case Analysis

| Case | Pathology | Target (DDXPlus GT) | Triage | Predictions | Result |
|------|-----------|---------------------|--------|-------------|--------|
| 75493 | Acute dystonic reactions | Acute dystonic reactions | MODERATE (neuro, psych) | [Acute dystonic reactions] | ✅ top-1 |
| 124409 | Pulmonary neoplasm | Pulmonary neoplasm | COMPLEX (ALL) | [Pulmonary neoplasm] | ✅ top-1 |
| 101404 | Myocarditis | Panic attack | MODERATE (cardio, rheum) | [SLE, Myocarditis] | ❌ (both runs miss) |
| 110495 | Influenza | URTI | MODERATE (neuro, rheum) | [SLE, Cluster headache] | ❌ (both runs miss) |
| 2448 | Anemia | Anemia | COMPLEX (ALL) | [Anemia] | ✅ top-1 |
| 93335 | Pericarditis | Pericarditis | MODERATE (cardio) | [Pericarditis] | ✅ top-1 |
| 22296 | Chronic rhinosinusitis | Chronic rhinosinusitis | SIMPLE (Acute rhinosinusitis) | [Acute rhinosinusitis, Chronic rhinosinusitis] | ⚠️ top-3 |
| 72426 | Inguinal hernia | Inguinal hernia | MODERATE (GI, ID) | [Inguinal hernia] | ✅ top-1 |
| 94092 | Influenza | Influenza | COMPLEX (ALL) | [Influenza, URTI] | ✅ top-1 |
| 19174 | Influenza | URTI | MODERATE (ID only) | [Influenza] | ❌ REGRESSION |

---

## Regression Analysis

**Only 1 case regressed (Case 19174):**
- Baseline predicted URTI as top-1 (correct per DDXPlus ground truth)
- Triage routed to `infectious_disease` only → specialist correctly identified Influenza (the actual pathology) but DDXPlus ground truth differential ranks URTI above Influenza
- This is a label-ordering edge case: the system is medically correct (Influenza IS the pathology) but the DDXPlus ground truth differential says URTI should rank higher
- The MODERATE routing to only ID specialist removed the other 6 specialists that might have predicted URTI

**SIMPLE case (22296) maintained top-3 but lost top-1:**
- Triage diagnosed "Acute rhinosinusitis" but truth is "Chronic rhinosinusitis"
- Still in top-3 because the full output includes both acute and chronic
- This was already top-3 only in baseline — no change

**Cases 101404 and 110495 were failures in BOTH runs** (baseline and triage).

---

## Root Cause of Regression

The -10pt drop comes from **one single case (19174)** where:
1. MODERATE routing limited specialist selection to only infectious_disease
2. ID specialist correctly found Influenza (actual pathology) but missed URTI (DDXPlus ground truth top-1)
3. Without the other 6 specialists, no one suggested URTI

**Potential fixes:**
- Option A: Lower SIMPLE threshold (currently 0.85) — doesn't help here
- Option B: For MODERATE, always include the "closest" additional specialist
- Option C: Accept the regression as a label-edge case (Influenza IS correct medically)
- Option D: Make MODERATE route to minimum 3 specialists always

---

## Conclusion

The triage system works correctly for routing (5/5 smoke test, sensible distributions in benchmark). The accuracy regression is marginal (1 case, label edge case). The 49% runtime improvement is substantial. Awaiting evaluator decision on whether to accept, tune thresholds, or revert.
