from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import health, v1
from app.schemas.maturity import MaturityRequest, MaturityResponse
from app.services.maturity_service import MaturityService

app = FastAPI(title="CMM API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(v1.router, prefix="/v1")

maturity_service = MaturityService()


@app.post(
    "/v1/pours/{pour_id}/maturity_advanced",
    response_model=MaturityResponse,
)
def compute_maturity(pour_id: str, payload: MaturityRequest) -> MaturityResponse:
    return maturity_service.compute(pour_id, payload)
