"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Login page.
 *
 * Security notes:
 * - Credentials are POSTed to a Next.js route handler (not directly to the Java backend)
 * - The route handler stores the JWT in an HttpOnly cookie (inaccessible to JS)
 * - Password field uses autocomplete="current-password" for password manager support
 * - No token is ever stored in localStorage or sessionStorage
 */
export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setError(body.error ?? "Login failed. Please check your credentials.");
        return;
      }

      const data = await res.json() as { username?: string };
      if (data.username) localStorage.setItem("bankops_user", data.username);

      // JWT is now stored in an HttpOnly cookie by the server.
      // Redirect to dashboard.
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the authentication service. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-panel p-8 shadow-2xl">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/20 ring-1 ring-brand-500/30">
            <ShieldCheck className="h-6 w-6 text-brand-400" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-100">BankOps Agent Console</h1>
            <p className="mt-0.5 text-xs text-slate-500">Authorised personnel only</p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-700/50 bg-red-900/20 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-slate-400">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="
                w-full rounded-md border border-border bg-surface px-3 py-2.5
                text-sm text-slate-100 placeholder-slate-600
                focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
              "
              placeholder="demo.operator"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-400">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="
                  w-full rounded-md border border-border bg-surface px-3 py-2.5 pr-10
                  text-sm text-slate-100 placeholder-slate-600
                  focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500
                "
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye     className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="btn-primary mt-2 flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner size="sm" /> Authenticating…</> : "Sign in"}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 rounded-lg bg-white/5 p-3 text-center">
          <p className="text-xs text-slate-500">Demo credentials</p>
          <p className="mt-1 font-mono text-xs text-slate-400">
            demo.operator / BankOps2026!
          </p>
        </div>
      </div>
    </div>
  );
}