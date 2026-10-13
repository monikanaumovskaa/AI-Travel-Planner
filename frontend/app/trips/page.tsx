"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Trip } from "@/types/trip";
import LoadingState from "@/components/LoadingState";
import { gradientFor, formatDate, daysBetween } from "@/lib/theme";

export default function TripsPage() {
  useRequireAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Trip[]>("/trips")
      .then(setTrips)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load trips")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main><LoadingState label="Loading your trips..." /></main>;

  return (
    <main>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-bold">My trips</h1>
        <Link
          href="/planner"
          className="rounded-lg bg-[var(--mango)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:brightness-95"
        >
          New trip
        </Link>
      </div>

      {error && <p className="text-sm text-[var(--poppy)]">{error}</p>}

      {!error && trips.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[#bfd9d3] p-10 text-center">
          <p className="font-display text-xl font-semibold">No trips yet</p>
          <p className="mt-1 text-slate-600">
            Plan your first one and it will show up here.
          </p>
          <Link
            href="/planner"
            className="mt-4 inline-block rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--deep)]"
          >
            Plan a trip
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <Link
            key={trip.id}
            href={`/trips/${trip.id}`}
            className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div
              className="flex h-28 items-end p-4"
              style={{ background: gradientFor(trip.destination) }}
            >
              <h2 className="font-display text-2xl font-bold text-white drop-shadow">
                {trip.destination}
              </h2>
            </div>
            <div className="space-y-1 p-4 text-sm text-slate-600">
              <p>
                {formatDate(trip.start_date)} to {formatDate(trip.end_date)}
              </p>
              <p>
                {daysBetween(trip.start_date, trip.end_date)} days,{" "}
                {trip.travelers} traveler{trip.travelers === 1 ? "" : "s"}
              </p>
              {trip.budget != null && <p>Budget €{trip.budget}</p>}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}