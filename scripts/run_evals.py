from __future__ import annotations

import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from decisionops.growth_agent import diagnose_merchant
from decisionops.providers import NoModelProvider
from decisionops.schemas import MerchantSnapshot, OrderRecord, SettlementCase, SettlementLine, SkuMetric
from decisionops.settlement_agent import review_settlement_case

RNG = random.Random(20260710)


def make_settlement_case(index: int, kind: str) -> SettlementCase:
    expected = round(RNG.uniform(20, 500), 2)
    order_id = f"EVAL-O-{index:03d}"
    base = {"case_id": f"EVAL-S-{index:03d}", "contract_tolerance_pct": 0.02}
    if kind == "MATCH":
        billed = round(expected * RNG.uniform(0.985, 1.015), 2)
        return SettlementCase(**base, invoice_lines=[SettlementLine(line_id="L1", order_id=order_id, billed_amount=billed)], orders=[OrderRecord(order_id=order_id, expected_amount=expected, delivered=True)])
    if kind == "OVERBILLED":
        return SettlementCase(**base, invoice_lines=[SettlementLine(line_id="L1", order_id=order_id, billed_amount=round(expected * 1.2, 2))], orders=[OrderRecord(order_id=order_id, expected_amount=expected, delivered=True)])
    if kind == "UNDERBILLED":
        return SettlementCase(**base, invoice_lines=[SettlementLine(line_id="L1", order_id=order_id, billed_amount=round(expected * 0.75, 2))], orders=[OrderRecord(order_id=order_id, expected_amount=expected, delivered=True)])
    if kind == "DUPLICATE":
        line = SettlementLine(line_id="L1", order_id=order_id, billed_amount=expected)
        return SettlementCase(**base, invoice_lines=[line, line.model_copy(update={"line_id": "L2"})], orders=[OrderRecord(order_id=order_id, expected_amount=expected, delivered=True)])
    if kind == "MISSING_ORDER":
        return SettlementCase(**base, invoice_lines=[SettlementLine(line_id="L1", order_id=order_id, billed_amount=expected)], orders=[])
    if kind == "NOT_DELIVERED":
        return SettlementCase(**base, invoice_lines=[SettlementLine(line_id="L1", order_id=order_id, billed_amount=expected)], orders=[OrderRecord(order_id=order_id, expected_amount=expected, delivered=False)])
    return SettlementCase(**base, invoice_lines=[], orders=[OrderRecord(order_id=order_id, expected_amount=expected, delivered=True)])


def settlement_eval() -> dict:
    kinds = ["MATCH", "OVERBILLED", "UNDERBILLED", "DUPLICATE", "MISSING_ORDER", "NOT_DELIVERED", "NOT_BILLED"]
    expected_action = {
        "MATCH": "PAY", "OVERBILLED": "RECOVER", "UNDERBILLED": "MANUAL_REVIEW",
        "DUPLICATE": "REJECT", "MISSING_ORDER": "REJECT", "NOT_DELIVERED": "REJECT",
        "NOT_BILLED": "REQUEST_INVOICE",
    }
    failures = []
    for index in range(140):
        kind = kinds[index % len(kinds)]
        decision = review_settlement_case(make_settlement_case(index, kind), NoModelProvider())
        checks = {
            "classification": decision.classification == kind,
            "action": decision.action == expected_action[kind],
            "human_gate": decision.approval_required == (kind != "MATCH"),
            "evidence_present": len(decision.evidence) > 0,
        }
        if not all(checks.values()):
            failures.append({"case": index, "kind": kind, "checks": checks, "decision": decision.model_dump(mode="json")})
    return {"cases": 140, "passed": 140 - len(failures), "failures": failures}


def make_growth_snapshot(index: int, pattern: str) -> MerchantSnapshot:
    base = [
        SkuMetric(sku=f"{index}-HERO", price_band="high", gmv=50000, orders=700, views=12000, rating=4.8, margin_rate_assumption=0.38, stock_units=600),
        SkuMetric(sku=f"{index}-BASE", price_band="mid", gmv=18000, orders=350, views=11000, rating=4.0, margin_rate_assumption=0.25, stock_units=700),
        SkuMetric(sku=f"{index}-TAIL", price_band="low", gmv=8000, orders=180, views=9000, rating=4.0, margin_rate_assumption=0.12, stock_units=400),
    ]
    expected_top = "SCALE"
    if pattern == "QUALITY":
        base[0] = base[0].model_copy(update={"rating": 2.8})
        expected_top = "IMPROVE"
    elif pattern == "PRICE":
        base[0] = base[0].model_copy(update={"gmv": 9000, "orders": 90, "views": 8000, "rating": 4.4, "margin_rate_assumption": 0.48})
        base[1] = base[1].model_copy(update={"gmv": 60000})
        expected_top = "TEST_PRICE_UP"
    elif pattern == "CASH":
        base[2] = base[2].model_copy(update={"gmv": 120, "orders": 2, "views": 900, "stock_units": 500})
        expected_top = "DELIST_REVIEW"
    snapshot = MerchantSnapshot(merchant_id=f"EVAL-M-{index:03d}", period="synthetic eval", skus=base)
    snapshot.__dict__["_expected_top"] = expected_top
    return snapshot


def growth_eval() -> dict:
    patterns = ["SCALE", "QUALITY", "PRICE", "CASH"]
    failures = []
    for index in range(60):
        pattern = patterns[index % len(patterns)]
        snapshot = make_growth_snapshot(index, pattern)
        expected_top = snapshot.__dict__.pop("_expected_top")
        decision = diagnose_merchant(snapshot, NoModelProvider())
        top = decision.recommendations[0]
        checks = {
            "top_action": top.action == expected_top,
            "evidence_links": bool(top.evidence_ids),
            "price_guardrail": all(r.approval_required for r in decision.recommendations if r.action in {"TEST_PRICE_UP", "DELIST_REVIEW", "SCALE"}),
            "assumption_disclosure": any("elasticity" in item for item in decision.assumptions),
        }
        if not all(checks.values()):
            failures.append({"case": index, "pattern": pattern, "checks": checks, "top": top.model_dump(mode="json")})
    return {"cases": 60, "passed": 60 - len(failures), "failures": failures}


def main() -> None:
    report = {
        "eval_version": "0.1.0",
        "seed": 20260710,
        "settlement": settlement_eval(),
        "growth": growth_eval(),
    }
    report["total_cases"] = report["settlement"]["cases"] + report["growth"]["cases"]
    report["total_passed"] = report["settlement"]["passed"] + report["growth"]["passed"]
    report["pass_rate"] = round(report["total_passed"] / report["total_cases"], 4)
    output = ROOT / "artifacts" / "eval_report.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    raise SystemExit(0 if report["total_passed"] == report["total_cases"] else 1)


if __name__ == "__main__":
    main()
