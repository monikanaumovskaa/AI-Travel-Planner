from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.itinerary import Activity
from app.schemas.itinerary import ActivityResponse
from app.schemas.activity import ActivityCreate, ActivityUpdate
from app.api.auth import get_current_user
from app.api.trips import get_owned_activity_or_404, get_owned_day_or_404


router = APIRouter(tags=["activities"]) #for swagger doc


@router.post("/trips/{trip_id}/days/{day_id}/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def add_activity(
    trip_id: int,
    day_id: int,
    payload: ActivityCreate, #data of the new activity sent by frontend
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    day = get_owned_day_or_404(day_id, current_user, db)
    if day.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Day does not belong to this trip")

    activity = Activity(itinerary_day_id=day.id, **payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.put("/activities/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    payload: ActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activity = get_owned_activity_or_404(activity_id, current_user, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity, field, value)
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activity = get_owned_activity_or_404(activity_id, current_user, db)
    db.delete(activity)
    db.commit()
    return None