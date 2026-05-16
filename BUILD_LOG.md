# CONSILIUM — Build Log & Phase Checkpoints

> **Read `PROJECT.md` FIRST.** This file assumes you have its context loaded.
>
> **The protocol:** complete one phase at a time. At each checkpoint, fill in the Summary Template at the end of the phase and paste it to the evaluator in chat. Wait for evaluator approval before moving to the next phase.
>
> **If you hit a blocker for >2 hours:** stop, fill out the Blocker Template at the bottom of this file, and ask for help. Do not grind alone.

---

## Total time budget

| | Hours |
|---|---|
| Hackathon length | 96 (May 15-19) |
| Budgeted sleep | 24 |
| Working time | **72** |
| Buffer reserved for Phase 6 polish/submission | **16** |
| Effective build time | **56** |

If you fall behind, cut Phase 5 scope (frontend can be ugly), not Phase 1 or Phase 4 (the benchmark and the consensus-bias defense). The benchmark number is what wins the pitch — never let it slip.i guess we can finish this two days before the deadline.

---

## Phase 0 — Pre-Flight (before hackathon kickoff)

**Goal:** Workspace ready, datasets downloaded, API keys configured.

**Estimated time:** 1-2 hours

### Tasks

1. Create a public GitHub repo named `consilium` (MIT license).
2. Initialize the file structure from `PROJECT.md` §8.
3. Commit `PROJECT.md` and `BUILD_LOG.md`. (NOTE: it is critical these were committed *during* the hackathon window per the rules. Do this in your first commit after kickoff at 10 AM ET May 15.)
4. Set up Python environment:
   ```
   python -m venv .venv && source .venv/bin/activate
   pip install jaclang jaseci byllm pandas datasets python-dotenv google-generativeai
   ```
5. Confirm Jac is installed: `jac --version`
6. Create `.env` from `.env.example`, set `GOOGLE_API_KEY` / `GEMINI_API_KEY`.
7. Download datasets:
   ```python
   from datasets import load_dataset
   # DDXPlus
   ddx = load_dataset("aai530-group6/ddxplus", split="validate")
   ddx.to_csv("data/ddxplus_validate.csv")
   # MedQA
   mq = load_dataset("GBaker/MedQA-USMLE-4-options")
   # Save test split to JSON
   ```
8. Inspect 3 rows of each dataset manually. Confirm schemas match `PROJECT.md` §7.
9. Clone the Jac tutorial in a sibling directory for reference: `git clone https://github.com/jaseci-labs/agentic-ai-tutorial.git ../agentic-ai-tutorial`. Read its `CLAUDE.md`.

### Acceptance Criteria

- [ ] `jac --version` returns a version string without error
- [ ] `data/ddxplus_validate.csv` exists and has expected columns (AGE, SEX, EVIDENCES, PATHOLOGY, DIFFERENTIAL_DIAGNOSIS)
- [ ] `data/medqa_test.json` exists and has expected schema (question, options, answer)
- [ ] `.env` file present and gitignored
- [ ] Repo is on GitHub, public, with first commit dated after May 15 10AM ET

### Summary Template (paste this to the evaluator in chat)

```
PHASE 0 COMPLETE
- Jac version: <version>
- DDXPlus rows: <count>, file size: <MB>
- MedQA questions: <count>, file size: <MB>
- DDXPlus columns confirmed match spec: yes/no
- MedQA schema confirmed match spec: yes/no
- Repo URL: <github URL>
- First commit timestamp: <UTC timestamp>
- Tutorial CLAUDE.md skimmed: yes/no
- Blockers: <none | description>
```

---

## Phase 1 — Audit Harness BEFORE Anything Else

**Hours 0-4 of the build (from kickoff)**

**Goal:** Have a working benchmark and a baseline accuracy number BEFORE building any walker. This is non-negotiable. The benchmark number becomes slide 2 of the pitch.

### Why this comes first

Most teams build agents first, then panic-benchmark on Day 4. We invert that. Knowing the baseline gives us a target. Knowing the harness works means CONSILIUM can be evaluated the moment it exists.

### Tasks

