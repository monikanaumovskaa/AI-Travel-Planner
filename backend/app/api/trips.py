from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.itinerary import ItineraryDay, Activity

from app.database.session import get_db
from app.models.user import User
from app.models.trip import Trip, TripInterest
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/trips", tags=["trips"])


def get_owned_trip_or_404(trip_id: int, current_user: User, db: Session) -> Trip:
    trip = (
        db.query(Trip)
        .options(joinedload(Trip.interests))
        .filter(Trip.id == trip_id, Trip.user_id == current_user.id)
        .first()
    )
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=400, detail="end_date cannot be before start_date")

    trip = Trip(
        user_id=current_user.id,
        destination=payload.destination,
        start_date=payload.start_date,
        end_date=payload.end_date,
        budget=payload.budget,
        travelers=payload.travelers,
        travel_style=payload.travel_style,
    )
    trip.interests = [TripInterest(interest=i) for i in payload.interests]

    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("", response_model=list[TripResponse])
def list_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trips = (
        db.query(Trip)
        .options(joinedload(Trip.interests))
        .filter(Trip.user_id == current_user.id)
        .order_by(Trip.created_at.desc())
        .all()
    )
    return trips


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_owned_trip_or_404(trip_id, current_user, db)


@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_owned_trip_or_404(trip_id, current_user, db)

    update_data = payload.model_dump(exclude_unset=True, exclude={"interests"})
    for field, value in update_data.items():
        setattr(trip, field, value)

    if payload.interests is not None:
        trip.interests = [TripInterest(interest=i) for i in payload.interests]

    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = get_owned_trip_or_404(trip_id, current_user, db)
    db.delete(trip)
    db.commit()
    return None

def get_owned_day_or_404(day_id: int, current_user: User, db: Session) -> ItineraryDay:
    day = (
        db.query(ItineraryDay)
        .join(Trip)
        .filter(ItineraryDay.id == day_id, Trip.user_id == current_user.id)
        .first()
    )
    if day is None:
        raise HTTPException(status_code=404, detail="Day not found")
    return day


def get_owned_activity_or_404(activity_id: int, current_user: User, db: Session) -> Activity:
    activity = (
        db.query(Activity)
        .join(ItineraryDay)
        .join(Trip)
        .filter(Activity.id == activity_id, Trip.user_id == current_user.id)
        .first()
    )
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity