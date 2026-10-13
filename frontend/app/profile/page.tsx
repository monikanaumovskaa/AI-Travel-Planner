"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { useRequireAuth } from "@/lib/useRequireAuth";

type UserInfo = { id: number; name: string; email: string };

export default function ProfilePage() {
  useRequireAuth();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<UserInfo>("/auth/me")
      .then(setUser)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  if (loading) return <main><p>Loading...</p></main>;

  return (
    <main>
      <h1>Profile</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {user && (
        <>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
        </>
      )}
      <button onClick={handleLogout}>Log out</button>
    </main>
  );
}