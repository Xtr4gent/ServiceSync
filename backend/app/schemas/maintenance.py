from datetime import date as DateType, datetime
from pydantic import BaseModel, ConfigDict


class MaintenanceBase(BaseModel):
    type: str
    date: DateType
    mileage: float | None = None
    cost: float | None = None
    shop_name: str | None = None
    notes: str | None = None
    receipt_path: str | None = None


class MaintenanceCreate(MaintenanceBase):
    vehicle_id: int


class MaintenanceCreateBody(MaintenanceBase):
    """Body for POST; vehicle_id comes from URL."""
    pass


class MaintenanceUpdate(BaseModel):
    type: str | None = None
    date: DateType | None = None
    mileage: float | None = None
    cost: float | None = None
    shop_name: str | None = None
    notes: str | None = None
    receipt_path: str | None = None


class MaintenanceOut(MaintenanceBase):
    id: int
    vehicle_id: int
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
