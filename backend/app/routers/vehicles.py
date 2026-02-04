import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Vehicle
from ..schemas import VehicleCreate, VehicleUpdate, VehicleOut
from ..deps import get_current_user
from ..config import settings
from ..models import User

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.get("", response_model=list[VehicleOut])
def list_vehicles(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Vehicle).order_by(Vehicle.year.desc(), Vehicle.make).all()


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    data: VehicleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    v = Vehicle(**data.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v


@router.patch("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for k, val in data.model_dump(exclude_unset=True).items():
        setattr(v, k, val)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(v)
    db.commit()
    return None


@router.post("/{vehicle_id}/photo", response_model=VehicleOut)
async def upload_vehicle_photo(
    vehicle_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE:
        raise HTTPException(status_code=400, detail="File must be JPEG, PNG, GIF, or WebP")
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    ext = Path(file.filename or "img").suffix or ".jpg"
    name = f"{vehicle_id}_{uuid.uuid4().hex[:8]}{ext}"
    out_dir = settings.upload_dir / "vehicles"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / name
    content = await file.read()
    path.write_bytes(content)
    v.photo_path = f"vehicles/{name}"
    db.commit()
    db.refresh(v)
    return v
