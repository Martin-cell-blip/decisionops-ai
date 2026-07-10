from __future__ import annotations

import json
from pathlib import Path

from .schemas import MerchantSnapshot, SettlementCase

ROOT = Path(__file__).resolve().parents[2]
DEMO = ROOT / "data" / "demo"


def _load(name: str) -> list[dict]:
    return json.loads((DEMO / name).read_text(encoding="utf-8"))


def settlement_cases() -> dict[str, SettlementCase]:
    cases = [SettlementCase.model_validate(item) for item in _load("settlement_cases.json")]
    return {item.case_id: item for item in cases}


def merchant_snapshots() -> dict[str, MerchantSnapshot]:
    snapshots = [MerchantSnapshot.model_validate(item) for item in _load("merchant_snapshots.json")]
    return {item.merchant_id: item for item in snapshots}

