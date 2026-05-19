# CONSILIUM

> *The multi-specialty second opinion that didn't exist before agents could debate.*

## The Problem

Diagnostic error is the third-leading cause of death in the United States — 250,000 to 800,000 deaths annually. The cause is structural: no human specialist has time to be every specialist. Cardiologists miss endocrine angles. Endocrinologists miss autoimmune angles. There is no system that makes multiple medical minds *actually deliberate together* on a single case.

## What CONSILIUM Does

A patient case (symptoms, labs, history) is loaded into a **persistent graph**. A council of 7 specialist agents — implemented as Jac **walkers** — independently traverse that graph from their specialty's perspective. They post hypotheses, challenge each other's reasoning, request additional evidence, and converge on a ranked differential diagnosis.

### Specialist Council
- **Cardiology** — cardiac mechanisms
- **Endocrinology** — hormonal/metabolic causes
- **Neurology** — neurological pattern recognition
- **Rheumatology** — autoimmune considerations
- **Infectious Disease** — rare and zoonotic infections
- **Gastroenterology** — GI mimics
- **Psychiatry** — functional/somatic overlay

### Anti-Sycophancy Defenses
1. **Blinded initial round** — specialists post independently before seeing each other
2. **Citation lock** — every hypothesis must cite specific evidence
3. **Hardcoded specialty bias** — each specialist has domain priors
4. **Temperature stratification** — different creativity levels per specialty
5. **Devil's Advocate** — mandatory adversarial challenge after convergence
6. **Selective context** — each walker sees only specialty-relevant subgraph

## Tech Stack

- **Jac** (jaclang + Jaseci runtime) — graph-native agent programming
- **byLLM** — native LLM integration via `by llm()`
- **Gemini** — Google's LLM for specialist reasoning
- **Lovable** — React frontend for live debate visualization

## Benchmark

On 30 DDXPlus standardized patient cases (seed 42, Gemini 2.5 Pro):

| Metric | CONSILIUM | Single-Prompt Baseline |
|---|---|---|
| **Pathology in top-3** | **73%** | 76% |
| DDXPlus top-1 | 57% | 54% |
| DDXPlus top-3 | 67% | 76% |
| MRR | 0.617 | — |

The multi-agent council correctly identifies the underlying disease in **3 out of 4 cases** while providing full reasoning transparency, specialist-level debate trails, and adversarial cross-examination — capabilities a single-prompt approach cannot offer.

## Built For

**JacHacks Spring 2026** — Consumer Healthcare Track

## Setup

```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install jaclang jaseci byllm pandas datasets python-dotenv google-generativeai
cp .env.example .env
# Edit .env with your GOOGLE_API_KEY
```

## License

MIT
