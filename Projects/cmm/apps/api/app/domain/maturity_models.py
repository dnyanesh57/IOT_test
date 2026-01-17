from __future__ import annotations

import math
from datetime import datetime
from typing import Iterable, Optional, Sequence, Tuple


Sample = Tuple[datetime, float]


def _sorted_samples(samples: Sequence[Sample]) -> list[Sample]:
    sorted_samples = sorted(samples, key=lambda item: item[0])
    return sorted_samples


def _hour_delta(start: datetime, end: datetime) -> float:
    return (end - start).total_seconds() / 3600.0


def ttf_maturity(samples_c: Sequence[Sample], T0_c: float) -> float:
    """
    Compute Nurse-Saul (TTF) maturity in °C·h.

    Parameters
    ----------
    samples_c : sequence of (timestamp, temp_c)
        Temperature history in degrees Celsius ordered by time.
    T0_c : float
        Datum temperature in degrees Celsius.

    Returns
    -------
    float
        Accumulated TTF maturity in °C·h.
    """
    ordered = _sorted_samples(samples_c)
    if len(ordered) < 2:
        return 0.0

    maturity = 0.0
    for (t_i, temp_c), (t_j, _) in zip(ordered, ordered[1:]):
        delta_hours = _hour_delta(t_i, t_j)
        if delta_hours <= 0:
            continue
        maturity += (temp_c - T0_c) * delta_hours
    return maturity


def equivalent_age(
    samples_c: Sequence[Sample],
    Ea: float,
    Tr_c: float,
    R: float = 8.314,
) -> float:
    """
    Compute equivalent age using the Arrhenius maturity model.

    Parameters
    ----------
    samples_c : sequence of (timestamp, temp_c)
        Temperature history in degrees Celsius ordered by time.
    Ea : float
        Activation energy (J/mol).
    Tr_c : float
        Reference temperature in degrees Celsius.
    R : float, optional
        Gas constant (J/mol·K), by default 8.314.

    Returns
    -------
    float
        Equivalent age in hours.
    """
    ordered = _sorted_samples(samples_c)
    if len(ordered) < 2:
        return 0.0

    Tr_k = Tr_c + 273.15
    eq_age = 0.0
    for (t_i, temp_c), (t_j, _) in zip(ordered, ordered[1:]):
        delta_hours = _hour_delta(t_i, t_j)
        if delta_hours <= 0:
            continue
        T_k = temp_c + 273.15
        exponent = -Ea / R * ((1.0 / T_k) - (1.0 / Tr_k))
        eq_age += delta_hours * math.exp(exponent)
    return eq_age


def predict_strength(
    maturity_value: float,
    curve_type: str,
    curve_params: dict[str, float | None],
) -> Tuple[float, Optional[Tuple[float, float]]]:
    """
    Compute predicted compressive strength with optional 95% confidence interval.

    Parameters
    ----------
    maturity_value : float
        Maturity metric (TTF or equivalent age).
    curve_type : str
        Either ``\"log\"`` or ``\"asymptotic\"``.
    curve_params : dict
        Parameters for the selected curve.

    Returns
    -------
    tuple
        (mean_strength, (lower, upper) | None)
    """
    sigma = curve_params.get("sigma")
    if curve_type == "log":
        a = curve_params.get("a")
        b = curve_params.get("b")
        if a is None or b is None:
            raise ValueError("Log model requires 'a' and 'b' parameters.")
        min_maturity = max(curve_params.get("min_maturity", 1.0), 1e-9)
        maturity = max(maturity_value, min_maturity)
        mean = a * math.log(maturity) + b
    elif curve_type == "asymptotic":
        f_u = curve_params.get("f_u")
        k = curve_params.get("k")
        if f_u is None or k is None:
            raise ValueError("Asymptotic model requires 'f_u' and 'k' parameters.")
        mean = f_u * (1.0 - math.exp(-k * maturity_value))
    else:
        raise ValueError(f"Unsupported curve_type '{curve_type}'.")

    ci: Optional[Tuple[float, float]] = None
    if sigma is not None:
        delta = 1.96 * sigma
        ci = (mean - delta, mean + delta)
    return mean, ci

