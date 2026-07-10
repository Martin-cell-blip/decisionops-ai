from __future__ import annotations

import re
from statistics import median

from .citations import normalize_citations, parse_citations
from .providers import TextProvider, build_provider
from .schemas import (
    AgentTrace,
    Evidence,
    GrowthDecision,
    GrowthRecommendation,
    MerchantSnapshot,
)


def _rate(safe_numerator: float, denominator: float) -> float:
    return 0.0 if denominator <= 0 else safe_numerator / denominator


# Below these observation counts, ranking SKUs is noise dressed up as advice.
MIN_TOTAL_ORDERS = 30
MIN_TOTAL_VIEWS = 500


def _insufficient_evidence_decision(
    snapshot: MerchantSnapshot, provider: TextProvider, total_orders: int, total_views: int
) -> GrowthDecision:
    evidence = [
        Evidence(evidence_id="E1", source="merchant_snapshot", fact="total orders in period", value=total_orders),
        Evidence(evidence_id="E2", source="merchant_snapshot", fact="total views in period", value=total_views),
    ]
    diagnosis = (
        f"Insufficient evidence for {snapshot.period}: {total_orders} orders and {total_views} views "
        f"are below the minimum observation thresholds ({MIN_TOTAL_ORDERS} orders, {MIN_TOTAL_VIEWS} views) "
        "[E1][E2]. No SKU ranking is produced because it would present noise as a recommendation. "
        "Collect more history or widen the period before acting."
    )
    trace = [
        AgentTrace(step=1, operation="plan", result="Diagnose demand, conversion, margin assumption, quality and stock"),
        AgentTrace(step=2, operation="execute_tools", result=f"Observed {total_orders} orders / {total_views} views - below evidence thresholds"),
        AgentTrace(step=3, operation="narrate", result="Insufficient-evidence template; no model narration requested"),
        AgentTrace(step=4, operation="human_gate", result="No actions proposed; nothing to approve"),
    ]
    return GrowthDecision(
        merchant_id=snapshot.merchant_id,
        diagnosis=diagnosis,
        recommendations=[],
        evidence=evidence,
        trace=trace,
        assumptions=[
            "Thresholds are conservative defaults, not statistical power calculations.",
            "No causal price elasticity is claimed without a randomized or quasi-experimental test.",
        ],
        model_provider=provider.name,
        narration_source="template",
    )


