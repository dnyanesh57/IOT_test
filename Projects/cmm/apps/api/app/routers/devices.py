from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.domain import Device, Project, User
from app.schemas import DeviceClaimRequest, DeviceConfigUpdate, DeviceResponse

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/{device_id}/claim", response_model=DeviceResponse)
def claim_device(device_id: str, payload: DeviceClaimRequest, db: Session = Depends(get_db)) -> Device:
    device = db.get(Device, device_id)
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    project = db.get(Project, payload.project_id) if payload.project_id else None
    if payload.project_id and project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if payload.user_id:
        user = db.execute(select(User).where(User.id == payload.user_id)).scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    device.tenant_id = payload.tenant_id
    device.project_id = payload.project_id
    device.location_id = payload.location_id
    device.claimed_by = payload.user_id
    device.claimed_at = dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc)
    device.status = "active"

    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.patch("/{device_id}/config", response_model=DeviceResponse)
def update_device_config(
    device_id: str,
    payload: DeviceConfigUpdate,
    db: Session = Depends(get_db),
) -> Device:
    device = db.get(Device, device_id)
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    update_data = payload.dict(exclude_unset=True)
    if "config" in update_data and update_data["config"] is not None:
        existing_config = device.config or {}
        existing_config.update(update_data.pop("config") or {})
        device.config = existing_config

    if "name" in update_data and update_data["name"] is not None:
        device.config = {**(device.config or {}), "name": update_data.pop("name")}

    if "firmware_version" in update_data and update_data["firmware_version"] is not None:
        device.firmware_version = update_data.pop("firmware_version")

    if "status" in update_data and update_data["status"] is not None:
        device.status = update_data.pop("status")

    if update_data:
        for key, value in update_data.items():
            setattr(device, key, value)

    db.add(device)
    db.commit()
    db.refresh(device)
    return device

