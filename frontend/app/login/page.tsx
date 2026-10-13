"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import { Input, Label, Button } from "@/components/FormField";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new URLSearchParams();
formData.append("username", email);
formData.append("password", password);

const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  }
);

const data = await response.json();

if (!response.ok) {
  throw new Error(data.detail || "Login failed");
}
      saveToken(data.access_token);
      router.push("/trips");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your trips."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-[var(--lagoon)] hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-[var(--poppy)]">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </AuthShell>
  );
}