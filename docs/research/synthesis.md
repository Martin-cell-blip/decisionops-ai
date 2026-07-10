# User Evidence Synthesis v0

## Evidence status

- 12 public behavior records collected from bookkeeping, Amazon Seller and Shopify communities.
- 0 first-party interviews completed as of initial repository build.
- Public posts are desk research and must not be described as interviews.
- 30-persona **synthetic panel** added 2026-07-10 ([synthetic_panel.csv](synthetic_panel.csv), [findings](synthetic_panel_findings.md)) for hypothesis generation only; synthetic responses never count toward the participant threshold.

## Emerging behavioral clusters

### 1. Gross-to-net reconciliation breaks across systems

Users combine platform reports, processor payouts, refunds, fees and bank deposits. The records differ in grain and timing, so a bank feed alone does not remove the exception investigation work. This supports component-level evidence and period cut-off checks.

### 2. Automation can create duplicate work

Manual entries are sometimes retained after an integration is enabled, creating duplicated revenue or expenses. The product must explain the source of a duplicate and preserve human approval rather than silently delete it.

### 3. Merchants rebuild missing decisions in spreadsheets

Inventory value, month-by-SKU sales, unfulfilled quantity and cost freshness are repeatedly assembled outside the platform. A useful Agent should operate on a transparent metrics table and expose filters, assumptions and reason codes.

### 4. Trust depends on evidence, not fluent prose

Users repeatedly describe checking reports, clearing accounts, dates and component details. This supports the evidence-first architecture and argues against a chat-only interface.

## Current product decisions

1. Keep deterministic calculations as the source of truth.
2. Require evidence IDs in model-generated rationale.
3. Gate reject, recover, price, scale and delist actions.
4. Treat refunds, reserves and cross-period events as the next settlement data-model expansion.
5. Recruit 7-14 action-qualified participants before claiming validated demand.
6. Queue hypotheses H1-H5 from the synthetic panel for real-interview validation; apply the three interview-guide changes (reviewer screener, time-split prompt, thin-data prototype case).

