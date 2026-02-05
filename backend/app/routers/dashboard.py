from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Vehicle, Maintenance
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

    # Total cost and count for the year (all vehicles)
    totals = (
        db.query(
            func.coalesce(func.sum(Maintenance.cost), 0).label("total_cost"),
            func.count(Maintenance.id).label("total_services"),
        )
        .filter(Maintenance.date >= start, Maintenance.date <= end)
    ).first()

    total_cost = float(totals.total_cost or 0)
    total_services = totals.total_services or 0
    average_cost = total_cost / total_services if total_services else 0

    # Per-vehicle stats for the year
    by_vehicle = (
        db.query(
            Vehicle.id,
            Vehicle.nickname,
            Vehicle.make,
            Vehicle.model,
            Vehicle.year,
            func.count(Maintenance.id).label("service_count"),
            func.coalesce(func.sum(Maintenance.cost), 0).label("total_cost"),
        )
        .outerjoin(Maintenance, (Vehicle.id == Maintenance.vehicle_id) & (Maintenance.date >= start) & (Maintenance.date <= end))
        .group_by(Vehicle.id)
    )

    vehicles_stats = []
    for row in by_vehicle:
        sc = row.service_count or 0
        tc = float(row.total_cost or 0)
        vehicles_stats.append({
            "vehicle_id": row.id,
            "nickname": row.nickname,
            "make": row.make,
            "model": row.model,
            "year": row.year,
            "service_count": sc,
            "total_cost": tc,
            "average_cost": tc / sc if sc else 0,
        })

    return {
        "year": y,
        "total_cost": total_cost,
        "total_services": total_services,
        "average_cost_per_service": round(average_cost, 2),
        "by_vehicle": vehicles_stats,
    }