def diagnose_merchant(
    snapshot: MerchantSnapshot,
    provider: TextProvider | None = None,
) -> GrowthDecision:
    provider = provider or build_provider()
    total_orders = sum(item.orders for item in snapshot.skus)
    total_views = sum(item.views for item in snapshot.skus)
    if total_orders < MIN_TOTAL_ORDERS or total_views < MIN_TOTAL_VIEWS:
        return _insufficient_evidence_decision(snapshot, provider, total_orders, total_views)
    trace = [AgentTrace(step=1, operation="plan", result="Diagnose demand, conversion, margin assumption, quality and stock")]
    total_gmv = sum(item.gmv for item in snapshot.skus) or 1.0
    conversions = [_rate(item.orders, item.views) for item in snapshot.skus]
    median_conversion = median(conversions) if conversions else 0.0
    median_gmv = median([item.gmv for item in snapshot.skus]) if snapshot.skus else 0.0

    evidence: list[Evidence] = []
    candidates: list[tuple[float, GrowthRecommendation]] = []
    for item in snapshot.skus:
        conversion = _rate(item.orders, item.views)
        gmv_share = item.gmv / total_gmv
        stock_pressure = _rate(item.stock_units, max(item.orders, 1))
        ids: list[str] = []
        for fact, value in [
            (f"{item.sku} GMV share", round(gmv_share, 4)),
            (f"{item.sku} conversion", round(conversion, 4)),
            (f"{item.sku} rating", item.rating),
            (f"{item.sku} assumed margin rate", item.margin_rate_assumption),
            (f"{item.sku} stock per order", round(stock_pressure, 2)),
        ]:
            eid = f"E{len(evidence)+1}"
            evidence.append(Evidence(evidence_id=eid, source="merchant_snapshot", fact=fact, value=value))
            ids.append(eid)

        if item.rating < 3.5:
            action, direction = "IMPROVE", "quality"
            score = 100 + item.gmv
            experiment = "Review recent complaints; fix the dominant quality issue before adding traffic."
            approval = False
        elif item.orders == 0 or (item.gmv < median_gmv * 0.35 and stock_pressure > 6):
            action, direction = "DELIST_REVIEW", "cash_release"
            score = 90 + stock_pressure
            experiment = "Pause replenishment for 14 days; review substitution and liquidation options before delisting."
            approval = True
        elif item.rating >= 4.5 and conversion >= median_conversion and gmv_share >= 0.12:
            action, direction = "SCALE", "growth"
            score = 80 + gmv_share * 100 + conversion * 100
            experiment = "Increase qualified traffic by 15% with a matched holdout; stop if return or complaint rate worsens."
            approval = True
        elif item.margin_rate_assumption >= 0.35 and item.rating >= 4.2:
            action, direction = "TEST_PRICE_UP", "margin"
            score = 70 + item.margin_rate_assumption * 100
            experiment = "Run a +3% price test against a holdout; measure conversion and contribution margin, not GMV alone."
            approval = True
        else:
            action, direction = "PROTECT", "growth"
            score = 40 + gmv_share * 100
            experiment = "Hold price and inventory policy; monitor conversion and rating weekly."
            approval = False

        candidates.append((score, GrowthRecommendation(
            sku=item.sku,
            action=action,
            priority=1,
            expected_direction=direction,
            experiment=experiment,
            approval_required=approval,
            evidence_ids=ids,
        )))

    candidates.sort(key=lambda pair: pair[0], reverse=True)
    recommendations = [item for _, item in candidates[:5]]
    for index, item in enumerate(recommendations, 1):
        item.priority = index
    trace.append(AgentTrace(step=2, operation="execute_tools", result=f"Scored {len(snapshot.skus)} SKUs and selected {len(recommendations)} actions"))

    assumptions = [
        "Margin rate is an input assumption, not observed accounting profit.",
        "No causal price elasticity is claimed without a randomized or quasi-experimental test.",
        "Recommendations are decision candidates; price and delist actions require human approval.",
    ]
    top = recommendations[0] if recommendations else None
    fallback = (
        f"Portfolio diagnosis for {snapshot.period}: prioritize {top.sku} with action {top.action}. "
        "The recommendation ranks measured demand, conversion, quality and stock signals while preserving explicit assumptions."
        if top else "No SKU data was provided; no recommendation can be made."
    )
    prompt = (
        "Write a two-sentence merchant diagnosis. Do not promise revenue. "
        "Cite at least one supplied evidence ID in square brackets with exactly one ID per bracket, "
        "like [E3] or [E3][E7]; never group IDs in one bracket such as [E3, E7]. "
        f"recommendations={[item.model_dump() for item in recommendations]}; "
        f"evidence={[item.model_dump() for item in evidence]}"
    )
    generated = provider.generate(
        system="You explain evidence-grounded merchant decisions and clearly separate observations from assumptions.",
        user=prompt,
    )
    generated = normalize_citations(generated) if generated else generated
    parsed_citations = parse_citations(generated)
    valid_citations = {item.evidence_id for item in evidence}
    if generated and parsed_citations and parsed_citations <= valid_citations:
        diagnosis = generated
        narration_source = "model"
        trace.append(AgentTrace(step=3, operation="narrate", result=f"Narrated by {provider.name}"))
    else:
        diagnosis = fallback
        narration_source = "template"
        trace.append(AgentTrace(step=3, operation="narrate", result="Used verified deterministic template"))
    trace.append(AgentTrace(step=4, operation="human_gate", result="Flagged price, scale and delist actions for approval"))

    return GrowthDecision(
        merchant_id=snapshot.merchant_id,
        diagnosis=diagnosis,
        recommendations=recommendations,
        evidence=evidence,
        trace=trace,
        assumptions=assumptions,
        model_provider=provider.name,
        narration_source=narration_source,
    )
