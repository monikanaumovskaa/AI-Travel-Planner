from typing import List, Optional
from pydantic import BaseModel


class PlaceResult(BaseModel):
    name: str
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    category: str


class PlacesSearchResponse(BaseModel):
    destination: str
    attractions: List[PlaceResult] = []
    restaurants: List[PlaceResult] = []