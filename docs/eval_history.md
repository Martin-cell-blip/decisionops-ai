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

## Run 3 - Baidu Qianfan live narration test (2026-07-10)

Live calls through the OpenAI-compatible `/v2` endpoint with a real `QIANFAN_API_KEY`.

| Model | Settlement (S005_OVERBILLED) | Growth (M001_HOMEWARE) |
|---|---|---|
| `ernie-5.1` | Narrated by qianfan, citations verified | Passed once, then account trial quota exhausted (`403 account_overdue`) -> verified template fallback, decision path unaffected |
| `ernie-4.5-turbo-32k` | Narrated by qianfan, citations verified | Intermittent: passes when citations are written as single-ID brackets `[E3]`; falls back when the model writes only grouped citations `[E16, E17]` |

### Failure analysis

1. **Grouped citations.** ERNIE sometimes cites `[E16, E17, E18]` in one bracket. The verifier's regex only accepts `[E3]`-style single-ID brackets, so such narrations are rejected and the template is used. Consistent with the Run 1 decision, the verifier is not loosened to manufacture a higher pass rate; instead the narration prompt is the right place to demand single-ID bracket format explicitly.
2. **Account quota.** `ernie-5.1` is a paid tier; after the trial quota the endpoint returns `403 account_overdue`. `ernie-4.5-turbo-32k` remained available. Provider errors never reached the decision path - the documented degradation contract held in production conditions.
3. **Invalid model ids.** Legacy names (`ernie-speed-8k`, `ernie-lite-8k`) return `401 invalid_model` on the v2 endpoint.

