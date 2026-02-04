from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(128), nullable=False)  # oil change, brakes, etc.
    date = Column(Date, nullable=False)
    mileage = Column(Float, nullable=True)
    cost = Column(Float, nullable=True)
    shop_name = Column(String(256), nullable=True)
    notes = Column(Text, nullable=True)
    receipt_path = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="maintenance")
