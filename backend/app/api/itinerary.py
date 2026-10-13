from datetime import datetime as dt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.session import get_db
from app.models.user import User
from app.models.trip import Trip
from app.models.itinerary import ItineraryDay, Activity
from app.schemas.trip import TripResponse
from app.api.auth import get_current_user
from app.api.trips import get_owned_trip_or_404
from app.services.gemini_service import generate_itinerary, GeminiGenerationError
from app.services.weather_service import geocode_destination, get_forecast, describe_weathercode, WeatherServiceError
from app.services.places_service import get_attractions, get_restaurants, PlacesServiceError
from app.core.logging_config import get_logger
from app.schemas.activity import RegenerateRequest
from app.api.trips import get_owned_day_or_404, get_owned_activity_or_404
from app.services.gemini_service import regenerate_day, regenerate_activity
 
router = APIRouter(prefix="/trips", tags=["itinerary"])
logger = get_logger(__name__)


def _gather_context(destination: str, start_date, end_date):
    """Fetches weather + places for the prompt. Never raises — degrades gracefully."""
    lat = lon = None
    weather_summary = None
    attraction_names, restaurant_names = [], []

    try:
        lat, lon, _ = geocode_destination(destination)
    except WeatherServiceError as e:
        logger.warning(f"Geocoding failed for '{destination}': {e}")
        return weather_summary, attraction_names, restaurant_names

    try:
        forecast = get_forecast(lat, lon, start_date, end_date)
        if forecast:
            weather_summary = "\n".join(
                f"{d['date']}: {describe_weathercode(d['weathercode'])}, {d['temp_min']}–{d['temp_max']}°C"
                for d in forecast
            )
        else:
            logger.info(f"No forecast available for '{destination}' (dates out of range)")
    except WeatherServiceError as e:
        logger.warning(f"Weather lookup failed for '{destination}': {e}")

    try:
        attraction_names = [a["name"] for a in get_attractions(lat, lon)]
        restaurant_names = [r["name"] for r in get_restaurants(lat, lon)]
    except PlacesServiceError as e:
        logger.warning(f"Places lookup failed for '{destination}': {e}")

    return weather_summary, attraction_names, restaurant_names


def _parse_time(value: str | None):
    if not value:
        return None
    try:
        return dt.strptime(value, "%H:%M").time()
    except ValueError:
        return None


@router.post("/{trip_id}/generate", response_model=TripResponse)
def generate_trip_itinerary(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_owned_trip_or_404(trip_id, current_user, db)
    num_days = (trip.end_date - trip.start_date).days + 1
    interests = [i.interest for i in trip.interests]

    weather_summary, attraction_names, restaurant_names = _gather_context(
        trip.destination, trip.start_date, trip.end_date
    )

    logger.info(
        f"Generating itinerary for trip {trip.id} ({trip.destination}): "
        f"weather={'yes' if weather_summary else 'no'}, "
        f"attractions={len(attraction_names)}, restaurants={len(restaurant_names)}"
    )

    try:
        ai_result = generate_itinerary(
            destination=trip.destination,
            start_date=trip.start_date.isoformat(),
            end_date=trip.end_date.isoformat(),
            num_days=num_days,
            budget=trip.budget,
            travelers=trip.travelers,
            interests=interests,
            travel_style=trip.travel_style,
            weather_summary=weather_summary,
            attractions=attraction_names,
            restaurants=restaurant_names,
        )
    except GeminiGenerationError as e:
        logger.error(f"Gemini generation failed for trip {trip.id}: {e}")
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}")

    # Replace any previous itinerary
    for day in list(trip.days):
        db.delete(day)
    db.flush()

    for ai_day in ai_result.days:
        day_row = ItineraryDay(
            trip_id=trip.id,
            day_number=ai_day.day,
            date=dt.strptime(ai_day.date, "%Y-%m-%d").date(),
        )
        db.add(day_row)
        db.flush()

        for ai_activity in ai_day.activities:
            db.add(Activity(
                itinerary_day_id=day_row.id,
                name=ai_activity.name,
                description=ai_activity.description,
                location=ai_activity.location,
                start_time=_parse_time(ai_activity.start_time),
                end_time=_parse_time(ai_activity.end_time),
                estimated_cost=ai_activity.estimated_cost,
                type=ai_activity.type,
            ))

    db.commit()

    trip = (
        db.query(Trip)
        .options(joinedload(Trip.interests), joinedload(Trip.days).joinedload(ItineraryDay.activities))
        .filter(Trip.id == trip.id)
        .first()
    )
    logger.info(f"Itinerary generated successfully for trip {trip.id}: {num_days} days")
    return trip
