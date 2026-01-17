from __future__ import annotations

import datetime as dt
import pathlib
import sys
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.base import Base  # noqa: E402
from app.models.domain import Device, Location, Mix, Project, Sensor, Tenant, User  # noqa: E402

TEST_DATABASE_URL = "sqlite+pysqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    future=True,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, expire_on_commit=False, autoflush=False, autocommit=False, future=True)


@pytest.fixture(scope="session", autouse=True)
def setup_database() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _get_test_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _get_test_db
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def seed_data(db_session: Session):
    tenant = Tenant(name="Demo Tenant", slug="demo")
    db_session.add(tenant)
    db_session.flush()

    project = Project(tenant_id=tenant.id, name="Demo Project", code="PRJ1")
    db_session.add(project)
    db_session.flush()

    location = Location(tenant_id=tenant.id, project_id=project.id, name="Zone A")
    db_session.add(location)

    user = User(tenant_id=tenant.id, email="operator@example.com", full_name="Operator One")
    db_session.add(user)

    device = Device(
        tenant_id=tenant.id,
        project_id=project.id,
        location_id=location.id,
        serial_number="DEV-001",
        status="unclaimed",
    )
    db_session.add(device)

    mix = Mix(tenant_id=tenant.id, name="Standard Mix")
    db_session.add(mix)
    db_session.flush()

    sensor = Sensor(
        tenant_id=tenant.id,
        project_id=project.id,
        device_id=device.id,
        channel="1",
        sensor_type="temperature",
    )
    db_session.add(sensor)
    db_session.commit()

    return {
        "tenant": tenant,
        "project": project,
        "location": location,
        "user": user,
        "device": device,
        "sensor": sensor,
        "mix": mix,
        "timestamp": dt.datetime(2025, 1, 1, 12, 0, tzinfo=dt.timezone.utc),
    }
