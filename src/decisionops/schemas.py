from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Evidence(BaseModel):
    evidence_id: str
    source: str
    fact: str
    value: Any | None = None


class AgentTrace(BaseModel):
    step: int
    operation: str
    result: str


class SettlementLine(BaseModel):
    line_id: str
    order_id: str
    billed_amount: float = Field(ge=0)


class OrderRecord(BaseModel):
    order_id: str
    expected_amount: float = Field(ge=0)
    delivered: bool


class SettlementCase(BaseModel):
    case_id: str
    contract_tolerance_pct: float = Field(default=0.02, ge=0, le=0.25)
    invoice_lines: list[SettlementLine]
    orders: list[OrderRecord]


class SettlementDecision(BaseModel):
    case_id: str
    classification: Literal[
        "MATCH",
        "OVERBILLED",
        "UNDERBILLED",
        "DUPLICATE",
        "MISSING_ORDER",
        "NOT_DELIVERED",
        "NOT_BILLED",
        "MIXED_EXCEPTION",
    ]
    action: Literal[
        "PAY",
        "REJECT",
        "RECOVER",
        "REQUEST_INVOICE",
        "MANUAL_REVIEW",
    ]
    risk_level: RiskLevel
    approval_required: bool
    expected_amount: float
    billed_amount: float
    variance_amount: float
    confidence: float = Field(ge=0, le=1)
    rationale: str
    evidence: list[Evidence]
    trace: list[AgentTrace]
    model_provider: str


class SkuMetric(BaseModel):
    sku: str
    price_band: Literal["low", "mid", "high"]
    gmv: float = Field(ge=0)
    orders: int = Field(ge=0)
    views: int = Field(ge=0)
    rating: float = Field(ge=0, le=5)
    margin_rate_assumption: float = Field(ge=0, le=1)
    stock_units: int = Field(ge=0)


class MerchantSnapshot(BaseModel):
    merchant_id: str
    period: str
    skus: list[SkuMetric]


class GrowthRecommendation(BaseModel):
    sku: str
    action: Literal["SCALE", "PROTECT", "TEST_PRICE_UP", "IMPROVE", "DELIST_REVIEW"]
    priority: int = Field(ge=1)
    expected_direction: Literal["growth", "margin", "quality", "cash_release"]
    experiment: str
    approval_required: bool
    evidence_ids: list[str]


class GrowthDecision(BaseModel):
    merchant_id: str
    diagnosis: str
    recommendations: list[GrowthRecommendation]
    evidence: list[Evidence]
    trace: list[AgentTrace]
    assumptions: list[str]
    model_provider: str

