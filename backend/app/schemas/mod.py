from datetime import date as DateType, datetime
from pydantic import BaseModel, ConfigDict


class ModBase(BaseModel):
    name: str
    description: str | None = None
    date: DateType
    cost: float | None = None
    parts_list: str | None = None


class ModCreate(ModBase):
    vehicle_id: int


class ModCreateBody(ModBase):
    """Body for POST; vehicle_id comes from URL."""
    pass


class ModUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    date: DateType | None = None
    cost: float | None = None
    parts_list: str | None = None


class ModOut(ModBase):
    id: int
    vehicle_id: int
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
