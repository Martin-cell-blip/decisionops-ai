# DecisionOps AI

**Evidence-grounded agents for settlement risk and merchant growth decisions — running on real e-commerce data.**

[Live bilingual site](https://martin-cell-blip.github.io/decisionops-ai/) (EN/中文) · [中文 README](README.zh-CN.md) · [Product requirements](docs/PRD.md) · [User evidence synthesis](docs/research/synthesis.md)

DecisionOps AI contains two bounded agents in one new project:

- **Settlement Agent** checks invoice completeness, delivery, duplicates and contract tolerance before recommending pay, reject, recover, request-invoice or manual-review actions.
- **Growth Agent** ranks SKU quality, cash-release, scale and price-test opportunities without presenting assumptions as causal forecasts.

The design is intentionally conservative: deterministic Python owns calculations and policy, an optional LLM writes cited explanations, a verifier rejects invalid `[E#]` references, and a human approves consequential actions.

## Real data

The live site and the committed data bundles run on the public **Olist Brazilian e-commerce dataset** (2016-10 ~ 2018-08: 112,650 order lines, ~R$13.6M GMV, 3,095 sellers) plus a carrier-bill pipeline with labeled injected anomalies (99,485 bill lines):

- **24 real merchants** (including 2 deliberately thin ones that trigger the insufficient-evidence guard on real data). Decisions are precomputed by the repository's Python agents via `scripts/build_real_datasets.py` — the web page renders agent output, it does not fake it.
- **30 real settlement cases** — every classification is checked against the injection ground truth (30/30 consistent).
- **Per-field provenance**: real (straight from Olist) / proxy (derived, disclosed formula) / assumption (placeholder) / synthetic (deterministic, disclosed). Unobservable fields are never passed off as data.

## The live site

- **Growth explorer**: browse decision queues, evidence chains and provenance-badged SKU tables for 24 real sellers.
- **Settlement workbench**: review 30 real cases and approve/reject them; your approval queue persists in localStorage.
- **Bring your own data**: drop a SKU CSV or an invoice CSV and run the same decision logic entirely inside the browser tab — nothing is uploaded. The in-page engine is a documented JS mirror; the Python package remains canonical.
- **Bilingual**: one-click EN/中文 toggle, persisted.

## Verified status

| Capability | Status | Evidence |
|---|---|---|
| Offline decision paths | Tested | 200/200 seeded binary eval cases pass |
| API | Tested | FastAPI health, catalogue and both agent endpoints |
| OpenAI narration | Live-tested | `gpt-4.1-mini` on one settlement and one growth case |
| Baidu Qianfan narration | Live-tested | `ernie-5.1` and `ernie-4.5-turbo-32k`; after citation normalization, 6/6 live calls accepted with verification unweakened ([details](docs/eval_history.md)) |
| Thin-data guard | Tested | Growth Agent returns an explicit insufficient-evidence decision with no recommendations below 30 orders / 500 views (`M002_NEW_STORE`) |
| Real-data consistency | Tested | 30 real carrier-bill cases classified consistently with injected ground truth (30/30) |
| Public user evidence | Collected | 12 sourced behavior records |
| First-party interviews | Not yet completed | Interview guide and empty log are included |
| Business impact / PMF | Not claimed | Requires a real pilot and willingness-to-pay test |

## Why this is an Agent, not a chat wrapper

```text
plan
  -> execute deterministic tools
  -> apply bounded policy
  -> ask model for cited narration (optional)
  -> verify citation IDs or fall back
  -> require human approval for money / price / inventory actions
```

The LLM cannot change a classification, transfer money, update a price or delist a SKU. This is the product's human-AI boundary, not a temporary limitation.

## Quick start

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"

pytest
python scripts/run_evals.py
python -m decisionops.cli settlement S005_OVERBILLED
python -m decisionops.cli growth M001_HOMEWARE
uvicorn decisionops.api:app --reload
```

Then open `http://127.0.0.1:8000/docs` for the API console.

## Model providers

Offline mode is the default and needs no key. Copy `.env.example` to `.env` or export the variables when adding a model.

### OpenAI

```bash
set LLM_PROVIDER=openai
set OPENAI_API_KEY=...
set OPENAI_MODEL=gpt-4.1-mini
```

### Baidu Qianfan

```bash
set LLM_PROVIDER=qianfan
set QIANFAN_API_KEY=...
set QIANFAN_MODEL=ernie-5.1
set QIANFAN_BASE_URL=https://qianfan.baidubce.com/v2
```

Qianfan's V2 inference API is OpenAI-compatible, and its current function-calling documentation uses the same base URL. See the [V2 API documentation](https://cloud.baidu.com/doc/qianfan/s/qmh4sv5vi) and [function-calling guide](https://cloud.baidu.com/doc/qianfan-docs/s/xm95lyys5).

If a model is unavailable or its API fails, the deterministic decision path remains available and the narration layer falls back to a verified template.

## Executable evaluation

`scripts/run_evals.py` generates 140 settlement and 60 growth scenarios with a fixed seed. Each check is binary:

- expected classification;
- expected policy action;
- human-approval gate;
- evidence presence/linkage;
- explicit assumption disclosure.

The first growth eval run scored 20/60 because the scenarios mixed severe tail-stock risk with growth opportunities. The suite was redesigned to isolate four decision intents - scale, quality, price and cash release - rather than weakening the policy to manufacture a higher score. See the [evaluation history](docs/eval_history.md) and current [`eval_report.json`](artifacts/eval_report.json).

## User research

The repository separates evidence types:

- [`desk_research.csv`](docs/research/desk_research.csv): 12 public user-behavior records with URLs. These are **not interviews**.
- [`interview_guide.md`](docs/research/interview_guide.md): story-based prompts for 7-14 action-qualified finance and merchant participants.
- [`interview_log.csv`](docs/research/interview_log.csv): empty first-party research log.
- [`recruitment_copy.md`](docs/research/recruitment_copy.md): screening and outreach copy; the repository also includes a public workflow-story issue template.
- [`synthesis.md`](docs/research/synthesis.md): current behavioral clusters and product decisions.
- [`synthetic_panel.csv`](docs/research/synthetic_panel.csv) + [`synthetic_panel_findings.md`](docs/research/synthetic_panel_findings.md): a 30-persona **LLM-generated synthetic panel**, clearly labeled, used only to generate hypotheses and stress-test the interview guide. Synthetic responses are never counted as user evidence.

No first-party interview, time-saved figure, revenue lift or willingness-to-pay result is claimed at launch.

## Repository map

```text
src/decisionops/
  settlement_agent.py  # evidence checks + policy + narration verifier
  growth_agent.py      # SKU diagnosis + reversible experiments
  providers.py         # none / OpenAI / Baidu Qianfan
  citations.py         # citation normalization + parsing (format tolerance, strict IDs)
  schemas.py           # typed inputs, decisions, evidence and traces
  api.py               # FastAPI endpoints
data/demo/              # disclosed synthetic demo records
scripts/run_evals.py    # 200-case executable PRD
scripts/build_real_datasets.py  # Olist -> real merchant/settlement bundles (agent-computed)
tests/                  # unit and API tests
docs/                   # bilingual live site (assets/, data/), PRD and user research
```

## Run the API

```bash
uvicorn decisionops.api:app --host 127.0.0.1 --port 8000
```

Endpoints:

- `GET /health`
- `GET /api/demo`
- `GET /api/settlement/{case_id}?provider=none|openai|qianfan`
- `GET /api/growth/{merchant_id}?provider=none|openai|qianfan`

## Data and claim boundary

The launch demo uses synthetic settlement cases and a synthetic merchant snapshot designed to exercise decision paths. It demonstrates product logic and software quality, not real business impact. Production pilots must add consented data, domain-specific policy review and human outcome labels.

## License

MIT
