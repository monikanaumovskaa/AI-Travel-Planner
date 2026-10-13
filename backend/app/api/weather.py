from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.auth import get_current_user
from app.models.user import User
from app.schemas.weather import WeatherResponse, DailyWeather
from app.services.weather_service import (
    geocode_destination, get_forecast, describe_weathercode, WeatherServiceError,
)

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("", response_model=WeatherResponse)
def get_weather(
    destination: str = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
):
    try:
        lat, lon, resolved_name = geocode_destination(destination)
        forecast = get_forecast(lat, lon, start_date, end_date)
    except WeatherServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    days = [
        DailyWeather(
            date=day["date"],
            temp_max=day["temp_max"],
            temp_min=day["temp_min"],
            precipitation_probability=day["precipitation_probability"],
            description=describe_weathercode(day["weathercode"]),
        )
        for day in forecast
    ]

    return WeatherResponse(
        destination=resolved_name,
        forecast_available=len(days) > 0,
        days=days,
    )