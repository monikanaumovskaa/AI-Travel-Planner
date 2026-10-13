import os
import httpx
from dotenv import load_dotenv

load_dotenv()

PLACES_API_KEY = os.getenv("PLACES_API_KEY")
PLACES_URL = "https://api.geoapify.com/v2/places"

SEARCH_RADIUS_METERS = 8000  # 8km around the destination center


class PlacesServiceError(Exception):
    pass


def _search(category: str, latitude: float, longitude: float, limit: int) -> list[dict]:
    try:
        resp = httpx.get(
            PLACES_URL,
            params={
                "categories": category,
                "filter": f"circle:{longitude},{latitude},{SEARCH_RADIUS_METERS}",
                "bias": f"proximity:{longitude},{latitude}",
                "limit": limit,
                "apiKey": PLACES_API_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPError as e:
        raise PlacesServiceError(f"Places request failed for {category}: {e}")

    results = []
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        results.append({
            "name": props.get("name") or props.get("address_line1", "Unnamed place"),
            "address": props.get("formatted"),
            "latitude": props.get("lat"),
            "longitude": props.get("lon"),
            "category": category,
        })
    return results


def get_attractions(latitude: float, longitude: float, limit: int = 12) -> list[dict]:
    return _search("tourism.sights", latitude, longitude, limit)


def get_restaurants(latitude: float, longitude: float, limit: int = 12) -> list[dict]:
    return _search("catering.restaurant", latitude, longitude, limit)