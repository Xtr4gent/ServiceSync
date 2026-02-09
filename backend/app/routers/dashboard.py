from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Vehicle, Maintenance, Mod
from ..deps import get_current_user
from ..models import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _date_filter(model_date_col, start: date, end: date):
    """Filter by date range (inclusive). Use SQLite date() so datetime strings compare correctly."""
    # SQLite has no native DATE; date() returns 'YYYY-MM-DD' for consistent comparison
    col = func.date(model_date_col) if hasattr(func, "date") else model_date_col
    return (col >= start.isoformat()) & (col <= end.isoformat())


@router.get("/stats")
def get_stats(
    year: int | None = Query(None, description="Year for stats (default: current year)"),
    all_time: bool = Query(False, description="If true, include all records regardless of year"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    y = year or date.today().year
    start = date(y, 1, 1)
    end = date(y, 12, 31)
    use_year_filter = not all_time

    # Maintenance totals
    maint_q = db.query(
        func.coalesce(func.sum(Maintenance.cost), 0).label("total_cost"),
        func.count(Maintenance.id).label("total_services"),
    )
    if use_year_filter:
        maint_q = maint_q.filter(_date_filter(Maintenance.date, start, end))
    maint_totals = maint_q.first()
    maint_total_cost = float(maint_totals.total_cost or 0)
    maint_total_services = maint_totals.total_services or 0
    maint_avg_cost = maint_total_cost / maint_total_services if maint_total_services else 0

    # Mods totals - query all mods and aggregate in a single clear query
    mods_q = db.query(
        func.coalesce(func.sum(Mod.cost), 0).label("total_cost"),
        func.count(Mod.id).label("total_count"),
    )
    if use_year_filter:
        mods_q = mods_q.filter(_date_filter(Mod.date, start, end))
    mods_totals = mods_q.first()
    mods_total_cost = float(mods_totals.total_cost or 0)
    mods_total_count = mods_totals.total_count or 0
    mods_avg_cost = mods_total_cost / mods_total_count if mods_total_count else 0

    # Per-vehicle: maintenance
    maint_by_vehicle_q = db.query(
        Maintenance.vehicle_id,
        func.count(Maintenance.id).label("service_count"),
        func.coalesce(func.sum(Maintenance.cost), 0).label("total_cost"),
    )
    if use_year_filter:
        maint_by_vehicle_q = maint_by_vehicle_q.filter(_date_filter(Maintenance.date, start, end))
    maint_by_vehicle = maint_by_vehicle_q.group_by(Maintenance.vehicle_id).all()
    maint_map = {r.vehicle_id: (r.service_count or 0, float(r.total_cost or 0)) for r in maint_by_vehicle}

    # Per-vehicle: mods
    mods_by_vehicle_q = db.query(
        Mod.vehicle_id,
        func.count(Mod.id).label("mod_count"),
        func.coalesce(func.sum(Mod.cost), 0).label("total_cost"),
    )
    if use_year_filter:
        mods_by_vehicle_q = mods_by_vehicle_q.filter(_date_filter(Mod.date, start, end))
    mods_by_vehicle = mods_by_vehicle_q.group_by(Mod.vehicle_id).all()
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
        "all_time": all_time,
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
