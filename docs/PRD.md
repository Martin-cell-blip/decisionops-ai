# DecisionOps AI - Lightweight PRD

## 1. Problem and why now

Small finance and commerce teams often bridge systems with CSV exports, spreadsheets and manual review. The expensive part is not arithmetic; it is resolving ambiguous exceptions, locating supporting evidence and deciding which action is safe. General-purpose chatbots can explain a case but may invent facts or over-automate a consequential decision.

DecisionOps AI tests a bounded alternative: deterministic tools calculate facts, an LLM may summarize those facts, a verifier enforces citations, and a human approves consequential actions. This matters now because OpenAI-compatible model APIs make the narration layer portable, while enterprise Agent platforms such as Baidu Qianfan support function calling and model switching.

## 2. Target users

1. Finance operations analyst reconciling carrier, marketplace or payment-provider records.
2. Small e-commerce operator deciding which SKUs to scale, improve, test or review for delisting.
3. Manager who needs an auditable recommendation rather than an opaque score.

## 3. Jobs to be done

- When an invoice does not match operations data, help me identify the exception and supporting evidence so I can resolve it without searching line by line.
- When SKU performance is mixed, help me rank the next experiments so I can act without pretending that assumptions are causal estimates.
- When an action could move money, price or inventory, require explicit approval and preserve the decision trace.

## 4. Product principles

- **Evidence before prose:** every recommendation links to structured evidence IDs.
- **Use the right tool:** Python handles arithmetic and policy; the LLM handles concise explanation.
- **Bounded autonomy:** the model cannot change classification, transfer money, update price or delist a SKU.
- **Assumptions stay visible:** margin and elasticity assumptions are never presented as observed facts.
- **Portable model layer:** offline mode, OpenAI and Baidu Qianfan share one interface.

## 5. Scope

### Settlement Agent

- Detect match, over/under billing, duplicate billing, missing orders, undelivered billing, missing invoices and mixed exceptions.
- Produce expected, billed and variance amounts.
- Recommend pay, reject, recover, request invoice or manual review.
- Gate every non-pay action for human approval.

### Growth Agent

- Diagnose GMV share, conversion, rating, assumed margin and stock pressure.
- Rank scale, protect, price-test, improve and delist-review actions.
- Limit price experiments to +3% and require a holdout.
- Gate scale, price and delist actions for human approval.

## 6. Explicitly out of scope

- Moving funds, sending supplier disputes or changing marketplace prices.
- Claiming causal revenue impact from observational data.
- Replacing accountants, category managers or legal review.
- Storing production PII, invoices or platform credentials.

## 7. Success criteria (executable PRD)

| Requirement | Binary eval |
|---|---|
| Correct settlement classification | Expected class equals agent class |
| Correct settlement policy | Expected action equals agent action |
| Consequential action safety | Every non-pay action requires approval |
| Auditability | At least one evidence record exists |
| Growth prioritization | Top action matches the designed scenario |
| Growth safety | Price, scale and delist actions require approval |
| Honest uncertainty | Elasticity limitation appears in assumptions |

The seeded suite contains 140 settlement and 60 growth cases. LLM prose is not allowed to override these deterministic outputs.

## 8. Human-AI boundary

```text
Human uploads or selects a case
        |
Deterministic tools compute facts and candidate policy
        |
LLM optionally writes a cited explanation
        |
Verifier accepts cited prose or falls back to a template
        |
Human approves consequential action
```

## 9. Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Hallucinated evidence | Evidence-ID check and deterministic fallback |
| Wrong financial action | Policy code owns action; human gate owns execution |
| False precision in growth | Disclose assumptions; recommend experiments, not forecasts |
| Demo data mistaken for production | Clear provenance and synthetic-data label |
| API key leakage | Environment variables, `.env` ignored, no browser-side model calls |

## 10. Open validation questions

- Which exception types consume the most analyst time after auto-match?
- What evidence is required before a finance reviewer accepts a reject/recover suggestion?
- Which merchant decisions are frequent enough to justify an Agent rather than a dashboard?
- What level of explanation creates trust without adding review time?

