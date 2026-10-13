"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, isLoggedIn } from "@/lib/auth";

const LINKS = [
  { href: "/planner", label: "Planner" },
  { href: "/trips", label: "My trips" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  // Re-check on every route change so the navbar updates after login/logout
  useEffect(() => {
    setAuthed(isLoggedIn());
  }, [pathname]);

  function logout() {
    clearToken();
    setAuthed(false);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--deep)] text-white shadow-md">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-display text-xl font-bold">
          AI Travel Planner
        </Link>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm sm:ml-4">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`border-b-2 py-1 transition ${
                  active
                    ? "border-[var(--mango)] text-white"
                    : "border-transparent text-white/75 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {authed ? (
            <button
              onClick={logout}
              className="rounded-lg border border-white/30 px-3 py-1.5 transition hover:bg-white/10"
            >
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" className="text-white/80 hover:text-white">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[var(--mango)] px-3 py-1.5 font-semibold text-[var(--ink)] transition hover:brightness-95"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}