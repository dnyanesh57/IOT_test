from __future__ import annotations

import datetime as dt

from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDPrimaryKeyMixin, default_json


class Tenant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    data_residency: Mapped[str] = mapped_column(String(32), default="default", nullable=False)

    projects: Mapped[list["Project"]] = relationship(back_populates="tenant")
    users: Mapped[list["User"]] = relationship(back_populates="tenant")


class LicensePlan(str, Enum):
    starter = "starter"
    pro = "pro"
    enterprise = "enterprise"


class License(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "licenses"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    plan: Mapped[str] = mapped_column(String(32), nullable=False, default=LicensePlan.starter.value)
    expires_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    seat_limit: Mapped[int | None] = mapped_column(Integer)

    tenant: Mapped["Tenant"] = relationship(backref="licenses")


class FeatureFlag(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "feature_flags"
    __table_args__ = (UniqueConstraint("tenant_id", "key", name="uq_feature_flags_tenant_key"),)

    tenant_id: Mapped[str | None] = mapped_column(ForeignKey("tenants.id"))
    key: Mapped[str] = mapped_column(String(128), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    tenant: Mapped["Tenant"] | None = relationship()


class Role(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("tenant_id", "name", name="uq_roles_tenant_name"),)

    tenant_id: Mapped[str | None] = mapped_column(ForeignKey("tenants.id"))
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    users: Mapped[list["UserRole"]] = relationship(back_populates="role")


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),)

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    hashed_password: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    tenant: Mapped["Tenant"] = relationship(back_populates="users")
    roles: Mapped[list["UserRole"]] = relationship(back_populates="user")


class UserRole(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_role"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"), nullable=False)

    user: Mapped["User"] = relationship(back_populates="roles")
    role: Mapped["Role"] = relationship(back_populates="users")


class Project(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "projects"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)

    tenant: Mapped["Tenant"] = relationship(back_populates="projects")
    locations: Mapped[list["Location"]] = relationship(back_populates="project")


class Location(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "locations"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    element_type: Mapped[str | None] = mapped_column(String(64))

    project: Mapped["Project"] = relationship(back_populates="locations")
    devices: Mapped[list["Device"]] = relationship(back_populates="location")


class Device(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "devices"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id"))
    location_id: Mapped[str | None] = mapped_column(ForeignKey("locations.id"))
    serial_number: Mapped[str | None] = mapped_column(String(128), unique=True)
    hardware_revision: Mapped[str | None] = mapped_column(String(64))
    firmware_version: Mapped[str | None] = mapped_column(String(64))
    claimed_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    claimed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(32), default="unclaimed", nullable=False)
    config: Mapped[dict] = mapped_column(JSON, default=default_json)

    location: Mapped["Location"] | None = relationship(back_populates="devices")
    sensors: Mapped[list["Sensor"]] = relationship(back_populates="device")


class Sensor(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "sensors"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    device_id: Mapped[str] = mapped_column(ForeignKey("devices.id"), nullable=False)
    channel: Mapped[str | None] = mapped_column(String(32))
    sensor_type: Mapped[str] = mapped_column(String(64), default="temperature")
    calibration_id: Mapped[str | None] = mapped_column(ForeignKey("calibrations.id"))
    metadata: Mapped[dict] = mapped_column(JSON, default=default_json)

    device: Mapped["Device"] = relationship(back_populates="sensors")


class Mix(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "mixes"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cement_type: Mapped[str | None] = mapped_column(String(128))
    activation_energy: Mapped[float | None] = mapped_column(Numeric(10, 4))
    maturity_curve: Mapped[dict] = mapped_column(JSON, default=default_json)


class Calibration(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "calibrations"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    mix_id: Mapped[str | None] = mapped_column(ForeignKey("mixes.id"))
    method: Mapped[str] = mapped_column(String(32), default="nurse_saul", nullable=False)
    r_squared: Mapped[float | None] = mapped_column(Numeric(5, 4))
    parameters: Mapped[dict] = mapped_column(JSON, default=default_json)


class CalibrationRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "calibration_runs"

    calibration_id: Mapped[str] = mapped_column(ForeignKey("calibrations.id"), nullable=False)
    started_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    summary: Mapped[dict] = mapped_column(JSON, default=default_json)


class Certificate(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "certificates"

    calibration_id: Mapped[str] = mapped_column(ForeignKey("calibrations.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    pdf_path: Mapped[str] = mapped_column(String(512), nullable=False)
    json_path: Mapped[str] = mapped_column(String(512), nullable=False)
    signer: Mapped[str] = mapped_column(String(128), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Pour(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "pours"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    location_id: Mapped[str | None] = mapped_column(ForeignKey("locations.id"))
    mix_id: Mapped[str | None] = mapped_column(ForeignKey("mixes.id"))
    started_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="in_progress", nullable=False)
    target_strength: Mapped[float | None] = mapped_column(Numeric(8, 2))


class Alert(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "alerts"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id"))
    pour_id: Mapped[str | None] = mapped_column(ForeignKey("pours.id"))
    sensor_id: Mapped[str | None] = mapped_column(ForeignKey("sensors.id"))
    severity: Mapped[str] = mapped_column(String(16), default="warning", nullable=False)
    trigger: Mapped[str] = mapped_column(String(64), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    acknowledged_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class Report(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reports"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    pour_id: Mapped[str | None] = mapped_column(ForeignKey("pours.id"))
    template: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    metadata: Mapped[dict] = mapped_column(JSON, default=default_json)


class Webhook(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "webhooks"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    secret: Mapped[str | None] = mapped_column(String(256))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class OtaRelease(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ota_releases"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    version: Mapped[str] = mapped_column(String(64), nullable=False)
    channel: Mapped[str] = mapped_column(String(32), default="stable", nullable=False)
    firmware_path: Mapped[str] = mapped_column(String(512), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    promoted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class AuditEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "audit_events"

    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(128), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    data: Mapped[dict] = mapped_column(JSON, default=default_json)
    previous_hash: Mapped[str | None] = mapped_column(String(128))
    hash: Mapped[str] = mapped_column(String(128), nullable=False)


readings_ts = Table(
    "readings_ts",
    Base.metadata,
    Column("sensor_id", String(36), ForeignKey("sensors.id"), primary_key=True, nullable=False),
    Column("ts", DateTime(timezone=True), primary_key=True, nullable=False),
    Column("celsius", Numeric(6, 3), nullable=False),
    Column("tenant_id", String(36), ForeignKey("tenants.id"), nullable=False),
    Index("ix_readings_ts_sensor_ts", "sensor_id", "ts"),
    Index("ix_readings_ts_ts", "ts"),
)
