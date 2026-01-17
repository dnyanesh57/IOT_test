from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.domain import Pour, Project, Sensor, readings_ts
from app.schemas import MaturityResponse, PourCreate, PourResponse

router = APIRouter(prefix="/pours", tags=["pours"])


@router.post("", response_model=PourResponse, status_code=status.HTTP_201_CREATED)
def create_pour(payload: PourCreate, db: Session = Depends(get_db)) -> Pour:
    project = db.get(Project, payload.project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    pour = Pour(
        tenant_id=payload.tenant_id,
        project_id=payload.project_id,
        location_id=payload.location_id,
        mix_id=payload.mix_id,
        started_at=payload.started_at,
        target_strength=payload.target_strength,
    )
    db.add(pour)
    db.commit()
    db.refresh(pour)
    return pour


@router.get("/{pour_id}/maturity", response_model=MaturityResponse)
def get_pour_maturity(pour_id: str, db: Session = Depends(get_db)) -> MaturityResponse:
    pour = db.get(Pour, pour_id)
    if pour is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pour not found")

    sensor_ids = db.scalars(select(Sensor.id).where(Sensor.project_id == pour.project_id)).all()
    if not sensor_ids:
        return MaturityResponse(
            pour_id=pour_id,
            sensor_count=0,
            readings_count=0,
            average_celsius=None,
            maturity_index=None,
        )

    stmt = (
        select(
            func.count().label("readings_count"),
            func.avg(readings_ts.c.celsius).label("avg_celsius"),
        )
        .where(readings_ts.c.sensor_id.in_(sensor_ids))
    )
    result = db.execute(stmt).one()
    average_celsius = float(result.avg_celsius) if result.avg_celsius is not None else None
    maturity_index = float(result.avg_celsius) * 1.25 if result.avg_celsius is not None else None

    return MaturityResponse(
        pour_id=pour_id,
        sensor_count=len(sensor_ids),
        readings_count=result.readings_count or 0,
        average_celsius=average_celsius,
        maturity_index=maturity_index,
    )

