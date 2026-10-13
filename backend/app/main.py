from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, trips, itinerary, weather, places, activities
from app.core.logging_config import get_logger
from sqlalchemy.exc import OperationalError


app = FastAPI(title="AI Travel Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)
logger = get_logger(__name__)

app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(itinerary.router)
app.include_router(weather.router)
app.include_router(places.router)
app.include_router(activities.router)


@app.get("/")
def root():
    return {"message": "AI Travel Planner API is running"}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Pydantic gives very detailed but verbose errors — simplify for the frontend
    errors = [f"{'.'.join(str(loc) for loc in e['loc'][1:])}: {e['msg']}" for e in exc.errors()]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Invalid input", "errors": errors},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again."},
    )

@app.exception_handler(OperationalError)
async def db_error_handler(request: Request, exc: OperationalError):
    logger.error(f"Database error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database is currently unavailable. Please try again shortly."},
    )