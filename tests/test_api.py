from fastapi.testclient import TestClient

from decisionops.api import app


client = TestClient(app)


def test_health_and_catalogue():
    assert client.get("/health").json() == {"status": "ok"}
    catalogue = client.get("/api/demo").json()
    assert "S001_MATCH" in catalogue["settlement_case_ids"]
    assert "M001_HOMEWARE" in catalogue["merchant_ids"]


def test_demo_endpoints():
    settlement = client.get("/api/settlement/S005_OVERBILLED").json()
    assert settlement["classification"] == "OVERBILLED"
    assert settlement["approval_required"] is True
    growth = client.get("/api/growth/M001_HOMEWARE").json()
    assert growth["recommendations"]

