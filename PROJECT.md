# CONSILIUM — Master Project Specification

> **READ THIS ENTIRE FILE BEFORE WRITING ANY CODE.**
> This is the single source of truth. If anything you're about to do contradicts this file, STOP and ask the developer.
>
> **If you are an AI coding agent (Claude Code, Cursor, etc.):** load this file into context at the start of every session. Then load `BUILD_LOG.md` to know which phase you're in.

---

## 1. The 30-Second Pitch

CONSILIUM is a **multi-specialist diagnostic deliberation agent**.

A patient case (symptoms, labs, history) is loaded into a **persistent graph**. A council of specialist agents — implemented as Jac **walkers** — independently traverse that graph from their specialty's perspective. They post hypotheses, challenge each other's reasoning, request additional evidence, and converge on a ranked differential diagnosis.

**Tagline:** *The multi-specialty second opinion that didn't exist before agents could debate.*

**The problem we are solving:** Diagnostic error is the third-leading cause of death in the United States — 250,000 to 800,000 deaths annually. The cause is structural: no human specialist has time to be every specialist. Cardiologists miss endocrine angles. Endocrinologists miss autoimmune angles. There is no system that makes multiple medical minds *actually deliberate together* on a single case.

---

## 2. Hackathon Context

| Field | Value |
|---|---|
| **Event** | JacHacks Spring 2026 |
| **Format** | Virtual, hosted by Jaseci Labs (University of Michigan) |
| **Dates** | May 15-19, 2026 (4 days) |
| **Submission** | Public GitHub repo + 3-min demo video + Devpost description |
| **Team size** | 1-4 |
| **Mandatory language** | Jac (superset of Python) |
| **Total participants** | ~24 (curated) — small field, high quality bar |

### Prizes targeted (in priority order)

1. **Consumer Healthcare track prize** (primary submission track)
2. **Best Use of Jac — $300** (deep use of walkers, by_llm(), graph-native data)
3. **Best Demo — $200** (cinematic multi-agent debate visualization)
4. **Best Startup Idea — VC fast-track interview** (top 3 teams; this is the ultimate prize)
5. **Best LinkedIn / Instagram Post — $100 each** (viral 30-sec clip of agents debating)
6. **Lovable credits** (using Lovable for frontend qualifies)

### Judging criteria (from organizer doc)

1. **Does the agent actually work?** Multi-step planning, tool use, memory across sessions, agent-to-agent coordination.
2. **Creative use of Jac and agentic AI concepts.** Pushing the language vs. using it minimally.
3. **Impact and novelty.** Does the idea matter? Is the approach interesting?

Every architectural decision must answer YES to all three.

---

## 3. Tech Stack — Use ONLY These

| Layer | Choice | Reason |
|---|---|---|
| Primary language | **Jac** (latest stable, via `jaclang`) | Hackathon requirement; superset of Python |
| Runtime | **Jaseci** (`jaseci` Python package) | Required for walkers + graph runtime |
| LLM integration | **`byllm`** (Jac plugin) | Native `by llm()` support |
| LLM (specialists) | **Claude Sonnet 4.6** via Anthropic API | Reasoning quality; JacHacks provides $500 credits |
| LLM (moderator/triage) | **Claude Haiku 4.5** via Anthropic API | Fast, cheap orchestration |
| Frontend | **Lovable** → React via `jac-client` | Sponsor prize + unified stack |
| Graph storage | **Jac built-in (in-process graph)** | Built into Jac runtime; DO NOT add Neo4j or external DB |
| Dataset (benchmark) | **DDXPlus** (`aai530-group6/ddxplus` on HuggingFace) | Ground-truth differentials, audit corpus |
| Dataset (demo) | **MedQA-USMLE** (`GBaker/MedQA-USMLE-4-options` on HuggingFace) | Rich narrative cases |
| Demo recording | **OBS Studio** or **Loom** | Standard hackathon tooling |
| Version control | **Git + public GitHub repo** | Devpost submission requirement |

### Anything not on this list requires explicit developer approval before adding.

---

## 4. Anti-Hallucination Rules (for AI coding agents)

These rules exist because Jac is a new language and you (the AI agent) likely have weak or outdated training data on it.

### NEVER invent Jac syntax. Always verify against:

1. **Primary reference:** https://github.com/jaseci-labs/agentic-ai-tutorial — specifically the `CLAUDE.md` file inside that repo, which is the canonical syntax reference for AI agents.
2. **Official docs:** https://www.jaseci.org/
3. **GitHub source:** https://github.com/jaseci-labs/jaseci

### Before writing ANY Jac code:

