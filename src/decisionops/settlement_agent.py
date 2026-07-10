from __future__ import annotations

from collections import Counter, defaultdict
import re

from .citations import normalize_citations, parse_citations
from .providers import TextProvider, build_provider
from .schemas import (
    AgentTrace,
    Evidence,
    RiskLevel,
    SettlementCase,
    SettlementDecision,
)


ACTION_PRECEDENCE = {
    "PAY": 0,
    "REQUEST_INVOICE": 1,
    "MANUAL_REVIEW": 2,
    "RECOVER": 3,
    "REJECT": 4,
}


def _classify(case: SettlementCase) -> tuple[list[str], list[Evidence], float, float]:
    orders = {order.order_id: order for order in case.orders}
    invoice_by_order = defaultdict(list)
    evidence: list[Evidence] = []
    classifications: list[str] = []

    for line in case.invoice_lines:
        invoice_by_order[line.order_id].append(line)

    for order_id, lines in invoice_by_order.items():
        order = orders.get(order_id)
        billed = round(sum(line.billed_amount for line in lines), 2)
        if order is None:
            classifications.append("MISSING_ORDER")
            evidence.append(Evidence(
                evidence_id=f"E{len(evidence)+1}", source="order_system",
                fact=f"Invoice references unknown order {order_id}", value=billed,
            ))
            continue

        if len(lines) > 1:
            classifications.append("DUPLICATE")
            evidence.append(Evidence(
                evidence_id=f"E{len(evidence)+1}", source="carrier_invoice",
                fact=f"Order {order_id} appears on {len(lines)} invoice lines", value=billed,
            ))
        if not order.delivered:
            classifications.append("NOT_DELIVERED")
            evidence.append(Evidence(
                evidence_id=f"E{len(evidence)+1}", source="delivery_event",
                fact=f"Order {order_id} has no completed delivery", value=False,
            ))

        variance = billed - order.expected_amount
        tolerance = order.expected_amount * case.contract_tolerance_pct
        if len(lines) == 1 and order.delivered:
            if variance > tolerance:
                classifications.append("OVERBILLED")
            elif variance < -tolerance:
                classifications.append("UNDERBILLED")
            else:
                classifications.append("MATCH")
        evidence.append(Evidence(
            evidence_id=f"E{len(evidence)+1}", source="contract_rate_check",
            fact=f"Order {order_id}: billed minus expected", value=round(variance, 2),
        ))

    for order_id, order in orders.items():
        if order.delivered and order_id not in invoice_by_order:
            classifications.append("NOT_BILLED")
            evidence.append(Evidence(
                evidence_id=f"E{len(evidence)+1}", source="invoice_completeness_check",
                fact=f"Delivered order {order_id} has no carrier invoice", value=order.expected_amount,
            ))

    expected_total = round(sum(order.expected_amount for order in case.orders), 2)
    billed_total = round(sum(line.billed_amount for line in case.invoice_lines), 2)
    if not classifications:
        classifications.append("MATCH")
    return classifications, evidence, expected_total, billed_total


def _policy(classifications: list[str]) -> tuple[str, str, RiskLevel, float]:
    unique = set(classifications)
    non_match = unique - {"MATCH"}
    if not non_match:
        return "MATCH", "PAY", RiskLevel.LOW, 1.0

    actions: list[str] = []
    if unique & {"MISSING_ORDER", "NOT_DELIVERED", "DUPLICATE"}:
        actions.append("REJECT")
    if "OVERBILLED" in unique:
        actions.append("RECOVER")
    if "UNDERBILLED" in unique:
        actions.append("MANUAL_REVIEW")
    if "NOT_BILLED" in unique:
        actions.append("REQUEST_INVOICE")

    action = max(actions, key=lambda item: ACTION_PRECEDENCE[item])
    classification = next(iter(non_match)) if len(non_match) == 1 else "MIXED_EXCEPTION"
    risk = RiskLevel.HIGH if action in {"REJECT", "RECOVER"} else RiskLevel.MEDIUM
    confidence = 0.85 if classification == "MIXED_EXCEPTION" else 0.98
    return classification, action, risk, confidence


def _template_rationale(classification: str, action: str, variance: float, evidence: list[Evidence]) -> str:
    ids = ", ".join(item.evidence_id for item in evidence)
    return (
        f"The deterministic checks classify this case as {classification}. "
        f"Net billed-minus-expected variance is {variance:.2f}; recommended action is {action}. "
        f"Decision is grounded in evidence [{ids}] and requires human approval before money moves."
    )


def review_settlement_case(
    case: SettlementCase,
    provider: TextProvider | None = None,
) -> SettlementDecision:
    provider = provider or build_provider()
    trace = [AgentTrace(step=1, operation="plan", result="Run completeness, delivery, duplicate and tolerance checks")]
    classifications, evidence, expected, billed = _classify(case)
    trace.append(AgentTrace(step=2, operation="execute_tools", result=f"Observed {Counter(classifications)}"))
    classification, action, risk, confidence = _policy(classifications)
    trace.append(AgentTrace(step=3, operation="apply_policy", result=f"{classification} -> {action}"))
    variance = round(billed - expected, 2)

    fallback = _template_rationale(classification, action, variance, evidence)
    cited_ids = [item.evidence_id for item in evidence]
    prompt = (
        "Write a concise finance-operations rationale. Do not change the classification or action. "
        "Cite evidence IDs in square brackets with exactly one ID per bracket, like [E1] or [E1][E2]; "
        "never group IDs in one bracket such as [E1, E2]. "
        "State that human approval is required before the action. If evidence is insufficient, explicitly say so.\n"
        f"classification={classification}; action={action}; variance={variance}; "
        f"evidence={[item.model_dump() for item in evidence]}"
    )
    generated = provider.generate(
        system="You explain bounded settlement decisions. Never invent documents, amounts or approvals.",
        user=prompt,
    )
    generated = normalize_citations(generated) if generated else generated
    parsed_citations = parse_citations(generated)
    valid_citations = set(cited_ids)
    approval_stated = action == "PAY" or "approval" in (generated or "").lower()
    if generated and parsed_citations and parsed_citations <= valid_citations and approval_stated:
        rationale = generated
        narration_source = "model"
        trace.append(AgentTrace(step=4, operation="narrate", result=f"Narrated by {provider.name}"))
    else:
        rationale = fallback
        narration_source = "template"
        trace.append(AgentTrace(step=4, operation="narrate", result="Used verified deterministic template"))

    approval_required = action != "PAY"
    trace.append(AgentTrace(step=5, operation="human_gate", result="approval required" if approval_required else "auto-pay eligible"))
    return SettlementDecision(
        case_id=case.case_id,
        classification=classification,
        action=action,
        risk_level=risk,
        approval_required=approval_required,
        expected_amount=expected,
        billed_amount=billed,
        variance_amount=variance,
        confidence=confidence,
        rationale=rationale,
        evidence=evidence,
        trace=trace,
        model_provider=provider.name,
        narration_source=narration_source,
    )
