# Evaluation History

## Run 1 - growth scenario design failure

- Settlement: 140/140 passed.
- Growth: 20/60 passed.
- Overall: 160/200 passed.

### Failure cluster

Forty growth scenarios expected a scale or price-test recommendation while also containing an extreme low-GMV, high-stock tail SKU. The policy correctly prioritized cash-release review, so the expected label did not isolate the intended decision task.

### Decision

Do not weaken the policy or increase the growth-opportunity score. Split the growth suite into four scenario intents:

1. scale opportunity without a severe tail risk;
2. quality failure;
3. margin experiment without a severe tail risk;
4. cash-release risk.

## Run 2 - isolated decision intents

- Settlement: 140/140 passed.
- Growth: 60/60 passed.
- Overall: 200/200 passed.

This is a deterministic behavior check, not evidence of real-world accuracy or business impact.

