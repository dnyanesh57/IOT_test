"""Initial schema with core tables and readings hypertable."""

from __future__ import annotations

from alembic import context, op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20251101_000001"
down_revision = None
branch_labels = None
depends_on = None

timestamp_kwargs = {
    "nullable": False,
    "server_default": sa.text("CURRENT_TIMESTAMP"),
}


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("name", sa.String(length=255), nullable=False, unique=True),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True),
        sa.Column("data_residency", sa.String(length=32), nullable=False, server_default="default"),
    )

    op.create_table(
        "licenses",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("plan", sa.String(length=32), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("seat_limit", sa.Integer()),
    )

    op.create_table(
        "feature_flags",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id")),
        sa.Column("key", sa.String(length=128), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("description", sa.Text()),
        sa.UniqueConstraint("tenant_id", "key", name="uq_feature_flags_tenant_key"),
    )

    op.create_table(
        "roles",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id")),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text()),
        sa.UniqueConstraint("tenant_id", "name", name="uq_roles_tenant_name"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255)),
        sa.Column("hashed_password", sa.String(length=255)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
    )

    op.create_table(
        "user_roles",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role_id", sa.String(length=36), sa.ForeignKey("roles.id"), nullable=False),
        sa.UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_role"),
    )

    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=64)),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
    )

    op.create_table(
        "locations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("element_type", sa.String(length=64)),
    )

    op.create_table(
        "mixes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("cement_type", sa.String(length=128)),
        sa.Column("activation_energy", sa.Numeric(10, 4)),
        sa.Column("maturity_curve", sa.JSON(), server_default=sa.text("'{}'::json")),
    )

    op.create_table(
        "calibrations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("mix_id", sa.String(length=36), sa.ForeignKey("mixes.id")),
        sa.Column("method", sa.String(length=32), nullable=False, server_default="nurse_saul"),
        sa.Column("r_squared", sa.Numeric(5, 4)),
        sa.Column("parameters", sa.JSON(), server_default=sa.text("'{}'::json")),
    )

    op.create_table(
        "calibration_runs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("calibration_id", sa.String(length=36), sa.ForeignKey("calibrations.id"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("summary", sa.JSON(), server_default=sa.text("'{}'::json")),
    )

    op.create_table(
        "certificates",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("calibration_id", sa.String(length=36), sa.ForeignKey("calibrations.id"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("pdf_path", sa.String(length=512), nullable=False),
        sa.Column("json_path", sa.String(length=512), nullable=False),
        sa.Column("signer", sa.String(length=128), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
    )

    op.create_table(
        "devices",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id")),
        sa.Column("location_id", sa.String(length=36), sa.ForeignKey("locations.id")),
        sa.Column("serial_number", sa.String(length=128), unique=True),
        sa.Column("hardware_revision", sa.String(length=64)),
        sa.Column("firmware_version", sa.String(length=64)),
        sa.Column("claimed_by", sa.String(length=36), sa.ForeignKey("users.id")),
        sa.Column("claimed_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="unclaimed"),
        sa.Column("config", sa.JSON(), server_default=sa.text("'{}'::json")),
    )

    op.create_table(
        "sensors",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("device_id", sa.String(length=36), sa.ForeignKey("devices.id"), nullable=False),
        sa.Column("channel", sa.String(length=32)),
        sa.Column("sensor_type", sa.String(length=64), nullable=False, server_default="temperature"),
        sa.Column("calibration_id", sa.String(length=36), sa.ForeignKey("calibrations.id")),
        sa.Column("metadata", sa.JSON(), server_default=sa.text("'{}'::json")),
    )

    op.create_table(
        "pours",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("location_id", sa.String(length=36), sa.ForeignKey("locations.id")),
        sa.Column("mix_id", sa.String(length=36), sa.ForeignKey("mixes.id")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="in_progress"),
        sa.Column("target_strength", sa.Numeric(8, 2)),
    )

    op.create_table(
        "alerts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id")),
        sa.Column("pour_id", sa.String(length=36), sa.ForeignKey("pours.id")),
        sa.Column("sensor_id", sa.String(length=36), sa.ForeignKey("sensors.id")),
        sa.Column("severity", sa.String(length=16), nullable=False, server_default="warning"),
        sa.Column("trigger", sa.String(length=64), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("pour_id", sa.String(length=36), sa.ForeignKey("pours.id")),
        sa.Column("template", sa.String(length=64), nullable=False),
        sa.Column("storage_path", sa.String(length=512), nullable=False),
        sa.Column("metadata", sa.JSON(), server_default=sa.text("'{}'::json")),
    )

    op.create_table(
        "webhooks",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("url", sa.String(length=512), nullable=False),
        sa.Column("secret", sa.String(length=256)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
    )

    op.create_table(
        "ota_releases",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False, server_default="stable"),
        sa.Column("firmware_path", sa.String(length=512), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("promoted_at", sa.DateTime(timezone=True)),
    )

    op.create_table(
        "audit_events",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("updated_at", sa.DateTime(timezone=True), **timestamp_kwargs),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("actor_id", sa.String(length=36), sa.ForeignKey("users.id")),
        sa.Column("action", sa.String(length=128), nullable=False),
        sa.Column("entity_type", sa.String(length=128), nullable=False),
        sa.Column("entity_id", sa.String(length=64), nullable=False),
        sa.Column("data", sa.JSON(), server_default=sa.text("'{}'::json")),
        sa.Column("previous_hash", sa.String(length=128)),
        sa.Column("hash", sa.String(length=128), nullable=False),
    )

    op.create_table(
        "readings_ts",
        sa.Column("sensor_id", sa.String(length=36), sa.ForeignKey("sensors.id"), primary_key=True),
        sa.Column("ts", sa.DateTime(timezone=True), primary_key=True),
        sa.Column("celsius", sa.Numeric(6, 3), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), sa.ForeignKey("tenants.id"), nullable=False),
    )
    op.create_index("ix_readings_ts_sensor_ts", "readings_ts", ["sensor_id", "ts"])
    op.create_index("ix_readings_ts_ts", "readings_ts", ["ts"])

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        try:
            op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")
            op.execute("SELECT create_hypertable('readings_ts', 'ts', if_not_exists => TRUE)")
        except Exception as exc:  # pragma: no cover - warning only
            context.get_context().log.warn(f"Timescale hypertable creation skipped: {exc}")


def downgrade() -> None:
    op.drop_index("ix_readings_ts_ts", table_name="readings_ts")
    op.drop_index("ix_readings_ts_sensor_ts", table_name="readings_ts")
    op.drop_table("readings_ts")
    op.drop_table("audit_events")
    op.drop_table("ota_releases")
    op.drop_table("webhooks")
    op.drop_table("reports")
    op.drop_table("alerts")
    op.drop_table("pours")
    op.drop_table("sensors")
    op.drop_table("devices")
    op.drop_table("certificates")
    op.drop_table("calibration_runs")
    op.drop_table("calibrations")
    op.drop_table("mixes")
    op.drop_table("locations")
    op.drop_table("projects")
    op.drop_table("user_roles")
    op.drop_table("users")
    op.drop_table("roles")
    op.drop_table("feature_flags")
    op.drop_table("licenses")
    op.drop_table("tenants")
