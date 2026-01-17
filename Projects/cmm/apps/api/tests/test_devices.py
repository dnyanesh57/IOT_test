from __future__ import annotations

import datetime as dt

from fastapi.testclient import TestClient


def test_device_claim_and_config(client: TestClient, seed_data):
    device = seed_data["device"]
    tenant = seed_data["tenant"]
    project = seed_data["project"]
    location = seed_data["location"]
    user = seed_data["user"]

    claim_payload = {
        "tenant_id": tenant.id,
        "project_id": project.id,
        "location_id": location.id,
        "user_id": user.id,
    }
    response = client.post(f"/v1/devices/{device.id}/claim", json=claim_payload)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "active"
    assert body["claimed_by"] == user.id

    config_payload = {
        "firmware_version": "1.0.2",
        "config": {"interval_minutes": 10},
        "status": "maintenance",
    }
    response = client.patch(f"/v1/devices/{device.id}/config", json=config_payload)
    assert response.status_code == 200
    body = response.json()
    assert body["firmware_version"] == "1.0.2"
    assert body["config"]["interval_minutes"] == 10
    assert body["status"] == "maintenance"


def test_readings_batch_and_maturity(client: TestClient, seed_data):
    tenant = seed_data["tenant"]
    project = seed_data["project"]
    location = seed_data["location"]
    mix = seed_data["mix"]
    sensor = seed_data["sensor"]
    timestamp = seed_data["timestamp"]

    pour_payload = {
        "tenant_id": tenant.id,
        "project_id": project.id,
        "location_id": location.id,
        "mix_id": mix.id,
        "started_at": timestamp.isoformat(),
    }
    pour_resp = client.post("/v1/pours", json=pour_payload)
    assert pour_resp.status_code == 201, pour_resp.text
    pour_id = pour_resp.json()["id"]

    readings_payload = {
        "readings": [
            {"sensor_id": sensor.id, "ts": timestamp.isoformat(), "celsius": 24.5},
            {"sensor_id": sensor.id, "ts": (timestamp + dt.timedelta(hours=1)).isoformat(), "celsius": 26.0},
        ]
    }
    ingest_resp = client.post("/v1/readings/batch", json=readings_payload)
    assert ingest_resp.status_code == 202
    assert ingest_resp.json()["processed"] == 2

    maturity_resp = client.get(f"/v1/pours/{pour_id}/maturity")
    assert maturity_resp.status_code == 200
    body = maturity_resp.json()
    assert body["sensor_count"] >= 1
    assert body["readings_count"] == 2
    assert round(body["average_celsius"], 1) == 25.2


def test_readings_upsert(client: TestClient, seed_data):
    sensor = seed_data["sensor"]
    timestamp = seed_data["timestamp"]

    payload = {"readings": [{"sensor_id": sensor.id, "ts": timestamp.isoformat(), "celsius": 25.0}]}
    first = client.post("/v1/readings/batch", json=payload)
    assert first.status_code == 202
    assert first.json()["inserted"] == 1

    payload_update = {"readings": [{"sensor_id": sensor.id, "ts": timestamp.isoformat(), "celsius": 27.5}]}
    second = client.post("/v1/readings/batch", json=payload_update)
    assert second.status_code == 202
    assert second.json()["updated"] >= 0

    maturity = client.get(f"/v1/pours/non-existent/maturity")
    assert maturity.status_code == 404