1. **Build evaluation utilities** (`eval/audit_harness.py`):
   - Function: `load_ddxplus_sample(n=50, seed=42) -> List[Case]`
   - Function: `evaluate(predicted_differential, ground_truth_differential) -> dict` returning `top_1_correct: bool`, `top_3_correct: bool`, `mrr: float`
   - Function: `run_benchmark(differential_fn, n=50) -> dict` — takes any function and runs it across n cases
   - Saves results to `eval/results/<timestamp>_<label>.json`

2. **Build the single-prompt baseline** (`eval/baseline_single_prompt.py`):
   - Implements `baseline_get_differential(case) -> List[Tuple[str, float]]`
   - Uses ONE Gemini API call with prompt: "Act as a board of 7 medical specialists (cardiology, endocrinology, neurology, rheumatology, infectious disease, GI, psychiatry). Given this evidence, debate and produce a ranked top-3 differential diagnosis with confidence scores. Output as JSON: `[{diagnosis: ..., confidence: ...}, ...]`"

3. **Run baseline on 50 cases.** Record top-1 accuracy, top-3 accuracy, MRR.

### Acceptance Criteria

- [ ] `audit_harness.py` is importable; `run_benchmark(baseline_get_differential, n=50)` completes
- [ ] Baseline top-1 accuracy is in plausible range (15-50%)
- [ ] Baseline top-3 accuracy is in plausible range (40-75%)
- [ ] Results JSON saved to `eval/results/baseline_<timestamp>.json`
- [ ] The harness accepts an arbitrary `differential_fn` (so swapping in CONSILIUM later is trivial)

### Common pitfalls

