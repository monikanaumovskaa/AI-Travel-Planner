import os
import json
import time

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import ValidationError

from app.core.logging_config import get_logger
from app.schemas.itinerary import (
    ItineraryAI,
    ItineraryDayAI,
    ActivityAI,
)


load_dotenv()

logger = get_logger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

_client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options=types.HttpOptions(timeout=60_000),
)

# Tried in order. If one is overloaded or doesn't exist, the next one is used.
MODELS = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
]
RETRY_DELAYS = [2, 5]  # seconds to wait between retries on the same model
TEMPORARY_CODES = (429, 500, 503, 504)


class GeminiGenerationError(Exception):
    """Raised when Gemini fails or returns invalid data."""


def _thinking_config(model: str):
    """Turns off (or minimizes) hidden reasoning, which this task doesn't need.

    Gemini 2.5 models use thinking_budget, Gemini 3+ models use thinking_level.
    Sending the wrong one to a model causes an error, so we pick by model name.
    """
    if model.startswith("gemini-2.5"):
        return types.ThinkingConfig(thinking_budget=0)
    if model.startswith("gemini-3"):
        return types.ThinkingConfig(thinking_level=types.ThinkingLevel.LOW)
    return None


def _generate(prompt: str, schema) -> str:
    """Calls Gemini with retries and model fallback. Returns the raw JSON text."""
    last_error = None

    for model in MODELS:
        for attempt in range(len(RETRY_DELAYS) + 1):
            try:
                response = _client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=schema,
                        thinking_config=_thinking_config(model),
                    ),
                )
            except genai_errors.APIError as e:
                last_error = e

                if e.code in TEMPORARY_CODES:
                    logger.warning(
                        f"{model} temporarily unavailable "
                        f"(code {e.code}), attempt {attempt + 1}"
                    )
                    if attempt < len(RETRY_DELAYS):
                        time.sleep(RETRY_DELAYS[attempt])
                        continue
                    break  # out of retries, move to the next model

                if e.code in (401, 403):
                    raise GeminiGenerationError(
                        f"Gemini rejected the API key: {e}"
                    )

                # 400 / 404 etc: this model name or setting doesn't work
                logger.warning(
                    f"{model} failed with code {e.code}: {e}. Trying next model."
                )
                break
            except Exception as e:
                raise GeminiGenerationError(f"Gemini request failed: {e}")

            if not response.text:
                raise GeminiGenerationError("Gemini returned an empty response")

            return response.text

    if last_error is not None and getattr(last_error, "code", None) in TEMPORARY_CODES:
        raise GeminiGenerationError(
            "The AI service is busy right now. Please try again in a minute."
        )
    raise GeminiGenerationError(f"No Gemini model could answer: {last_error}")


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

    per_day = {"relaxed": 3, "balanced": 4, "packed": 5}.get(
        (travel_style or "balanced").lower(), 4
    )

    if weather_summary:
        weather_block = f"\nWeather forecast:\n{weather_summary}\n"
    else:
        weather_block = (
            "\nWeather forecast: not available for these dates. "
            "Use typical seasonal weather for the destination.\n"
        )

    places_block = ""

    if attractions:
        places_block += f"\nReal attractions near {destination} (prefer these):\n"
        places_block += "\n".join(f"- {a}" for a in attractions[:8])

    if restaurants:
        places_block += f"\n\nReal restaurants near {destination} (prefer these):\n"
        places_block += "\n".join(f"- {r}" for r in restaurants[:8])

    return f"""
You are a professional travel planner. Create a day-by-day itinerary.

Destination: {destination}
Trip dates: {start_date} to {end_date} ({num_days} days)
Budget: {budget if budget is not None else "not specified"} EUR
Number of travelers: {travelers}
Interests: {", ".join(interests) if interests else "general sightseeing"}
Travel style: {travel_style or "balanced"}
{weather_block}{places_block}

Rules:
- Produce exactly {num_days} days, numbered 1 to {num_days}, with the correct calendar date for each.
- trip_summary: one short sentence.
- Exactly {per_day} activities per day, meals included.
- description: at most 12 words. location: just the place name.
- Start and end times must be realistic and must not overlap.
- Consider the interests, the budget and the weather.
- Only suggest real places in {destination}.
- estimated_cost: realistic EUR number, 0 for free activities.
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

    raw_text = _generate(prompt, ItineraryAI)

    try:
        data = json.loads(raw_text)
        return ItineraryAI(**data)

    except (json.JSONDecodeError, ValidationError) as e:
        raise GeminiGenerationError(f"Gemini returned invalid data: {e}")


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

    places = attractions[:6] + restaurants[:6]
    per_day = {"relaxed": 3, "balanced": 4, "packed": 5}.get(
        (travel_style or "balanced").lower(), 4
    )

    prompt = f"""
You are a professional travel planner. Regenerate a SINGLE day of a trip.

Destination: {destination}
Date: {date_str} (day {day_number})
Interests: {", ".join(interests) if interests else "general sightseeing"}
Travel style: {travel_style or "balanced"}
Daily budget hint: {budget_hint if budget_hint is not None else "not specified"} EUR
Weather: {weather_summary or "typical seasonal weather"}
Real nearby places: {", ".join(places) if places else "none available"}

Rules:
- Generate only this one day, using the date above.
- Exactly {per_day} activities, meals included.
- description: at most 12 words. location: just the place name.
- Times must be realistic and must not overlap.
- Consider the weather and the interests.
- Prefer the real places when appropriate.
""".strip()

    raw_text = _generate(prompt, ItineraryDayAI)

    try:
        return ItineraryDayAI(**json.loads(raw_text))

    except (json.JSONDecodeError, ValidationError) as e:
        raise GeminiGenerationError(
            f"Day regeneration returned invalid data: {e}"
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

Other activities already scheduled that day:
{day_context}

Interests: {", ".join(interests) if interests else "general sightseeing"}
Travel style: {travel_style or "balanced"}

Rules:
- Produce exactly one new activity.
- Do not repeat an existing activity.
- Avoid time conflicts with the activities above.
- description: at most 12 words. location: just the place name.
- Suggest a real and plausible place.
""".strip()

    raw_text = _generate(prompt, ActivityAI)

    try:
        return ActivityAI(**json.loads(raw_text))

    except (json.JSONDecodeError, ValidationError) as e:
        raise GeminiGenerationError(
            f"Activity regeneration returned invalid data: {e}"
        )