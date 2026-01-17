from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.domain import Sensor, readings_ts
from app.schemas import ReadingBatchRequest, ReadingBatchResponse

router = APIRouter(prefix="/readings", tags=["readings"])


def _upsert_readings(session: Session, records: list[dict]) -> tuple[int, int]:
    inserted = 0
    updated = 0
    table = readings_ts
    dialect_name = session.bind.dialect.name

    if dialect_name == "postgresql":
        stmt = pg_insert(table).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=[table.c.sensor_id, table.c.ts],
            set_={"celsius": stmt.excluded.celsius, "tenant_id": stmt.excluded.tenant_id},
        )
        result = session.execute(stmt)
        inserted = result.rowcount or 0
        session.flush()
    else:
        for record in records:
            existing = session.execute(
                select(table.c.sensor_id).where(
                    table.c.sensor_id == record["sensor_id"],
                    table.c.ts == record["ts"],
                )
            ).first()
            if existing:
                session.execute(
                    update(table)
                    .where(table.c.sensor_id == record["sensor_id"], table.c.ts == record["ts"])
                    .values(celsius=record["celsius"], tenant_id=record["tenant_id"])
                )
                updated += 1
            else:
                session.execute(table.insert().values(**record))
                inserted += 1
    return inserted, updated


@router.post("/batch", response_model=ReadingBatchResponse, status_code=status.HTTP_202_ACCEPTED)
def ingest_readings(payload: ReadingBatchRequest, db: Session = Depends(get_db)) -> ReadingBatchResponse:
    sensor_ids = {reading.sensor_id for reading in payload.readings}
    sensors = db.execute(select(Sensor.id, Sensor.tenant_id).where(Sensor.id.in_(sensor_ids))).all()
    sensors_map = {row.id: row.tenant_id for row in sensors}

    missing = sensor_ids - sensors_map.keys()
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown sensors: {', '.join(sorted(missing))}",
        )

    records = [
        {
            "sensor_id": reading.sensor_id,
            "ts": reading.ts,
            "celsius": reading.celsius,
            "tenant_id": sensors_map[reading.sensor_id],
        }
        for reading in payload.readings
    ]

    inserted, updated = _upsert_readings(db, records)
    db.commit()
    return ReadingBatchResponse(processed=len(records), inserted=inserted, updated=updated)

