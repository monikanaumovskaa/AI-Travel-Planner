"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Scene from "@/components/Scene";
import { DESTINATIONS } from "@/lib/destinations";

const STEPS = [
  {
    title: "Say where and when",
    text: "Pick a destination, your dates, a budget and what you enjoy.",
  },
  {
    title: "Get a full plan",
    text: "The AI builds each day using real places and the weather forecast.",
  },
  {
    title: "Change what you like",
    text: "Swap one activity, redo a single day or add your own stops.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [destination, setDestination] = useState("");

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % DESTINATIONS.length),
      6000
    );
    return () => clearInterval(timer);
  }, [paused]);

  function go(target: number) {
    setIndex((target + DESTINATIONS.length) % DESTINATIONS.length);
  }

  function startPlanning(e: React.FormEvent) {
    e.preventDefault();
    const q = destination.trim();
    router.push(q ? `/planner?destination=${encodeURIComponent(q)}` : "/planner");
  }

  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-[640px] overflow-hidden md:h-[clamp(580px,72vh,740px)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Sliding scenes */}
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {DESTINATIONS.map((d) => (
            <div
              key={d.city}
              className="relative h-full min-w-full"
              style={{ background: d.sky }}
            >
              <Scene
                destination={d}
                className="absolute bottom-0 left-0 h-[55%] w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
              <div className="relative mx-auto h-full max-w-6xl px-4">
                <div className="absolute bottom-8 left-4 text-white">
                  <p className="text-sm text-white/90">{d.country}</p>
                  <p className="font-display text-5xl font-extrabold leading-none sm:text-6xl">
                    {d.city}
                  </p>
                  <p className="mt-2 hidden max-w-xs text-sm text-white/90 sm:block">
                    {d.line}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed content on top of the sliding scenes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="mx-auto grid h-full max-w-6xl items-start gap-8 px-4 pt-10 md:items-center md:pt-0 lg:grid-cols-[1.25fr_1fr]">
            <div className="text-white">
              <p className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                AI-powered trip planning
              </p>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] drop-shadow sm:text-6xl">
                Your whole trip, planned in a minute.
              </h1>
              <p className="mt-4 max-w-md text-base text-white/90 sm:text-lg">
                Real places, a live weather forecast and a schedule you can
                change piece by piece.
              </p>
            </div>

            <form
              onSubmit={startPlanning}
              className="pointer-events-auto w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl lg:justify-self-end"
            >
              <p className="font-display text-xl font-bold text-[var(--ink)]">
                Where to?
              </p>
              <p className="mb-3 text-sm text-slate-500">
                Start with a destination, add the details next.
              </p>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Rome, Italy"
                className="w-full rounded-lg border border-[#bfd9d3] px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-slate-400 focus:border-[var(--lagoon)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)]/40"
              />
              <button
                type="submit"
                className="mt-3 w-full rounded-lg bg-[var(--mango)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:brightness-95"
              >
                Start planning
              </button>
            </form>
          </div>
        </div>

        {/* Slider controls */}
        <div className="absolute inset-x-0 bottom-6">
          <div className="mx-auto flex max-w-6xl justify-end px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => go(index - 1)}
                aria-label="Previous destination"
                className="h-9 w-9 rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35"
              >
                ‹
              </button>
              <div className="flex gap-2">
                {DESTINATIONS.map((d, i) => (
                  <button
                    key={d.city}
                    onClick={() => go(i)}
                    aria-label={`Show ${d.city}`}
                    className={`h-2.5 rounded-full transition-all ${
                      i === index ? "w-6 bg-white" : "w-2.5 bg-white/55"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => go(index + 1)}
                aria-label="Next destination"
                className="h-9 w-9 rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/35"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular destinations */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold">Popular destinations</h2>
          <Link href="/planner" className="text-sm font-semibold text-[var(--lagoon)] hover:underline">
            Plan something else
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.city}
              href={`/planner?destination=${encodeURIComponent(d.city)}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-40" style={{ background: d.sky }}>
                <Scene
                  destination={d}
                  className="absolute bottom-0 left-0 h-full w-full"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500">{d.country}</p>
                <p className="font-display text-xl font-bold">{d.city}</p>
                <p className="mt-1 text-sm text-slate-600">{d.line}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display mb-10 text-3xl font-bold">How it works</h2>
          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <p className="font-display flex h-12 w-12 items-center justify-center rounded-full bg-[var(--seafoam)] text-2xl font-extrabold text-[var(--deep)]">
                  {i + 1}
                </p>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="bg-[var(--deep)] py-14 text-center text-white">
        <h2 className="font-display text-3xl font-bold">Where to next?</h2>
        <p className="mt-2 text-white/75">Create an account and save every trip you plan.</p>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-lg bg-[var(--mango)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:brightness-95"
        >
          Create a free account
        </Link>
      </section>
    </div>
  );
}