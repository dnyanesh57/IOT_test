from fastapi import APIRouter

from . import devices, pours, readings

router = APIRouter()
router.include_router(devices.router)
router.include_router(pours.router)
router.include_router(readings.router)

