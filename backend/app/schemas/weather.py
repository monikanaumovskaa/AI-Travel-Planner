from typing import List, Optional
from pydantic import BaseModel


class DailyWeather(BaseModel):
    date: str
    temp_max: float
    temp_min: float
    precipitation_probability: Optional[float]
    description: str


class WeatherResponse(BaseModel):
    destination: str
    forecast_available: bool
    days: List[DailyWeather] = []