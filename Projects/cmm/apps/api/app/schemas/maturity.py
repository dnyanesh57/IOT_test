from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

CurveType = Literal["log", "asymptotic"]


class CurveParams(BaseModel):
    a: Optional[float] = None
    b: Optional[float] = None
    f_u: Optional[float] = None
    k: Optional[float] = None
    sigma: Optional[float] = None
    min_maturity: float = 1.0


class MaturityRequest(BaseModel):
    curve_type: Optional[CurveType] = None
    curve_params: Optional[CurveParams] = None
    T0_c: Optional[float] = None
    Ea: Optional[float] = None
    Tr_c: Optional[float] = None


class StrengthCI(BaseModel):
    mean: float
    lower: Optional[float] = None
    upper: Optional[float] = None
    units: str = "MPa"


class MaturityResponse(BaseModel):
    pour_id: str
    ttf_c_h: float = Field(description="TTF maturity, °C·h")
    eq_age_h: float = Field(description="Equivalent age, h")
    strength_ttf: Optional[StrengthCI] = None
    strength_eq: Optional[StrengthCI] = None

