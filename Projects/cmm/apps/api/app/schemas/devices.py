from __future__ import annotations

import datetime as dt
from typing import Any

from pydantic import BaseModel, Field


class DeviceClaimRequest(BaseModel):
    tenant_id: str
    project_id: str | None = None
    location_id: str | None = None
    user_id: str


class DeviceConfigUpdate(BaseModel):
    name: str | None = None
    firmware_version: str | None = None
    config: dict[str, Any] | None = None
    status: str | None = Field(default=None, pattern="^(unclaimed|active|maintenance|retired)$")


class DeviceResponse(BaseModel):
    id: str
    tenant_id: str
    project_id: str | None
    location_id: str | None
    claimed_by: str | None
    claimed_at: dt.datetime | None
    status: str
    firmware_version: str | None
    config: dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True
