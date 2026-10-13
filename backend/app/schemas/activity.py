from typing import Optional
from datetime import time
from pydantic import BaseModel


class ActivityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    estimated_cost: Optional[float] = None
    type: Optional[str] = None


class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    estimated_cost: Optional[float] = None
    type: Optional[str] = None


class RegenerateRequest(BaseModel):
    day_id: Optional[int] = None
    activity_id: Optional[int] = None