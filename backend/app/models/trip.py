from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.session import Base


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    destination = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    budget = Column(Float, nullable=True)
    travelers = Column(Integer, default=1)
    travel_style = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="trips")
    interests = relationship("TripInterest", back_populates="trip", cascade="all, delete-orphan")
    days = relationship("ItineraryDay", back_populates="trip", cascade="all, delete-orphan")


class TripInterest(Base):
    __tablename__ = "trip_interests"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    interest = Column(String, nullable=False)

    trip = relationship("Trip", back_populates="interests")