import { WeatherResponse } from "@/types/trip";
import { formatDate } from "@/lib/theme";

export default function WeatherSummary({ weather }: { weather: WeatherResponse | null }) {
  if (!weather) return null;

  if (!weather.forecast_available) {
    return (
      <p className="rounded-xl bg-white p-4 text-sm text-slate-600 ring-1 ring-black/5">
        A forecast is only available about two weeks ahead, so there is nothing to show for these dates yet.
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {weather.days.map((day) => (
        <div
          key={day.date}
          className="min-w-[130px] rounded-xl bg-white p-3 text-sm shadow-sm ring-1 ring-black/5"
        >
          <p className="font-semibold">{formatDate(day.date)}</p>
          <p className="text-slate-600">{day.description}</p>
          <p className="mt-1 font-display text-lg font-bold text-[var(--lagoon)]">
            {Math.round(day.temp_min)}° / {Math.round(day.temp_max)}°C
          </p>
          {day.precipitation_probability !== null && (
            <p className="text-slate-500">{day.precipitation_probability}% chance of rain</p>
          )}
        </div>
      ))}
    </div>
  );
}