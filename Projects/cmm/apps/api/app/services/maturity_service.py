from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import List, Optional

from app.domain.maturity_models import equivalent_age, predict_strength, ttf_maturity
from app.schemas.maturity import (
    CurveParams,
    MaturityRequest,
    MaturityResponse,
    StrengthCI,
)

DEFAULT_T0_C = float(os.getenv("MATURITY_T0_C", "-10.0"))
DEFAULT_EA = float(os.getenv("MATURITY_EA", "33500"))
DEFAULT_TR_C = float(os.getenv("MATURITY_TR_C", "20.0"))


class MaturityService:
    """Compute maturity metrics and optional strength predictions for pours."""

    def get_temperature_series(self, pour_id: str) -> List[tuple[datetime, float]]:
        """
        Produce a deterministic synthetic temperature series for a pour.

        Parameters
        ----------
        pour_id : str
            Identifier of the pour (unused in synthetic data).

        Returns
        -------
        list[(datetime, float)]
            Hourly samples across 24 hours.
        """
        base = datetime(2025, 1, 1, 0, 0)
        series: List[tuple[datetime, float]] = []
        for hour in range(25):
            ts = base + timedelta(hours=hour)
            if hour < 8:
                temp = 22.0 + hour * 1.5  # warming phase
            elif hour < 16:
                temp = 34.0 + (hour - 8) * 0.5  # slightly increasing
            else:
                temp = 38.0 - (hour - 16) * 1.0  # cooling
            series.append((ts, temp))
        return series

    def _strength_ci_from_result(
        self,
        maturity_value: float,
        curve_type: str,
        curve_params: CurveParams,
    ) -> StrengthCI:
        params_dict = curve_params.dict(exclude_none=True)
        mean, ci = predict_strength(maturity_value, curve_type, params_dict)  # type: ignore[arg-type]
        lower = upper = None
        if ci is not None:
            lower, upper = ci
        return StrengthCI(mean=mean, lower=lower, upper=upper)

    def compute(self, pour_id: str, req: MaturityRequest) -> MaturityResponse:
        """
        Compute TTF and Arrhenius maturity along with optional strength predictions.
        """
        samples = self.get_temperature_series(pour_id)
        if len(samples) < 2:
            raise ValueError("Insufficient temperature samples to compute maturity.")

        T0_c = req.T0_c if req.T0_c is not None else DEFAULT_T0_C
        Ea = req.Ea if req.Ea is not None else DEFAULT_EA
        Tr_c = req.Tr_c if req.Tr_c is not None else DEFAULT_TR_C

        ttf_value = ttf_maturity(samples, T0_c)
        eq_age_value = equivalent_age(samples, Ea, Tr_c)

        strength_ttf: Optional[StrengthCI] = None
        strength_eq: Optional[StrengthCI] = None
        if req.curve_type and req.curve_params:
            strength_ttf = self._strength_ci_from_result(ttf_value, req.curve_type, req.curve_params)
            strength_eq = self._strength_ci_from_result(eq_age_value, req.curve_type, req.curve_params)

        return MaturityResponse(
            pour_id=pour_id,
            ttf_c_h=ttf_value,
            eq_age_h=eq_age_value,
            strength_ttf=strength_ttf,
            strength_eq=strength_eq,
        )

