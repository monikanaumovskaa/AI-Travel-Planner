"use client";

import { useState } from "react";
import { ItineraryDay, Activity } from "@/types/trip";
import { api, ApiError } from "@/lib/api";
import { Button, Input, Label } from "@/components/FormField";
import { formatDate } from "@/lib/theme";

type Props = { tripId: number; day: ItineraryDay; onChange: () => void };

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

export default function DaySchedule({ tripId, day, onChange }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dayBusy, setDayBusy] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...day.activities].sort((a, b) =>
    (a.start_time || "").localeCompare(b.start_time || "")
  );

  async function deleteActivity(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await api.delete(`/activities/${id}`);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  async function regenerateActivity(id: number) {
    setBusyId(id);
    setError(null);
    try {
      await api.post(`/trips/${tripId}/regenerate`, { activity_id: id });
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to regenerate");
    } finally {
      setBusyId(null);
    }
  }

  async function regenerateDay() {
    setDayBusy(true);
    setError(null);
    try {
      await api.post(`/trips/${tripId}/regenerate`, { day_id: day.id });
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to regenerate day");
    } finally {
      setDayBusy(false);
    }
  }

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-display flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mango)] text-xl font-extrabold text-[var(--ink)]">
            {day.day_number}
          </span>
          <div>
            <h3 className="font-display text-xl font-bold">Day {day.day_number}</h3>
            <p className="text-sm text-slate-500">{formatDate(day.date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAddForm((s) => !s)}>
            {showAddForm ? "Cancel" : "Add activity"}
          </Button>
          <Button variant="secondary" onClick={regenerateDay} disabled={dayBusy}>
            {dayBusy ? "Regenerating..." : "Regenerate day"}
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--poppy)]">{error}</p>}

      {showAddForm && (
        <AddActivityForm
          tripId={tripId}
          dayId={day.id}
          onAdded={() => {
            setShowAddForm(false);
            onChange();
          }}
        />
      )}

      {sorted.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">Nothing planned for this day yet.</p>
      )}

      <ul className="ml-5 mt-6 space-y-6 border-l-2 border-[var(--seafoam)]">
        {sorted.map((activity: Activity) => (
          <li key={activity.id} className="relative pl-6">
            <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-[var(--lagoon)] ring-4 ring-white" />

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--lagoon)]">
                  {hhmm(activity.start_time) || "Anytime"}
                  {activity.end_time && ` to ${hhmm(activity.end_time)}`}
                </p>
                <p className="text-base font-semibold">
                  {activity.name}
                  {activity.type && (
                    <span className="ml-2 rounded-full bg-[var(--seafoam)] px-2 py-0.5 text-xs font-medium capitalize text-[var(--deep)]">
                      {activity.type}
                    </span>
                  )}
                </p>
                {activity.description && (
                  <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                )}
                {activity.location && (
                  <p className="mt-1 text-sm italic text-slate-400">{activity.location}</p>
                )}
                {activity.estimated_cost != null && (
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    About €{activity.estimated_cost}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => regenerateActivity(activity.id)}
                  disabled={busyId === activity.id}
                >
                  {busyId === activity.id ? "..." : "Swap"}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteActivity(activity.id)}
                  disabled={busyId === activity.id}
                >
                  Remove
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function AddActivityForm({
  tripId,
  dayId,
  onAdded,
}: {
  tripId: number;
  dayId: number;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give the activity a name.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/trips/${tripId}/days/${dayId}/activities`, {
        name,
        start_time: startTime || null,
        estimated_cost: estimatedCost ? Number(estimatedCost) : null,
        type: "activity",
      });
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add activity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-xl bg-[var(--mist)] p-4">
      <div>
        <Label>Activity name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Start time</Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label>Estimated cost (€)</Label>
          <Input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-[var(--poppy)]">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "Adding..." : "Add to this day"}
      </Button>
    </form>
  );
}