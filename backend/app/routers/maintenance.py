import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Maintenance, Vehicle
from ..schemas.maintenance import MaintenanceCreateBody, MaintenanceUpdate, MaintenanceOut
from ..deps import get_current_user
from ..config import settings
from ..models import User

router = APIRouter(prefix="/vehicles", tags=["maintenance"])

ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"}


@router.get("/{vehicle_id}/maintenance", response_model=list[MaintenanceOut])
def list_maintenance(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return db.query(Maintenance).filter(Maintenance.vehicle_id == vehicle_id).order_by(Maintenance.date.desc()).all()


@router.post("/{vehicle_id}/maintenance", response_model=MaintenanceOut, status_code=status.HTTP_201_CREATED)
def create_maintenance(
    vehicle_id: int,
    data: MaintenanceCreateBody,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    m = Maintenance(vehicle_id=vehicle_id, **data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.get("/{vehicle_id}/maintenance/{maintenance_id}", response_model=MaintenanceOut)
def get_maintenance(
    vehicle_id: int,
    maintenance_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    m = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id,
        Maintenance.vehicle_id == vehicle_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    return m


@router.patch("/{vehicle_id}/maintenance/{maintenance_id}", response_model=MaintenanceOut)
def update_maintenance(
    vehicle_id: int,
    maintenance_id: int,
    data: MaintenanceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    m = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id,
        Maintenance.vehicle_id == vehicle_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    for k, val in data.model_dump(exclude_unset=True).items():
        setattr(m, k, val)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{vehicle_id}/maintenance/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance(
    vehicle_id: int,
    maintenance_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    m = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id,
        Maintenance.vehicle_id == vehicle_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    db.delete(m)
    db.commit()
    return None


@router.post("/{vehicle_id}/maintenance/{maintenance_id}/receipt", response_model=MaintenanceOut)
async def upload_maintenance_receipt(
    vehicle_id: int,
    maintenance_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_IMAGE:
        raise HTTPException(status_code=400, detail="File must be JPEG, PNG, GIF, WebP, or PDF")
    m = db.query(Maintenance).filter(
        Maintenance.id == maintenance_id,
        Maintenance.vehicle_id == vehicle_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    ext = Path(file.filename or "doc").suffix or ".jpg"
    name = f"{maintenance_id}_{uuid.uuid4().hex[:8]}{ext}"
    out_dir = settings.upload_dir / "receipts"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / name
    content = await file.read()
    path.write_bytes(content)
    m.receipt_path = f"receipts/{name}"
    db.commit()
    db.refresh(m)
    return m
