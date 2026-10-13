from datetime import date, time
from typing import List, Optional
from pydantic import BaseModel, Field


class ActivityAI(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[str] = Field(default=None, description="HH:MM 24-hour format")
    end_time: Optional[str] = Field(default=None, description="HH:MM 24-hour format")
    estimated_cost: Optional[float] = None
    type: str = Field(description="One of: attraction, restaurant, activity, transport")


class ItineraryDayAI(BaseModel):
    day: int
    date: str = Field(description="YYYY-MM-DD")
    activities: List[ActivityAI]


class ItineraryAI(BaseModel):
    trip_summary: str
    days: List[ItineraryDayAI]


# --- Response schemas (what our API returns to the frontend) ---

class ActivityResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    start_time: Optional[time]
    end_time: Optional[time]
    estimated_cost: Optional[float]
    type: Optional[str]

    class Config:
        from_attributes = True


class ItineraryDayResponse(BaseModel):
    id: int
    day_number: int
    date: date
    activities: List[ActivityResponse] = []

    class Config:
        from_attributes = True