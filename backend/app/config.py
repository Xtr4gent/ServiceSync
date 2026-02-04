from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "Garage Fleet"
    secret_key: str = "change-me-in-production-use-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week
    database_url: str = "sqlite:///./garage.db"
    upload_dir: Path = Path("./uploads")
    # Set to path to frontend dist (e.g. ../frontend/dist) to serve SPA in production
    frontend_dist: Path | None = None

    # Single user: set GARAGE_USERNAME / GARAGE_PASSWORD in .env
    username: str = "admin"
    password: str = "admin"

    class Config:
        env_file = ".env"
        env_prefix = "GARAGE_"


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
(settings.upload_dir / "vehicles").mkdir(exist_ok=True)
(settings.upload_dir / "receipts").mkdir(exist_ok=True)
