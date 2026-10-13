import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import ValidationError

from app.schemas.itinerary import (
    ItineraryAI,
    ItineraryDayAI,
    ActivityAI,
)


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

_client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(
        timeout=120_000
    ),
)
MODEL_NAME = "gemini-3.8-flash"


class GeminiGenerationError(Exception):
    """Raised when Gemini fails or returns invalid data."""


def build_prompt(
    destination: str,
    start_date: str,
    end_date: str,
    num_days: int,
    budget: float | None,
    travelers: int,
    interests: list[str],
    travel_style: str | None,
    weather_summary: str | None = None,
    attractions: list[str] | None = None,
    restaurants: list[str] | None = None,
) -> str:

    if weather_summary:
        weather_block = (
            f"\nWeather forecast:\n"
            f"{weather_summary}\n"
        )
    else:
        weather_block = (
            "\nWeather forecast: not available for these dates. "
            "Use typical seasonal weather for the destination.\n"
        )

    places_block = ""

    if attractions:
        places_block += (
            f"\nReal attractions near {destination} "
            "(prefer these, but you may add other well-known ones):\n"
        )

        places_block += "\n".join(
            f"- {attraction}"
            for attraction in attractions
        )

    if restaurants:
        places_block += (
            f"\n\nReal restaurants near {destination} "
            "(prefer these, but you may add other well-known ones):\n"
        )

        places_block += "\n".join(
            f"- {restaurant}"
            for restaurant in restaurants
        )

    return f"""
You are a professional travel planner.

Create a detailed day-by-day travel itinerary.

Destination: {destination}

Trip dates:
{start_date} to {end_date}

Number of days:
{num_days}

Budget:
{budget if budget is not None else "not specified"} EUR

Number of travelers:
{travelers}

Interests:
{", ".join(interests) if interests else "general sightseeing"}

Travel style:
{travel_style or "balanced"}

Travel style rules:
- relaxed = approximately 2-3 activities per day
- balanced = approximately 4-5 activities per day
- packed = approximately 6+ activities per day

{weather_block}

{places_block}

Rules:
- Produce exactly {num_days} days.
- Days must be numbered from 1 to {num_days}.
- Use the correct calendar date for every day.
- Activities must have realistic start and end times.
- Activities must not overlap.
- Include a realistic combination of attractions, meals and rest.
- Consider the user's interests.
- Consider the user's budget.
- Adjust activities according to weather when weather information is available.
- Prefer the provided real attractions and restaurants when appropriate.
- Only suggest real and plausible places for {destination}.
- estimated_cost must be in EUR.
- Use 0 for free activities.
""".strip()


def generate_itinerary(
    destination: str,
    start_date: str,
    end_date: str,
    num_days: int,
    budget: float | None,
    travelers: int,
    interests: list[str],
    travel_style: str | None,
    weather_summary: str | None = None,
    attractions: list[str] | None = None,
    restaurants: list[str] | None = None,
) -> ItineraryAI:

    prompt = build_prompt(
        destination=destination,
        start_date=start_date,
        end_date=end_date,
        num_days=num_days,
        budget=budget,
        travelers=travelers,
        interests=interests,
        travel_style=travel_style,
        weather_summary=weather_summary,
        attractions=attractions,
        restaurants=restaurants,
    )

    try:
        response = _client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ItineraryAI,
            ),
        )

    except Exception as e:
        raise GeminiGenerationError(
            f"Gemini request failed: {e}"
        )

    raw_text = response.text

    if not raw_text:
        raise GeminiGenerationError(
            "Gemini returned an empty response"
        )

    try:
        data = json.loads(raw_text)
        return ItineraryAI(**data)

    except (json.JSONDecodeError, ValidationError) as e:
        raise GeminiGenerationError(
            f"Gemini returned invalid data: {e}"
        )


def regenerate_day(
    destination: str,
    date_str: str,
    day_number: int,
    budget_hint: float | None,
    interests: list[str],
    travel_style: str | None,
    weather_summary: str | None,
    attractions: list[str],
    restaurants: list[str],
) -> ItineraryDayAI:

    places = attractions[:8] + restaurants[:8]

    prompt = f"""
You are a professional travel planner.

Regenerate a SINGLE day of a trip.

Destination:
{destination}

Date:
{date_str}

Day number:
{day_number}

Interests:
{", ".join(interests) if interests else "general sightseeing"}

Travel style:
{travel_style or "balanced"}

Daily budget hint:
{budget_hint if budget_hint is not None else "not specified"} EUR

Weather:
{weather_summary or "typical seasonal weather"}

Real nearby places:
{", ".join(places) if places else "No external places available"}

Rules:
- Generate only one day.
- Use the provided date.
- Create a realistic schedule.
- Activities must not overlap.
- Consider the weather.
- Consider the user's interests.
- Prefer real places when appropriate.
""".strip()

    try:
        response = _client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ItineraryDayAI,
            ),
        )

        if not response.text:
            raise GeminiGenerationError(
                "Gemini returned an empty response"
            )

        data = json.loads(response.text)

        return ItineraryDayAI(**data)

    except (json.JSONDecodeError, ValidationError) as e:
        raise GeminiGenerationError(
            f"Day regeneration returned invalid data: {e}"
        )

    except GeminiGenerationError:
        raise

    except Exception as e:
        raise GeminiGenerationError(
            f"Day regeneration failed: {e}"
        )


def regenerate_activity(
    destination: str,
    day_context: str,
    interests: list[str],
    travel_style: str | None,
) -> ActivityAI:

    prompt = f"""
You are a professional travel planner.

Suggest ONE replacement activity for a trip to {destination}.

Other activities already scheduled that same day:
{day_context}

Interests:
{", ".join(interests) if interests else "general sightseeing"}

Travel style:
{travel_style or "balanced"}

Rules:
- Produce exactly one new activity.
- Do not repeat an existing activity.
- Avoid time conflicts.
- The activity should fit naturally into the remaining free time.
- Suggest a real and plausible activity.
""".strip()

    try:
        response = _client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ActivityAI,
            ),
        )

        if not response.text:
            raise GeminiGenerationError(
                "Gemini returned an empty response"
            )

        data = json.loads(response.text)

        return ActivityAI(**data)

    except (json.JSONDecodeError, ValidationError) as e:
        raise GeminiGenerationError(
            f"Activity regeneration returned invalid data: {e}"
        )

    except GeminiGenerationError:
        raise

    except Exception as e:
        raise GeminiGenerationError(
            f"Activity regeneration failed: {e}"
        )