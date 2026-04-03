"use client";

import { ShieldCheck, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Top navigation bar with logout support.
 * The logout action clears the HttpOnly cookie via the server route handler.
 */
export function Navbar() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-panel/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-brand-500" aria-hidden />
          <span className="text-base font-semibold tracking-tight">
            BankOps <span className="text-brand-500">Agent Console</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="hidden sm:block">
            Operator: <strong className="text-slate-200">demo.operator</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-slate-400
                       hover:bg-white/10 hover:text-slate-200 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