@router.post("/{trip_id}/regenerate", response_model=TripResponse)
def regenerate_part(
    trip_id: int,
    payload: RegenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_owned_trip_or_404(trip_id, current_user, db)
    interests = [i.interest for i in trip.interests]

    if payload.day_id and payload.activity_id:
        raise HTTPException(status_code=400, detail="Provide either day_id or activity_id, not both")

    if payload.day_id:
        day = get_owned_day_or_404(payload.day_id, current_user, db)
        if day.trip_id != trip_id:
            raise HTTPException(status_code=404, detail="Day does not belong to this trip")

        weather_summary, attraction_names, restaurant_names = _gather_context(
            trip.destination, day.date, day.date
        )
        daily_budget_hint = trip.budget / max(1, (trip.end_date - trip.start_date).days + 1) if trip.budget else None

        try:
            ai_day = regenerate_day(
                destination=trip.destination,
                date_str=day.date.isoformat(),
                day_number=day.day_number,
                budget_hint=daily_budget_hint,
                interests=interests,
                travel_style=trip.travel_style,
                weather_summary=weather_summary,
                attractions=attraction_names,
                restaurants=restaurant_names,
            )
        except GeminiGenerationError as e:
            raise HTTPException(status_code=502, detail=str(e))

        for activity in list(day.activities):
            db.delete(activity)
        db.flush()

        for ai_activity in ai_day.activities:
            db.add(Activity(
                itinerary_day_id=day.id,
                name=ai_activity.name,
                description=ai_activity.description,
                location=ai_activity.location,
                start_time=_parse_time(ai_activity.start_time),
                end_time=_parse_time(ai_activity.end_time),
                estimated_cost=ai_activity.estimated_cost,
                type=ai_activity.type,
            ))
        db.commit()

    elif payload.activity_id:
        activity = get_owned_activity_or_404(payload.activity_id, current_user, db)
        day = activity.day
        if day.trip_id != trip_id:
            raise HTTPException(status_code=404, detail="Activity does not belong to this trip")

        other_activities = [a for a in day.activities if a.id != activity.id]
        day_context = "\n".join(
            f"- {a.name} ({a.start_time}–{a.end_time})" for a in other_activities
        ) or "No other activities scheduled yet."

        try:
            ai_activity = regenerate_activity(
                destination=trip.destination,
                day_context=day_context,
                interests=interests,
                travel_style=trip.travel_style,
            )
        except GeminiGenerationError as e:
            raise HTTPException(status_code=502, detail=str(e))

        activity.name = ai_activity.name
        activity.description = ai_activity.description
        activity.location = ai_activity.location
        activity.start_time = _parse_time(ai_activity.start_time)
        activity.end_time = _parse_time(ai_activity.end_time)
        activity.estimated_cost = ai_activity.estimated_cost
        activity.type = ai_activity.type
        db.commit()

    else:
        raise HTTPException(status_code=400, detail="Provide either day_id or activity_id")

    db.refresh(trip)
    trip = (
        db.query(Trip)
        .options(joinedload(Trip.interests), joinedload(Trip.days).joinedload(ItineraryDay.activities))
        .filter(Trip.id == trip.id)
        .first()
    )
    return trip