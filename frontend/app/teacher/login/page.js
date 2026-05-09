"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://127.0.0.1:8000";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) return setError("Both fields are required.");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.detail || "Login failed.");
      }
      const data = await res.json();
      localStorage.setItem("teacher_token", data.token);
      router.push("/teacher");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inp = "w-full rounded-xl border border-input-border bg-input-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 transition-all duration-150";

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <section className="bg-card rounded-2xl border border-card-border shadow-lg shadow-black/10 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-card-border text-center">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
              <span className="text-accent text-lg">🔒</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Teacher <span className="text-accent">Login</span>
            </h1>
            <p className="text-[12px] text-muted mt-1">Enter credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-medium text-label">Username</label>
              <input id="username" type="text" placeholder="admin" autoComplete="username"
                value={username} onChange={e => setUsername(e.target.value)} className={inp} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-label">Password</label>
              <input id="password" type="password" placeholder="••••••••" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)} className={inp} />
            </div>

            {error && (
              <div className="animate-fade-in flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <span className="shrink-0 mt-px">✕</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2
                ${loading
                  ? "bg-accent/30 text-indigo-300 cursor-wait"
                  : "bg-accent text-white hover:bg-accent-hover hover:shadow-lg hover:shadow-accent-glow active:scale-[0.98]"
                }`}>
              {loading && <span className="spinner" />}
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
