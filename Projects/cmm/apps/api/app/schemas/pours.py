from __future__ import annotations

import datetime as dt

from pydantic import BaseModel, Field


class PourCreate(BaseModel):
    tenant_id: str
    project_id: str
    location_id: str | None = None
    mix_id: str | None = None
    started_at: dt.datetime = Field(default_factory=lambda: dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc))
    target_strength: float | None = None


class PourResponse(BaseModel):
    id: str
    tenant_id: str
    project_id: str
    location_id: str | None
    mix_id: str | None
    started_at: dt.datetime
    status: str
    target_strength: float | None

    class Config:
        from_attributes = True


class MaturityResponse(BaseModel):
    pour_id: str
    sensor_count: int
    readings_count: int
    average_celsius: float | None
    maturity_index: float | None

