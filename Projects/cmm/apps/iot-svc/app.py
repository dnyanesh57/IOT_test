import os
from fastapi import FastAPI

app = FastAPI(title="CMM IoT Service")


@app.get("/healthz")
def healthz():
    return {"ok": True, "broker": os.getenv("MQTT_BROKER", "emqx")}

