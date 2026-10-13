from datetime import date, timedelta
import httpx

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

MAX_FORECAST_DAYS_AHEAD = 15  # Open-Meteo's free forecast horizon


class WeatherServiceError(Exception):
    pass


def geocode_destination(destination: str) -> tuple[float, float, str]:
    """Turns a place name like 'Rome, Italy' into (latitude, longitude, resolved_name)."""
    try:
        resp = httpx.get(
            GEOCODING_URL,
            params={"name": destination, "count": 1, "language": "en"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPError as e:
        raise WeatherServiceError(f"Geocoding request failed: {e}")

    results = data.get("results")
    if not results:
        raise WeatherServiceError(f"Could not find location: {destination}")

    place = results[0]
    resolved_name = f"{place['name']}, {place.get('country', '')}".strip(", ")
    return place["latitude"], place["longitude"], resolved_name


def get_forecast(latitude: float, longitude: float, start_date: date, end_date: date) -> list[dict]:
    """Returns a list of daily forecasts, or an empty list if the dates are too far ahead."""
    today = date.today()
    if start_date > today + timedelta(days=MAX_FORECAST_DAYS_AHEAD):
        return []  # too far in the future — no real forecast available yet

    # Clamp end_date to the forecast horizon so we don't request invalid dates
    clamped_end = min(end_date, today + timedelta(days=MAX_FORECAST_DAYS_AHEAD))

    try:
        resp = httpx.get(
            FORECAST_URL,
            params={
                "latitude": latitude,
                "longitude": longitude,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
                "timezone": "auto",
                "start_date": start_date.isoformat(),
                "end_date": clamped_end.isoformat(),
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPError as e:
        raise WeatherServiceError(f"Forecast request failed: {e}")

    daily = data.get("daily", {})
    dates = daily.get("time", [])

    forecast = []
    for i, day in enumerate(dates):
        forecast.append({
            "date": day,
            "temp_max": daily["temperature_2m_max"][i],
            "temp_min": daily["temperature_2m_min"][i],
            "precipitation_probability": daily["precipitation_probability_max"][i],
            "weathercode": daily["weathercode"][i],
        })
    return forecast


WEATHER_CODE_DESCRIPTIONS = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm",
}


def describe_weathercode(code: int) -> str:
    return WEATHER_CODE_DESCRIPTIONS.get(code, "Unknown conditions")