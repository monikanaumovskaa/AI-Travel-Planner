from datetime import date, datetime, time
from typing import List, Optional
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, computed_field

from app.schemas.itinerary import ItineraryDayResponse
from pydantic import BaseModel


# ---------------------------------------------------------
# Trip Interest
# ---------------------------------------------------------

class TripInterestResponse(BaseModel):
    id: int
    interest: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------
# Activity
# ---------------------------------------------------------

class ActivityResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    estimated_cost: Optional[float] = None
    type: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------
# Itinerary Day
# ---------------------------------------------------------

class ItineraryDayResponse(BaseModel):
    id: int
    day_number: int
    date: date
    activities: List[ActivityResponse] = []

    class Config:
        from_attributes = True


# ---------------------------------------------------------
# Create Trip
# ---------------------------------------------------------

class TripCreate(BaseModel):
    destination: str
    start_date: date
    end_date: date
    budget: Optional[float] = None
    travelers: int = 1
    travel_style: Optional[str] = None
    interests: List[str] = []


# ---------------------------------------------------------
# Update Trip
# ---------------------------------------------------------

class TripUpdate(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    travelers: Optional[int] = None
    travel_style: Optional[str] = None
    interests: Optional[List[str]] = None


# ---------------------------------------------------------
# Trip Response
# ---------------------------------------------------------

class TripResponse(BaseModel):
    id: int
    destination: str
    start_date: date
    end_date: date
    budget: Optional[float]
    travelers: int
    travel_style: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    interests: List[TripInterestResponse] = []
    days: List[ItineraryDayResponse] = []

    class Config:
        from_attributes = True

    @computed_field
    @property
    def total_estimated_cost(self) -> float:
        return sum(
            activity.estimated_cost or 0
            for day in self.days
            for activity in day.activities
        )