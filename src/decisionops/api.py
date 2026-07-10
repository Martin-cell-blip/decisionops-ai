from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException, Query

from .data import merchant_snapshots, settlement_cases
from .growth_agent import diagnose_merchant
from .providers import build_provider
from .settlement_agent import review_settlement_case

app = FastAPI(
    title="DecisionOps AI",
    version="0.1.0",
    description="Bounded agents for settlement risk and merchant growth decisions.",
)


@app.get("/health")
def health() -> dict:
    # Key presence only - a silent narration downgrade (e.g. quota errors) should be
    # diagnosable from here without reading agent traces. Secrets never leave the process.
    return {
        "status": "ok",
        "default_provider": os.getenv("LLM_PROVIDER", "none"),
        "providers": {
            "none": True,
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "qianfan": bool(os.getenv("QIANFAN_API_KEY")),
        },
    }


@app.get("/api/demo")
def demo_catalogue() -> dict[str, list[str]]:
    return {
        "settlement_case_ids": list(settlement_cases()),
        "merchant_ids": list(merchant_snapshots()),
    }


@app.get("/api/settlement/{case_id}")
def settlement(case_id: str, provider: str = Query("none", pattern="^(none|openai|qianfan)$")):
    case = settlement_cases().get(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Unknown settlement case")
    return review_settlement_case(case, build_provider(provider))


@app.get("/api/growth/{merchant_id}")
def growth(merchant_id: str, provider: str = Query("none", pattern="^(none|openai|qianfan)$")):
    snapshot = merchant_snapshots().get(merchant_id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Unknown merchant")
    return diagnose_merchant(snapshot, build_provider(provider))