1. Open `agentic-ai-tutorial/CLAUDE.md` and read the patterns for whatever construct you're about to write.
2. Verify the keywords you're using: `node`, `edge`, `walker`, `can ... with ... entry/exit`, `visit`, `here`, `spawn`, `by llm()`.
3. If a syntax pattern is uncertain, prefer the simpler form and leave a `# TODO: verify syntax against tutorial` comment.
4. If you cannot confirm syntax, STOP and tell the developer instead of guessing.

### NEVER invent:

- Dataset schemas (the actual schemas are in §7 of this file)
- Anthropic API parameter names (verify against https://docs.claude.com)
- Library function signatures (read the source or docs)
- Jac standard library functions

### NEVER:

- Add features not listed in `BUILD_LOG.md` without explicit approval
- Skip the audit harness (Phase 1) to "save time" — it is the slide-2 number that wins the pitch
- Build the frontend before Phase 5 — backend logic first
- Train any ML model — this project is LLM-orchestration only

---

## 5. Core Architecture

### 5.1 Graph Schema (CONCEPTUAL — verify final Jac syntax against tutorial)

**Nodes:**

| Node | Attributes |
|---|---|
| `Patient` | case_id, age, sex, chief_complaint |
| `Symptom` | description, onset, severity, location |
| `Lab` | name, value, reference_range, flag (normal/high/low) |
| `History` | type (family/social/medical), detail |
| `Hypothesis` | diagnosis_name, confidence (0-1), posted_by (walker_name), round (int), reasoning |
| `Question` | question_text, posted_by, target_specialty |

**Edges:**

| Edge | Direction | Meaning |
|---|---|---|
| `presents_with` | Patient → Symptom | The patient has this symptom |
| `has_result` | Patient → Lab | The patient has this lab result |
| `has_history` | Patient → History | This is a relevant history item |
| `supports` | Hypothesis → (Symptom \| Lab \| History) | **CITATION LOCK** — every hypothesis must have ≥1 supports edge |
| `contradicts` | Hypothesis → Hypothesis | One hypothesis disputes another |
| `addresses` | Question → Hypothesis | A clarifying question |

### 5.2 Walker Roster

**Moderator Walker** (Claude Haiku 4.5, temperature 0.2):
- Spawns specialist walkers in parallel
- Enforces the **blinded initial round** (no walker sees others' Hypothesis nodes until ALL post)
- Triggers the **adversarial round** (Devil's Advocate)
- Triggers final convergence and ranks the differential

**Specialist Walkers** (Claude Sonnet 4.6, specialty-specific system prompts and temperatures):

| Walker | Temperature | Bias |
|---|---|---|
| `CardiologyWalker` | 0.3 | Conservative; focus on cardiac mechanisms |
| `EndocrinologyWalker` | 0.5 | Consider hormonal/metabolic causes |
| `NeurologyWalker` | 0.6 | Pattern recognition for neuro presentations |
| `RheumatologyWalker` | 0.7 | **Strongly consider autoimmune** even when unfashionable |
| `InfectiousDiseaseWalker` | 0.6 | Consider rare and zoonotic infections |
| `GIWalker` | 0.5 | Consider GI mimics of other presentations |
| `PsychiatryWalker` | 0.5 | Consider functional/somatic overlay |

**DevilsAdvocateWalker** (Claude Sonnet 4.6, temperature 0.8):
- Fires AFTER initial convergence
- Job: produce a credible alternative to the leading hypothesis
- Must cite specific evidence nodes (citation-locked)

### 5.3 The Consensus-Bias Defense — THE CORE TECHNICAL DIFFERENTIATOR

This mechanism is what makes CONSILIUM more than "fancy single-prompt." Build it FIRST in Phase 2.

The six defenses:

1. **Blinded initial round** — All specialists post their initial differential as `Hypothesis` nodes BEFORE any walker can read others' hypothesis nodes. Enforced by graph-level state flag (e.g., `Patient.round_complete: bool`).
2. **Citation lock** — Every `Hypothesis` MUST have ≥1 `supports` edge to a `Symptom`, `Lab`, or `History` node. No citation = invalid hypothesis = rejected by moderator.
3. **Hardcoded specialty bias** — Each walker's system prompt embeds the specialty's prior distribution. Example: rheumatologist instructed "Strongly consider autoimmune mechanisms before ruling them out; this is your job."
4. **Temperature stratification** — Different walkers at different temperatures (see roster).
5. **Devil's Advocate** — Mandatory adversarial walker after convergence.
6. **Selective context per walker** — Each walker only sees its specialty-relevant subgraph during traversal (cardio walker sees cardiac labs + cardiac symptoms + cardiac-relevant family history). This reduces anchoring more than anything else.

### 5.4 Reasoning-by-Traversal — THE JAC DIFFERENTIATOR

This is what we mean by "deep use of Jac." It is also the answer to the judges' likely question "why isn't this just a single GPT prompt?"

Walkers DO NOT see the whole patient at once. They TRAVERSE the graph.

When a `CardiologyWalker` enters a `Symptom("chest pain")` node, it sees only:
- The node's own attributes
- Edges to related Labs (e.g., troponin, ECG findings)
- Edges to related History items (e.g., family MI history)
- Any `Hypothesis` nodes already attached via `supports` (only after blinded round lifts)

It calls `by llm()` SCOPED TO THIS NEIGHBORHOOD to decide its next move. This is fundamentally different from feeding the whole patient to one LLM call.

**Walker traversal IS the reasoning. The path taken IS the chain of thought. The hypotheses posted are the conclusions.**

When implementing: do NOT feed entire patient context into any single `by llm()` call. Pass only the current node and its neighborhood. This is the design pattern that earns "deep use of Jac" credit.

---

## 6. The Pitch Skeleton (lock this Day 1 — we build to it)

| Slide | Content |
|---|---|
| 1 | **Hook** — "Diagnostic error is the third-leading cause of death in America. 800,000+ deaths per year. We're fixing why: no human specialist has time to be every specialist." |
| 2 | **The benchmark** — "On 100 DDXPlus cases, single-prompt 'board of 7' baseline hits N% top-3. CONSILIUM hits M%. M − N ≥ 10%." |
| 3 | **Live demo** — paste a MedQA case, watch the council debate, see the correct diagnosis surface in 90 seconds. |
| 4 | **Why Jac** — show the graph evolving, show one walker challenging another's citation. Walker traversal IS the reasoning. |
| 5 | **Market** — consumer second-opinion product, $30/mo, 330M Americans, $10B+ TAM. Eventual B2B clinical decision support path. |
| 6 | **Regulatory positioning** — NOT a medical device. Structured second-opinion preparation tool. Buoy Health and Ada Health raised $40M+ and $90M+ in this lane. |
| 7 | **Roadmap** — clinical validation cohort, B2B pivot for SaMD pathway, international markets where specialist gap is worse. |

---

## 7. Datasets — Reality (verified May 2026)

### 7.1 DDXPlus (audit/benchmark dataset)

- **Source:** Hugging Face `aai530-group6/ddxplus`
- **Size:** 1.3M synthetic patients. **Download only the validate subset, ~130K rows, ~50MB.**
- **Coverage:** ~50 pathologies only (limited disease space)
- **Use:** Audit harness only. Sample 200 cases for benchmarking.

**CSV Schema (columns):**

| Column | Type | Description |
|---|---|---|
| `AGE` | int | Patient age |
| `SEX` | str | "M" or "F" |
| `INITIAL_EVIDENCE` | str | Code for the chief complaint symptom |
| `EVIDENCES` | str (JSON list) | List of evidence codes (e.g., `["E_55_@_V_18", ...]`) |
| `PATHOLOGY` | str | **Ground truth diagnosis** |
| `DIFFERENTIAL_DIAGNOSIS` | str (JSON list of [pathology, probability] pairs) | **Ground truth ranked differential** |

**Supporting files in the same HF repo:**

- `release_evidences.json` — maps evidence codes → human-readable symptoms
- `release_conditions.json` — maps pathology names → ICD-style codes

**Caveats (do NOT pretend otherwise to the developer):**
- It is synthetic; differentials come from a rule engine, not real doctors
- It only covers ~50 pathologies — no rare diseases
- It's structured tabular data, NOT narrative prose
- Good as a benchmark, NOT proof your agents work on real cases

### 7.2 MedQA-USMLE (demo dataset)

- **Source:** Hugging Face `GBaker/MedQA-USMLE-4-options`
- **Size:** ~12,723 questions, ~10MB total — grab the whole thing
- **Use:** Demo cases. Curate 5-10 dramatic cases for the recorded demo.

**JSON Schema:**

```json
{
  "question": "A 27-year-old female presents to general medical clinic for a routine checkup...",
  "options": {"A": "Cystic fibrosis", "B": "Asthma", "C": "...", "D": "..."},
  "answer": "A",
  "answer_idx": "A",
  "meta_info": "step1"
}
```

**Caveats:**
- Format is multiple-choice, not open-ended differential
- Ground truth is one letter, not a ranked list
- Evaluation strategy: "is the correct option in CONSILIUM's top-3 differential ranking?"

### 7.3 Data Preprocessing Pipeline (Phase 1 / Phase 2 task)

**For DDXPlus:**
1. Load CSV with pandas
2. Parse `EVIDENCES` strings (they're JSON-encoded)
3. Use `release_evidences.json` to map codes → readable symptoms
4. Convert each row to a graph: `Patient` node + `Symptom` nodes connected by `presents_with` edges
5. Store `PATHOLOGY` and `DIFFERENTIAL_DIAGNOSIS` separately as ground truth (not in the graph the walkers see)

**For MedQA:**
1. Load JSON
2. Use Claude (via `by llm()`) to extract structured `Symptom`/`Lab`/`History` items from the vignette text. This is a one-time extraction per case — **cache the result** to disk so you don't re-pay every run.
3. Build the patient graph from the extraction

---

## 8. Expected File Structure

```
consilium/
├── README.md                    # Devpost-facing project overview
├── PROJECT.md                   # This file
├── BUILD_LOG.md                 # Phase checkpoints
├── CLAUDE.md                    # Symlink or copy of PROJECT.md (for Claude Code)
├── pyproject.toml               # Python deps: jaclang, jaseci, byllm, anthropic, pandas, datasets
├── .env.example                 # ANTHROPIC_API_KEY=
├── .gitignore                   # Ignore .env, data/, __pycache__
├── data/
│   ├── ddxplus_validate_sample.csv     # 200-case audited subset
│   ├── medqa_demo_cases.json           # Curated 5-10 demo cases
│   ├── evidence_map.json               # DDXPlus evidence code lookup
│   └── medqa_extracted_cache/          # Cached LLM extractions
├── src/
│   ├── consilium.jac            # Main entry, graph schema definitions
│   ├── moderator.jac            # Moderator walker
│   ├── specialists/
│   │   ├── cardiology.jac
│   │   ├── endocrinology.jac
│   │   ├── neurology.jac
│   │   ├── rheumatology.jac
│   │   ├── infectious_disease.jac
│   │   ├── gastroenterology.jac
│   │   └── psychiatry.jac
│   ├── devils_advocate.jac
│   ├── prompts.jac              # All specialist system prompts (centralized)
│   └── ingest.jac               # Dataset → graph converters
├── eval/
│   ├── audit_harness.py         # The benchmark runner
│   ├── baseline_single_prompt.py # Single-prompt "board of 7" baseline
│   └── results/                 # JSON accuracy logs per run
├── frontend/                    # Lovable-generated React app (Phase 5)
└── demo/
    ├── recording.mp4            # Final 3-min demo
    ├── viral_clip_30sec.mp4
    └── pitch_deck.pdf
```

---

## 9. Definition of Done (per phase)

| Phase | Done when |
|---|---|
| 0 | Workspace ready, datasets downloaded, API keys set |
| 1 | Audit harness runs; baseline accuracy number recorded |
| 2 | Two specialist walkers post different hypotheses on one MedQA case |
| 3 | Full 5-7 specialist council; first CONSILIUM benchmark > baseline by ≥5% |
| 4 | All 6 anti-sycophancy defenses verified; CONSILIUM > baseline by ≥10% |
| 5 | Lovable frontend shows live walker debate on 3 cases |
| 6 | Demo recorded, Devpost submitted, social posts live |

Full acceptance criteria for each phase: see `BUILD_LOG.md`.

---

## 10. Channels of Truth (when in doubt)

| Topic | Authoritative source |
|---|---|
| Jac syntax | https://github.com/jaseci-labs/agentic-ai-tutorial (the `CLAUDE.md` in that repo) |
| Jac runtime | https://github.com/jaseci-labs/jaseci |
| Anthropic API | https://docs.claude.com |
| DDXPlus schema | The `README.md` at https://huggingface.co/datasets/aai530-group6/ddxplus |
| MedQA schema | https://huggingface.co/datasets/GBaker/MedQA-USMLE-4-options |
| Hackathon rules | https://jachacks-spring.devpost.com/rules |
| **This project** | PROJECT.md (this file) + BUILD_LOG.md |

**Conflict resolution:** Official Jac source > tutorial > this file > anything else. If a source contradicts another, surface it to the developer rather than guessing.

---

## 11. Communication Protocol with the Evaluator (Claude in chat)

When you (the developer) complete a phase from `BUILD_LOG.md`, paste the phase's **Summary Template** filled in to the Claude chat. The evaluator will:

1. Verify acceptance criteria are met
2. Spot-check for hallucinated Jac syntax or invented dataset schemas
3. Flag any subtle quality issues (e.g., walkers that agree too readily — sycophancy leak)
4. Approve move to next phase OR request specific fixes

When blocked, use the **Blocker Template** in `BUILD_LOG.md`. Don't grind alone for >2 hours on the same problem.

---

## 12. The One Sentence That Should Drive Every Decision

> Will this make CONSILIUM more obviously a Jac-native, multi-agent, graph-traversal-driven system that beats a single-prompt baseline by a measurable margin?

If yes, do it. If not, defer it.
