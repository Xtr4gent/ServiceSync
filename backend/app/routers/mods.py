from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Mod, Vehicle
from ..schemas.mod import ModCreateBody, ModUpdate, ModOut
from ..deps import get_current_user
from ..models import User

router = APIRouter(prefix="/vehicles", tags=["mods"])


@router.get("/{vehicle_id}/mods", response_model=list[ModOut])
def list_mods(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return db.query(Mod).filter(Mod.vehicle_id == vehicle_id).order_by(Mod.date.desc()).all()


@router.post("/{vehicle_id}/mods", response_model=ModOut, status_code=status.HTTP_201_CREATED)
def create_mod(
    vehicle_id: int,
    data: ModCreateBody,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    m = Mod(vehicle_id=vehicle_id, **data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.get("/{vehicle_id}/mods/{mod_id}", response_model=ModOut)
def get_mod(
    vehicle_id: int,
    mod_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    m = db.query(Mod).filter(Mod.id == mod_id, Mod.vehicle_id == vehicle_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mod not found")
    return m


@router.patch("/{vehicle_id}/mods/{mod_id}", response_model=ModOut)
def update_mod(
    vehicle_id: int,
    mod_id: int,
    data: ModUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    m = db.query(Mod).filter(Mod.id == mod_id, Mod.vehicle_id == vehicle_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mod not found")
    for k, val in data.model_dump(exclude_unset=True).items():
        setattr(m, k, val)
    db.commit()
    db.refresh(m)
    return m


@router.delete("/{vehicle_id}/mods/{mod_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mod(
    vehicle_id: int,
    mod_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    m = db.query(Mod).filter(Mod.id == mod_id, Mod.vehicle_id == vehicle_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mod not found")
    db.delete(m)
    db.commit()
    return None
