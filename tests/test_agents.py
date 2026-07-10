from decisionops.data import merchant_snapshots, settlement_cases
from decisionops.growth_agent import diagnose_merchant
from decisionops.providers import NoModelProvider
from decisionops.settlement_agent import review_settlement_case


class FakeProvider:
    name = "fake"

    def __init__(self, text):
        self.text = text

    def generate(self, *, system, user):
        return self.text


def test_demo_settlement_classifications_and_actions():
    expected = {
        "S001_MATCH": ("MATCH", "PAY"),
        "S002_DUPLICATE": ("DUPLICATE", "REJECT"),
        "S003_GHOST": ("MISSING_ORDER", "REJECT"),
        "S004_NOT_DELIVERED": ("NOT_DELIVERED", "REJECT"),
        "S005_OVERBILLED": ("OVERBILLED", "RECOVER"),
        "S006_NOT_BILLED": ("NOT_BILLED", "REQUEST_INVOICE"),
        "S007_MIXED": ("MIXED_EXCEPTION", "REJECT"),
    }
    for case_id, pair in expected.items():
        decision = review_settlement_case(settlement_cases()[case_id], NoModelProvider())
        assert (decision.classification, decision.action) == pair
        assert decision.evidence
        assert decision.approval_required is (decision.action != "PAY")


def test_growth_agent_has_evidence_and_human_gates():
    decision = diagnose_merchant(merchant_snapshots()["M001_HOMEWARE"], NoModelProvider())
    assert decision.recommendations
    assert decision.evidence
    assert decision.recommendations[0].action in {"SCALE", "IMPROVE", "DELIST_REVIEW", "TEST_PRICE_UP"}
    gated = {"SCALE", "TEST_PRICE_UP", "DELIST_REVIEW"}
    assert all(item.approval_required for item in decision.recommendations if item.action in gated)
    assert any("elasticity" in item for item in decision.assumptions)


def test_invalid_citation_format_falls_back_to_template():
    case = settlement_cases()["S005_OVERBILLED"]
    invalid = review_settlement_case(case, FakeProvider("Use E1 and recover now."))
    assert invalid.model_provider == "fake"
    assert "deterministic checks" in invalid.rationale
    assert invalid.trace[3].result == "Used verified deterministic template"


def test_valid_cited_narration_is_accepted():
    case = settlement_cases()["S005_OVERBILLED"]
    valid_text = "Recover the overcharge based on the variance [E1]; human approval is required."
    valid = review_settlement_case(case, FakeProvider(valid_text))
    assert valid.rationale == valid_text
    assert valid.trace[3].result == "Narrated by fake"
