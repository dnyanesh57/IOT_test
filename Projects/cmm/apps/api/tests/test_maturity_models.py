from __future__ import annotations

import math
from datetime import datetime, timedelta

from app.domain.maturity_models import equivalent_age, predict_strength, ttf_maturity


def _synthetic_samples() -> list[tuple[datetime, float]]:
    base = datetime(2025, 1, 1, 0, 0)
    temps: list[float] = []
    for hour in range(25):
        if hour < 12:
            temps.append(22.0 + hour * 0.8)
        else:
            temps.append(31.6 - (hour - 12) * 0.4)
    return [(base + timedelta(hours=h), temps[h]) for h in range(len(temps))]


def test_ttf_maturity_matches_manual_sum() -> None:
    samples = _synthetic_samples()
    T0 = -10.0
    expected = 0.0
    for i in range(len(samples) - 1):
        expected += (samples[i][1] - T0) * 1.0  # Δt = 1 hour
    result = ttf_maturity(samples, T0)
    assert math.isclose(result, expected, rel_tol=1e-9)


def test_equivalent_age_matches_reference() -> None:
    samples = _synthetic_samples()
    Ea = 33500.0
    Tr_c = 20.0
    R = 8.314
    Tr_k = Tr_c + 273.15

    manual = 0.0
    for i in range(len(samples) - 1):
        T_c = samples[i][1]
        T_k = T_c + 273.15
        exponent = -Ea / R * ((1.0 / T_k) - (1.0 / Tr_k))
        manual += 1.0 * math.exp(exponent)
    result = equivalent_age(samples, Ea, Tr_c, R)
    assert math.isclose(result, manual, rel_tol=1e-6)


def test_predict_strength_models() -> None:
    log_mean, log_ci = predict_strength(
        maturity_value=0.5,
        curve_type="log",
        curve_params={"a": 6.0, "b": -10.0, "min_maturity": 1.0, "sigma": 1.0},
    )
    assert math.isclose(log_mean, -10.0, rel_tol=1e-9)
    assert log_ci is not None
    assert math.isclose(log_ci[0], -11.96, rel_tol=1e-6)
    assert math.isclose(log_ci[1], -8.04, rel_tol=1e-6)

    asym_mean, asym_ci = predict_strength(
        maturity_value=120.0,
        curve_type="asymptotic",
        curve_params={"f_u": 40.0, "k": 0.15},
    )
    assert asym_ci is None
    assert asym_mean > 35.0
    assert asym_mean < 40.0
