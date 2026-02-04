from datetime import datetime
from pydantic import BaseModel, ConfigDict


class VehicleBase(BaseModel):
    nickname: str | None = None
    make: str
    model: str
    year: int
    vin: str | None = None
    license_plate: str | None = None
    current_mileage: float | None = None
    photo_path: str | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    nickname: str | None = None
    make: str | None = None
    model: str | None = None
    year: int | None = None
    vin: str | None = None
    license_plate: str | None = None
    current_mileage: float | None = None
    photo_path: str | None = None


class VehicleOut(VehicleBase):
    id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
