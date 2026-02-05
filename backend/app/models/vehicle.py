from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(128), nullable=True)
    make = Column(String(128), nullable=False)
    model = Column(String(128), nullable=False)
    trim = Column(String(128), nullable=True)
    year = Column(Integer, nullable=False)
    vin = Column(String(32), nullable=True)
    license_plate = Column(String(32), nullable=True)
    current_mileage = Column(Float, nullable=True)
    photo_path = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    maintenance = relationship("Maintenance", back_populates="vehicle", cascade="all, delete-orphan")
    mods = relationship("Mod", back_populates="vehicle", cascade="all, delete-orphan")