- **Evidence-code translation:** DDXPlus uses codes like `E_55_@_V_18`. You MUST join them to readable text via `release_evidences.json` before feeding to Gemini. Otherwise baseline accuracy collapses.
- **JSON parsing fragility:** Gemini sometimes wraps JSON in markdown fences or truncates a closing fence. Use a robust extractor (try `json.loads` first, then strip ```` ``` ````, then regex).
- **Rate limits:** Don't blast 50 concurrent requests. Use `asyncio.Semaphore(5)` or similar.

### Summary Template

```
PHASE 1 COMPLETE
- Audit harness path: <path>
- Baseline file path: <path>
- Cases evaluated: <N>
- Baseline top-1 accuracy: <X%>
- Baseline top-3 accuracy: <Y%>
- Baseline mean reciprocal rank: <Z>
- Wall-clock time for 50 cases: <minutes>
- API cost for 50 cases (USD est): <amount>
- Surprises in the data: <description or none>
- Blockers: <none | description>
```

### Evaluator will verify

- Is baseline top-3 in the plausible 40-75% range? (Too high = data leak. Too low = prompt broken.)
- Is the harness modular (can swap in CONSILIUM later without rewriting)?
- Did you actually translate evidence codes to readable symptoms?

---

## Phase 2 — Graph Schema + Two Specialists

**Hours 4-12**

**Goal:** A working two-walker debate on one MedQA case. Console output is enough; no UI yet.

### Tasks

1. **Re-confirm Jac syntax.** Open `agentic-ai-tutorial/CLAUDE.md`. Read sections on `node`, `edge`, `walker`, `can ... with X entry`, `visit`, `here`, `by llm()`. If anything looks different from what you remember, the tutorial wins.

2. **Create `src/consilium.jac`** with the graph schema:
   - All node types from `PROJECT.md` §5.1 (Patient, Symptom, Lab, History, Hypothesis, Question)
   - All edge types
   - A `round_state` mechanism on the Patient node so the moderator can enforce blinded-round (e.g., a `phase` attribute: "INITIAL", "DEBATE", "ADVERSARIAL", "FINAL")

3. **Create `src/ingest.jac`** with:
   - `ingest_medqa_case(case_json) -> Patient` — uses `by llm()` to extract symptoms/labs/history from the vignette and builds the graph

4. **Create `src/prompts.jac`** — centralized system prompts for each specialist (so you tune in one place, not seven files).

5. **Create `src/specialists/cardiology.jac`**:
   - `walker CardiologyWalker`
   - `can plan_path with Patient entry` — decides which symptoms/labs to visit first
   - `can examine with Symptom entry` — at each symptom, scope-limited `by llm()` call to assess cardiac relevance
   - `can examine with Lab entry` — same for labs
   - `can post_hypothesis with Patient exit` — posts a Hypothesis node with citations
   - Hardcoded specialty bias in the system prompt

6. **Create `src/specialists/endocrinology.jac`** — same structure, endocrine perspective, different temperature.

7. **Create `src/moderator.jac`**:
   - `walker ModeratorWalker`
   - Spawns both specialists in parallel (`spawn` syntax — verify against tutorial)
   - Holds `phase = "INITIAL"` until both have posted hypotheses
   - Then sets `phase = "DEBATE"` and lets walkers re-traverse to see each other's hypotheses

8. **Wire it together.** Pick ONE MedQA case manually (any case with a clinical vignette). Run end-to-end. Verify in console output:
   - Both specialists posted hypotheses
   - Both hypotheses have at least one `supports` edge to an evidence node
   - The two hypotheses are different (not "we both agree it's X")

### Acceptance Criteria

- [ ] Running `jac run src/consilium.jac` (or equivalent entry) on one case produces two `Hypothesis` nodes
- [ ] Each hypothesis has ≥1 `supports` edge (citation lock works)
- [ ] The hypotheses differ in diagnosis name (specialty bias works)
- [ ] No Jac syntax that doesn't appear in the tutorial — IF YOU MADE UP SYNTAX, FIX IT BEFORE REPORTING DONE

### Common pitfalls

- **Feeding the whole patient to one `by llm()` call.** This defeats the architectural point. Each `by llm()` call should see ONLY the current node + immediate neighbors.
- **Forgetting the citation lock.** If a hypothesis doesn't have a `supports` edge, the moderator should reject it.
- **Letting walkers read each other's hypotheses before the blinded round lifts.** This is the sycophancy leak.

### Summary Template

```
PHASE 2 COMPLETE
- MedQA case used: <case_id or short description>
- Case ground truth: <correct answer>
- CardiologyWalker hypothesis: "<diagnosis>" (confidence <X>)
- EndocrinologyWalker hypothesis: "<diagnosis>" (confidence <Y>)
- Both hypotheses have supports edges: yes/no
- Hypotheses are different: yes/no
- Walkers used per-node `by llm()` calls (not one big call): yes/no
- Console log excerpt (paste 20-30 lines): <paste>
- Jac syntax verified against tutorial: yes/no
- Blockers: <none | description>
```

### Evaluator will verify

- Are the hypotheses actually different, or did sycophancy leak?
- Are citations real (pointing to actual evidence nodes in the graph)?
- Did you use walker traversal, or did you feed the whole patient to one call?
- Any suspicious Jac syntax that might be hallucinated?

---

## Phase 3 — Full Specialist Council

**Hours 12-24**

**Goal:** 5-7 specialists running in parallel; first CONSILIUM benchmark vs baseline.

### Tasks

1. **Add five more specialist walkers** (one file each in `src/specialists/`): Neurology, Rheumatology, Infectious Disease, GI, Psychiatry. Use the roster from `PROJECT.md` §5.2 — specialty bias text, temperature.

2. **Update Moderator** to spawn all 5-7 in parallel.

3. **Add `src/devils_advocate.jac`** — fires AFTER initial convergence:
   - Reads the leading Hypothesis
   - `by llm()` call: "Argue against this hypothesis. Find a credible alternative explanation for the same evidence. You MUST cite at least 2 evidence nodes."
   - Posts a new Hypothesis with `contradicts` edge to the leading one

4. **Implement final ranking** in the Moderator:
   - Collect all Hypothesis nodes
   - Aggregate confidence across walkers (a hypothesis posted by 3 walkers ≠ same as posted by 1)
   - Return ranked top-N as `List[Tuple[str, float]]`

5. **Wrap CONSILIUM as a benchmark function** — write `consilium_get_differential(case) -> List[Tuple[str, float]]` that:
   - Ingests the case
   - Runs the council
   - Returns the same shape as the baseline
   - Suitable for `run_benchmark(consilium_get_differential, n=50)`

6. **Run audit harness on 50 DDXPlus cases.** Compare to baseline.

7. **GO/NO-GO CHECK:** If CONSILIUM does NOT beat baseline by ≥5%, STOP and report to evaluator. Do not proceed to Phase 4 until this is resolved.

### Acceptance Criteria

- [ ] All 5-7 specialist walkers operational and produce distinct outputs
- [ ] DevilsAdvocate walker fires and posts ≥1 alternative hypothesis with `contradicts` edge
- [ ] CONSILIUM run on 50 DDXPlus cases completes without crash
- [ ] CONSILIUM top-3 > baseline top-3 by at least 5 percentage points

### Common pitfalls

- **Cost explosion.** 7 walkers × 50 cases × multiple `by llm()` calls per walker = lots of API spend. Monitor your spend. Use Haiku for the Moderator. Cache extracted MedQA cases.
- **Parallel execution gotchas.** If walkers are spawned async, race conditions on the graph can be ugly. Add a moderator-enforced gate.
- **The Devil's Advocate just agreeing.** Tune its prompt aggressively — penalize agreement in the system prompt.

### Summary Template

```
PHASE 3 COMPLETE
- Specialists implemented: <list of 5-7>
- Devil's Advocate produces credible alternatives: yes/no
- CONSILIUM top-1 accuracy: <X%>
- CONSILIUM top-3 accuracy: <Y%>
- Baseline top-3 (recap from Phase 1): <Y_baseline%>
- Delta (CONSILIUM − baseline): <delta%>
- Mean API cost per case (USD): <amount>
- Mean time per case (seconds): <seconds>
- GO/NO-GO decision: GO / NO-GO (if NO-GO, why?)
- Blockers: <none | description>
```

### Evaluator will verify

- Is the delta meaningful (≥5%)?
- If delta is low: which defense is likely failing — citation lock, blinded round, selective context?
- Cost: are we going to blow the API budget by Phase 4?

---

## Phase 4 — Consensus-Bias Hardening

**Hours 24-48**

**Goal:** Verify all six anti-sycophancy defenses (`PROJECT.md` §5.3) are working. Push CONSILIUM > baseline by ≥10%.

### Tasks

1. **Audit each defense in code.** For each of the six, point to the file/function that implements it:
   1. Blinded initial round — where?
   2. Citation lock — where?
   3. Hardcoded specialty bias — where (in prompts.jac)?
   4. Temperature stratification — where?
   5. Devil's Advocate — where?
   6. Selective context per walker — where? **THIS IS THE EASIEST ONE TO MISS.**

2. **Scale benchmark to 100 cases.**

3. **Ablation study.** For each defense, disable it and re-run benchmark on 50 cases. Record the accuracy drop. This identifies the strongest contributors.

4. **Write a one-paragraph ablation note.** This becomes pitch material — judges love a defended architectural choice.

### Acceptance Criteria

- [ ] All 6 defenses confirmed present in code with file:line citations
- [ ] 100-case CONSILIUM run complete
- [ ] CONSILIUM top-3 > baseline top-3 by ≥10 percentage points
- [ ] Ablation study complete (at minimum, ablate citation lock and blinded round)
- [ ] Ablation paragraph written and saved to `eval/results/ablation_note.md`

### Summary Template

```
PHASE 4 COMPLETE

All 6 defenses present in code:
1. Blinded round: yes/no — implemented at <file:line>
2. Citation lock: yes/no — implemented at <file:line>
3. Specialty bias: yes/no — implemented at <file:line>
4. Temperature stratification: yes/no — implemented at <file:line>
5. Devil's Advocate: yes/no — implemented at <file:line>
6. Selective context: yes/no — implemented at <file:line>

Benchmark (100 cases):
- CONSILIUM top-1: <X%>
- CONSILIUM top-3: <Y%>
- Baseline top-3 (100 cases): <Y_baseline%>
- Delta: <delta%>

Ablation results (accuracy drop when defense removed):
- Without citation lock: <-X%>
- Without blinded round: <-Y%>
- Without specialty bias: <-Z%>
- (others as completed)

Strongest defense (largest accuracy contribution): <name>
Ablation note paragraph: <paste>
Blockers: <none | description>
```

### Evaluator will verify

- Is the delta ≥10%? If not, what's the path to get there?
- Are all six defenses actually distinct mechanisms (not just one renamed five times)?
- Does the ablation note tell a clear story for the pitch?

---

## Phase 5 — Frontend & Live Visualization

**Hours 48-72**

**Goal:** A Lovable-generated React frontend that visualizes the live debate. This wins Best Demo.

### Tasks

1. **Use Lovable** to scaffold a React frontend (auto-claims the Lovable sponsor prize). Prompt Lovable for:
   - A case input area (paste MedQA vignette text)
   - 7 specialist panels arranged in a grid, each showing the walker's name + specialty + temperature + current state (thinking / posted / debating / finalized) + streaming hypothesis text
   - A central graph visualization (react-flow library) showing nodes/edges as walkers populate them
   - A "round indicator" (INITIAL / DEBATE / ADVERSARIAL / FINAL)
   - A final differential ranking section at the bottom

2. **Wire frontend to backend** via `jac-client` (single .jac file unified stack — see `PROJECT.md` §3 stack table). The Jac backend streams events (hypothesis posted, edge created, phase changed) to the frontend.

3. **Test on 3 MedQA cases end-to-end.** Verify:
   - Hypotheses stream visibly (not appear all at once after 60s of spinner)
   - Graph visualization updates as walkers traverse
   - Phase transitions are visible

### Acceptance Criteria

- [ ] Frontend renders 7 specialist panels
- [ ] Hypotheses stream live during execution (motion from second 1)
- [ ] Graph visualization shows nodes/edges forming
- [ ] Phase indicator visibly transitions
- [ ] Works on at least 3 cherry-picked demo cases

### Common pitfalls

- **Spending Day 4 on the frontend.** Reserve Day 4 entirely for Phase 6 (demo recording, pitch deck, submission). If the frontend isn't ready by hour 72, freeze its scope and move on.
- **Trying to make latency disappear.** You can't. Make the UI feel alive instead — streaming text, animated graph, progress indicators.

### Summary Template

```
PHASE 5 COMPLETE
- Frontend URL (localhost): <url>
- Lovable project link: <url>
- 3 test cases used: <case 1>, <case 2>, <case 3>
- Per-case latency observed: <case 1: Xs, case 2: Ys, case 3: Zs>
- Streaming actually works (text appears progressively): yes/no
- Graph viz works: yes/no
- 30-second screen recording of one debate: <link or path>
- Self-rating of visual polish (1-10): <number>
- Blockers: <none | description>
```

---

## Phase 6 — Polish, Demo, Pitch, Submit

**Hours 72-96 (RESERVE THIS ENTIRE BLOCK)**

**Goal:** Ship. Submit. Maximize prize sweep.

### Tasks

1. **Pick the 3 most cinematic demo cases** (from your MedQA pool):
   - Best: presents like one specialty (e.g., cardiac) but the correct answer is in another (e.g., endocrine). Watching the rheumatologist or endocrinologist walker "catch" what cardiology missed is the killer moment.
   - Validate: run each case at least 3 times. Pick the cases where the right answer surfaces reliably.

2. **Pre-record live runs** of all 3 cases. Save the action traces (timestamps + events). This is your insurance against live latency or API hiccups during the recorded demo.

3. **Record the 3-minute demo video** (script tightly):
   - **0:00-0:20 — Hook.** "Diagnostic error kills more Americans every year than breast cancer and prostate cancer combined." Hard cut to product.
   - **0:20-0:40 — Slide 2: benchmark numbers.** "CONSILIUM beats single-prompt 'board of 7' by X% on 100 standardized cases. Here's why."
   - **0:40-2:00 — Live demo.** Paste case. Show council convening. Highlight the disagreement → adversarial round → convergence. End on the correct rare diagnosis.
   - **2:00-2:30 — Why Jac.** Show the graph evolving. One sentence: "Each agent is a walker. Walker traversal is the reasoning. The graph is the memory."
   - **2:30-3:00 — Market + roadmap.** $30/mo consumer second-opinion product. 330M users in US alone. Roadmap to B2B clinical decision support.

4. **Edit the 30-second viral clip** from the demo. Best moment: the visible "disagreement → adversarial walker fires → convergence on correct answer." This is what gets shared.

5. **Write the Devpost project description** following the pitch skeleton in `PROJECT.md` §6. Include:
   - Problem statement with the diagnostic-error stat
   - Architecture diagram
   - Benchmark numbers
   - Tech stack
   - How Jac was used (this is what wins Best Use of Jac)
   - Roadmap

6. **Build the pitch deck** (PDF, max 7 slides per `PROJECT.md` §6).

7. **Post the viral clip to LinkedIn and Instagram** with timing for maximum likes by May 19 (the deadline for those prizes). Use #JacHacks, #AgenticAI, #HealthTech.

8. **Submit on Devpost** before the deadline. Include:
   - Public GitHub URL
   - Demo video (≤3 min)
   - Project description
   - Track: Consumer Healthcare

### Acceptance Criteria

- [ ] Demo video recorded, duration < 3:00
- [ ] 30-second viral clip ready
- [ ] Devpost submission complete with all required fields
- [ ] LinkedIn + Instagram posts published with clip
- [ ] Pitch deck PDF in `demo/`
- [ ] Public GitHub URL pasted in Devpost
- [ ] Track selected: Consumer Healthcare

### Summary Template

```
PHASE 6 COMPLETE — SUBMITTED

- Demo video duration: <m:ss>
- Devpost submission URL: <url>
- GitHub repo (public): <url>
- LinkedIn post URL: <url> (posted at <timestamp>)
- Instagram post URL: <url> (posted at <timestamp>)
- Pitch deck: <path or link>
- Final benchmark numbers (CONSILIUM vs baseline, 100 cases):
  - Top-1: <C%> vs <B%>
  - Top-3: <C%> vs <B%>
- Tracks/prizes targeted in submission:
  - [ ] Consumer Healthcare (primary)
  - [ ] Best Use of Jac
  - [ ] Best Demo
  - [ ] Best Startup Idea
  - [ ] Best LinkedIn Post
  - [ ] Best Instagram Post
  - [ ] Lovable

Subjective demo "wow moment" (one sentence): <description>
Anything you'd change if you had another day: <reflection>
```

---

## Blocker Template

Use any time you're stuck for >2 hours on the same issue.

```
BLOCKER REPORT
- Current phase: <number>
- Time spent on this issue: <hours>
- What I'm trying to do: <one sentence>
- What's happening instead: <one sentence>
- What I've tried:
  - <attempt 1 and result>
  - <attempt 2 and result>
  - <attempt 3 and result>
- Files/code involved: <paths>
- Error message (if any, paste verbatim): <paste>
- My current hypothesis: <what I think is wrong>
- Specific question for evaluator: <question>
```

---

## Anti-burnout reminders

- You have 96 hours. You should sleep ~24 of them. Real budget: 72.
- Phase 6 (demo + pitch + submission) takes longer than people expect. Reserve Day 4. Do not let Phase 5 leak into it.
- If you're stuck for >2 hours on one issue, stop and report. Don't grind alone.
- **Submit a working version by hour 80, even if rough.** Polish in the last 16. The cardinal sin of a hackathon is missing the deadline because you were perfecting.
- Eat. Drink water. Take a 20-minute walk between phases. Tired code is bad code.

---

## When to escalate to evaluator

- Every phase completion → paste Summary Template
- Any blocker > 2 hours → paste Blocker Template
- Any deviation from `PROJECT.md` you want to make → ask first
- Any time the benchmark numbers look weird (way too high or way too low) → ask
- Any time you're tempted to skip Phase 1 (audit harness) → STOP, ask
- Any time Jac syntax feels uncertain → ask, don't guess
