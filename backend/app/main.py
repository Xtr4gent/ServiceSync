from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .config import settings
from .models import User
from .auth import get_password_hash
from .routers import auth, vehicles, maintenance, mods, dashboard

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://garage.hamiltons.cloud", "http://garage.hamiltons.cloud"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def _migrate_add_trim():
    """Add trim column to vehicles if missing (existing DBs)."""
    from sqlalchemy import text, inspect
    insp = inspect(engine)
    cols = [c["name"] for c in insp.get_columns("vehicles")]
    if "trim" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE vehicles ADD COLUMN trim VARCHAR(128)"))


_migrate_add_trim()


def _ensure_single_user():
    db = SessionLocal()
    try:
        if db.query(User).first() is None:
            db.add(User(
                username=settings.username,
                hashed_password=get_password_hash(settings.password),
            ))
            db.commit()
    finally:
        db.close()


_ensure_single_user()

uploads_path = Path(settings.upload_dir).resolve()
if uploads_path.exists():
    app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

app.include_router(auth.router, prefix="/api")
app.include_router(vehicles.router, prefix="/api")
app.include_router(maintenance.router, prefix="/api")
app.include_router(mods.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve React SPA in production (set GARAGE_FRONTEND_DIST to frontend dist path)
_dist = settings.frontend_dist and Path(settings.frontend_dist).resolve()
if _dist and _dist.is_dir():
    app.mount("/assets", StaticFiles(directory=str(_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = _dist / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(_dist / "index.html"))
