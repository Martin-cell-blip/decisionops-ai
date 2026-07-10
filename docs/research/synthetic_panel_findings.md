# Synthetic Panel Findings

> ⚠️ **SYNTHETIC RESEARCH — NOT REAL INTERVIEWS.**
> The 30 personas in [`synthetic_panel.csv`](synthetic_panel.csv) were generated with an LLM on 2026-07-10.
> They are grounded in (a) the 12 sourced public behavior records in [`desk_research.csv`](desk_research.csv),
> (b) the story-prompt structure of [`interview_guide.md`](interview_guide.md), and
> (c) hands-on product walkthroughs of the live CLI/API (see "Product walkthrough observations" below).
> Their purpose is **hypothesis generation and interview-guide stress-testing only**.
> Under the synthesis rule in the interview guide, no synthetic response counts toward the
> "three independent participants" threshold. [`interview_log.csv`](interview_log.csv) remains the
> only record of first-party research and is still empty.

## Method

1. Segment quotas mirror the recruitment criteria at ~2x scale: 13 settlement-side practitioners,
   12 merchant/growth operators, 5 skeptics/gatekeepers (including tool-abandoners, an auditor,
   an IT gate and a buyer).
2. Each persona's primary pain extends a pattern observed in the public records (UR01-UR12);
   no persona asserts a fact that contradicts them.
3. Reactions to the two core product mechanisms (evidence citations, human approval gate) were
   varied deliberately rather than written to flatter the product.

## Product walkthrough observations (real usage, 2026-07-10)

These three observations come from actually operating the product, not from the synthetic panel:

1. **Fallback quality gap is visible.** When narration falls back (quota error or rejected
   citations), the template text is much terser than model narration. A user who does not read
   the trace would experience an unexplained quality drop. → Surface a narration-source badge in
   the demo UI.
2. **Grouped citations trigger fallback.** ERNIE models sometimes cite `[E16, E17]` in one
   bracket; the strict verifier rejects this and degrades. → Tighten the prompt to demand
   single-ID brackets; do not loosen the verifier.
3. **Provider health is silent.** A `403 account_overdue` degrades narration gracefully but
   invisibly. → Expose provider status in `/health`.

## Synthesized clusters (hypotheses, not findings)

| # | Cluster | Synthetic support | Consistent public records |
|---|---|---|---|
| C1 | Exception *investigation*, not matching, is where hours go | 9/13 settlement personas | UR01 UR04 UR05 UR07 |
| C2 | Evidence citations are most valued by reviewers-of-others (agencies, CFOs, auditors) | SP04 SP10 SP23 SP26 SP28 | — (untested) |
| C3 | The approval gate is an adoption *requirement* for anyone with liability, and an irrelevance for solo operators | requires: 11; indifferent: 4 | — (untested) |
| C4 | Tool-abandoners demand explainability precisely because a prior tool acted silently | SP12 SP20 | UR05 |
| C5 | Read-only / CSV / local entry modes defuse the top objections (account access, data boundary, setup trauma) | SP06 SP07 SP16 SP20 SP27 | UR06 UR11 |
| C6 | Thin-data honesty ("insufficient evidence" outputs) builds trust with early-stage merchants | SP22 SP25 | — (untested) |

## Hypotheses queued for REAL interviews

- **H1** (from C1): ≥60% of settlement practitioners' exception time is investigation, not matching. → Guide prompts S1-S4 already cover this; add a time-split estimate question.
- **H2** (from C2): willingness-to-pay concentrates in review-of-others roles, not doers. → Add a "who reviews your work / whose work do you review" screener.
- **H3** (from C3): approval-gate framing should differ by segment (control feature vs. skippable step). → Prototype test: observe whether the participant asks to bypass approval.
- **H4** (from C5): a read-only CSV pilot converts better than an integration pilot. → Recruitment copy should offer the CSV path explicitly.
- **H5** (from C6): an explicit "not enough evidence" output increases trust with <90-day-history merchants. → Add a thin-data case to the prototype test.

## Interview-guide changes applied

1. Added screener: "Do you review someone else's reconciliation/decisions, or does someone review yours?" (tests H2).
2. Added settlement prompt: "Of your last exception, how much time was finding the mismatch vs. explaining/deciding it?" (tests H1).
3. Prototype test now includes one thin-data merchant case (tests H5).

## What this panel cannot do

It cannot validate demand, pricing, PMF or any quantitative claim. Synthetic personas share the
biases of the model and sources that produced them; they systematically miss workflow details that
only real practitioners reveal. The 7-14 real interviews specified in the guide remain the
blocking next step before any adoption or revenue claim.
