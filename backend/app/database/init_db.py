from app.database.session import Base, engine
from app.models import User, Trip, TripInterest, ItineraryDay, Activity


def init_db():
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


if __name__ == "__main__":
    init_db()