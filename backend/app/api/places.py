from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.auth import get_current_user
from app.models.user import User
from app.schemas.places import PlacesSearchResponse, PlaceResult
from app.services.weather_service import geocode_destination, WeatherServiceError
from app.services.places_service import get_attractions, get_restaurants, PlacesServiceError

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/search", response_model=PlacesSearchResponse)
def search_places(
    destination: str = Query(...),
    current_user: User = Depends(get_current_user),
):
    try:
        lat, lon, resolved_name = geocode_destination(destination)
    except WeatherServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    try:
        attractions = get_attractions(lat, lon)
        restaurants = get_restaurants(lat, lon)
    except PlacesServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return PlacesSearchResponse(
        destination=resolved_name,
        attractions=[PlaceResult(**a) for a in attractions],
        restaurants=[PlaceResult(**r) for r in restaurants],
    )