from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Vehicle, Maintenance, Mod
from ..deps import get_current_user
from ..models import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(
    year: int | None = Query(None, description="Year for YTD stats (default: current year)"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    y = year or date.today().year
    start = date(y, 1, 1)
    end = date(y, 12, 31)

    # Maintenance totals for the year (all vehicles)
    maint_totals = (
        db.query(
            func.coalesce(func.sum(Maintenance.cost), 0).label("total_cost"),
            func.count(Maintenance.id).label("total_services"),
        )
        .filter(Maintenance.date >= start, Maintenance.date <= end)
    ).first()
    maint_total_cost = float(maint_totals.total_cost or 0)
    maint_total_services = maint_totals.total_services or 0
    maint_avg_cost = maint_total_cost / maint_total_services if maint_total_services else 0

    # Mods totals for the year (all vehicles)
    mods_totals = (
        db.query(
            func.coalesce(func.sum(Mod.cost), 0).label("total_cost"),
            func.count(Mod.id).label("total_count"),
        )
        .filter(Mod.date >= start, Mod.date <= end)
    ).first()
    mods_total_cost = float(mods_totals.total_cost or 0)
    mods_total_count = mods_totals.total_count or 0
    mods_avg_cost = mods_total_cost / mods_total_count if mods_total_count else 0

    # Per-vehicle: maintenance and mods separately
    # Subquery / CTE would be clean; for clarity we do two queries and merge
    maint_by_vehicle = (
        db.query(
            Maintenance.vehicle_id,
            func.count(Maintenance.id).label("service_count"),
            func.coalesce(func.sum(Maintenance.cost), 0).label("total_cost"),
        )
        .filter(Maintenance.date >= start, Maintenance.date <= end)
        .group_by(Maintenance.vehicle_id)
    )
    maint_map = {r.vehicle_id: (r.service_count or 0, float(r.total_cost or 0)) for r in maint_by_vehicle}

    mods_by_vehicle = (
        db.query(
            Mod.vehicle_id,
            func.count(Mod.id).label("mod_count"),
            func.coalesce(func.sum(Mod.cost), 0).label("total_cost"),
        )
        .filter(Mod.date >= start, Mod.date <= end)
        .group_by(Mod.vehicle_id)
    )
    mods_map = {r.vehicle_id: (r.mod_count or 0, float(r.total_cost or 0)) for r in mods_by_vehicle}

    vehicles = db.query(Vehicle).all()
    vehicles_stats = []
    for v in vehicles:
        m_sc, m_tc = maint_map.get(v.id) or (0, 0.0)
        o_count, o_tc = mods_map.get(v.id) or (0, 0.0)
        vehicles_stats.append({
            "vehicle_id": v.id,
            "nickname": v.nickname,
            "make": v.make,
            "model": v.model,
            "year": v.year,
            "maintenance_service_count": m_sc,
            "maintenance_total_cost": m_tc,
            "maintenance_average_cost": m_tc / m_sc if m_sc else 0,
            "mods_count": o_count,
            "mods_total_cost": o_tc,
            "mods_average_cost": o_tc / o_count if o_count else 0,
        })

    return {
        "year": y,
        "maintenance": {
            "total_cost": maint_total_cost,
            "total_services": maint_total_services,
            "average_cost_per_service": round(maint_avg_cost, 2),
        },
        "mods": {
            "total_cost": mods_total_cost,
            "total_count": mods_total_count,
            "average_cost_per_mod": round(mods_avg_cost, 2),
        },
        "by_vehicle": vehicles_stats,
    }
