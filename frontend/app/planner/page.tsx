"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Input, Label, Button } from "@/components/FormField";
import { api, ApiError } from "@/lib/api";


const INTEREST_OPTIONS = [
  "Culture", "Food", "Nature", "History", "Shopping", "Nightlife", "Art", "Adventure",
];

export default function PlannerPage() {
    useRequireAuth();
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [travelers, setTravelers] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [travelStyle, setTravelStyle] = useState("balanced");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const d = new URLSearchParams(window.location.search).get("destination");

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);

  if (new Date(endDate) < new Date(startDate)) {
    setError("End date cannot be before start date.");
    return;
  }
  if (interests.length === 0) {
    setError("Please select at least one interest.");
    return;
  }

  setLoading(true);
  try {
      const trip = await api.post<{ id: number }>("/trips", {
        destination,
        start_date: startDate,
        end_date: endDate,
        budget: budget ? Number(budget) : null,
        travelers,
        travel_style: travelStyle,
        interests: interests.map((i) => i.toLowerCase()),
      });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to create trip. Are you logged in?"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
  <main className="max-w-2xl">
    <h1 className="font-display mb-1 text-4xl font-bold">Plan a trip</h1>
    <p className="mb-6 text-slate-600">
      Fill in the basics and we will build the itinerary on the next screen.
    </p>

    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl bg-white p-6 shadow-lg sm:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Destination</Label>
          <Input
            placeholder="Rome, Italy"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div>
          <Label>End date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        <div>
          <Label>Budget (€)</Label>
          <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div>
          <Label>Travelers</Label>
          <Input type="number" min={1} value={travelers} onChange={(e) => setTravelers(Number(e.target.value))} />
        </div>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-medium">What do you enjoy?</legend>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <label
                key={interest}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition focus-within:ring-2 focus-within:ring-[var(--lagoon)]/50 ${
                  selected
                    ? "border-[var(--lagoon)] bg-[var(--lagoon)] text-white"
                    : "border-[#bfd9d3] bg-white hover:bg-[var(--seafoam)]"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected}
                  onChange={() => toggleInterest(interest)}
                />
                {interest}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-medium">Travel style</legend>
        <div className="inline-flex overflow-hidden rounded-lg border border-[#bfd9d3]">
          {["relaxed", "balanced", "packed"].map((style) => (
            <label
              key={style}
              className={`cursor-pointer px-4 py-2 text-sm font-medium capitalize transition focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--lagoon)]/50 ${
                travelStyle === style
                  ? "bg-[var(--lagoon)] text-white"
                  : "bg-white hover:bg-[var(--seafoam)]"
              }`}
            >
              <input
                type="radio"
                name="travelStyle"
                className="sr-only"
                checked={travelStyle === style}
                onChange={() => setTravelStyle(style)}
              />
              {style}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-[var(--poppy)]">{error}</p>}
      <Button type="submit" variant="accent" disabled={loading} className="w-full py-3">
        {loading ? "Creating trip..." : "Generate trip"}
      </Button>
    </form>
  </main>
  );
};
