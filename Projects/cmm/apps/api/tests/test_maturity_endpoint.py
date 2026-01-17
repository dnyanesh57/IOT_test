from __future__ import annotations

from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import maturity_service


def _series() -> list[tuple[datetime, float]]:
    base = datetime(2025, 2, 1, 0, 0)
    temps = []
    for hour in range(25):
        if hour < 6:
            temps.append(20.0 + hour * 2.0)
        elif hour < 18:
            temps.append(32.0 + (hour - 6) * 0.7)
        else:
            temps.append(40.4 - (hour - 18) * 1.2)
    return [(base + timedelta(hours=h), temps[h]) for h in range(len(temps))]


def test_maturity_endpoint_basic(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(maturity_service, "get_temperature_series", lambda _: _series())

    response = client.post("/v1/pours/XYZ/maturity_advanced", json={})
    assert response.status_code == 200
    data = response.json()
    assert data["strength_ttf"] is None
    assert data["strength_eq"] is None
    base_ttf = data["ttf_c_h"]
    base_eq = data["eq_age_h"]
    assert base_ttf > 0
    assert base_eq > 0


def test_maturity_endpoint_with_curve(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(maturity_service, "get_temperature_series", lambda _: _series())

    payload = {
        "curve_type": "log",
        "curve_params": {"a": 4.2, "b": -6.0, "sigma": 0.8, "min_maturity": 1.0},
    }
    response = client.post("/v1/pours/XYZ/maturity_advanced", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["strength_ttf"] is not None
    assert data["strength_eq"] is not None
    assert data["strength_ttf"]["lower"] < data["strength_ttf"]["upper"]


def test_maturity_endpoint_overrides(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(maturity_service, "get_temperature_series", lambda _: _series())

    default_resp = client.post("/v1/pours/XYZ/maturity_advanced", json={})
    default = default_resp.json()

    overrides = {
        "T0_c": 0.0,
        "Ea": 40000.0,
        "Tr_c": 25.0,
    }
    override_resp = client.post("/v1/pours/XYZ/maturity_advanced", json=overrides)
    override = override_resp.json()

    assert override["ttf_c_h"] < default["ttf_c_h"]
    assert override["eq_age_h"] < default["eq_age_h"]
