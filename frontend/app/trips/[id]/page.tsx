"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Trip, WeatherResponse } from "@/types/trip";
import DaySchedule from "@/components/DaySchedule";
import WeatherSummary from "@/components/WeatherSummary";
import LoadingState from "@/components/LoadingState";
import { Button } from "@/components/FormField";
import { gradientFor, formatDate, daysBetween } from "@/lib/theme";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

export default function TripDetailPage() {
  useRequireAuth();

  const params = useParams<{ id: string }>();
  const tripId = params.id;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    try {
      const data = await api.get<Trip>(`/trips/${tripId}`);
      setTrip(data);
      try {
        const w = await api.get<WeatherResponse>(
          `/weather?destination=${encodeURIComponent(data.destination)}&start_date=${data.start_date}&end_date=${data.end_date}`
        );
        setWeather(w);
      } catch {
        setWeather(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load trip");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const updated = await api.post<Trip>(`/trips/${tripId}/generate`, {});
      setTrip(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate itinerary");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <main><LoadingState label="Loading trip..." /></main>;
  if (error && !trip) {
    return <main><p className="text-sm text-[var(--poppy)]">{error}</p></main>;
  }
  if (!trip) return null;

  const allActivities = trip.days.flatMap((d) => d.activities);
  const sortedDays = [...trip.days].sort((a, b) => a.day_number - b.day_number);
  const hasItinerary = trip.days.length > 0;
  const totalCost =
  trip.total_estimated_cost ??
  allActivities.reduce((sum, a) => sum + (a.estimated_cost ?? 0), 0);

  return (
    <div>
      {/* Header band */}
      <header
        className="text-white"
        style={{ background: gradientFor(trip.destination) }}
      >
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-12">
          <h1 className="font-display text-4xl font-extrabold drop-shadow sm:text-6xl">
            {trip.destination}
          </h1>
          <p className="mt-2 text-white/90">
            {formatDate(trip.start_date)} to {formatDate(trip.end_date)},{" "}
            {daysBetween(trip.start_date, trip.end_date)} days
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
              {trip.travelers} traveler{trip.travelers === 1 ? "" : "s"}
            </span>
            {trip.budget != null && (
              <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
                Budget €{trip.budget}
              </span>
            )}
            {trip.travel_style && (
              <span className="rounded-full bg-white/20 px-3 py-1 capitalize backdrop-blur">
                {trip.travel_style}
              </span>
            )}
            {trip.interests.map((i) => (
              <span
                key={i.id}
                className="rounded-full bg-white/20 px-3 py-1 capitalize backdrop-blur"
              >
                {i.interest}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>
        {error && <p className="mb-4 text-sm text-[var(--poppy)]">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-4">
          {hasItinerary ? (
            <p className="font-display text-2xl font-bold">
              Estimated total: €{totalCost.toFixed(2)}</p>
          ) : (
            <p className="text-slate-600">No itinerary yet.</p>
          )}
          <Button onClick={handleGenerate} disabled={generating} variant={hasItinerary ? "secondary" : "accent"}>
            {generating
              ? "Generating..."
              : hasItinerary
              ? "Regenerate whole trip"
              : "Generate itinerary"}
          </Button>
        </div>

        <section className="mt-8">
          <h2 className="font-display mb-3 text-2xl font-bold">Weather</h2>
          <WeatherSummary weather={weather} />
        </section>

        {hasItinerary && (
          <>
            <section className="mt-10">
              <h2 className="font-display mb-3 text-2xl font-bold">Map</h2>
              <div className="overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5">
                <TripMap activities={allActivities} />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-display mb-4 text-2xl font-bold">Itinerary</h2>
              <div className="space-y-6">
                {sortedDays.map((day) => (
                  <DaySchedule key={day.id} tripId={trip.id} day={day} onChange={loadTrip} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}