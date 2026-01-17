from __future__ import annotations

import datetime as dt
from typing import List

from pydantic import BaseModel, Field, field_validator


class ReadingPayload(BaseModel):
    sensor_id: str
    ts: dt.datetime
    celsius: float = Field(ge=-200.0, le=300.0)

    @field_validator("ts")
    @classmethod
    def ensure_timezone(cls, value: dt.datetime) -> dt.datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=dt.timezone.utc)
        return value.astimezone(dt.timezone.utc)


class ReadingBatchRequest(BaseModel):
    readings: List[ReadingPayload]

    @field_validator("readings")
    @classmethod
    def ensure_non_empty(cls, readings: List[ReadingPayload]) -> List[ReadingPayload]:
        if not readings:
            raise ValueError("readings must not be empty")
        return readings


class ReadingBatchResponse(BaseModel):
    processed: int
    inserted: int
    updated: int

