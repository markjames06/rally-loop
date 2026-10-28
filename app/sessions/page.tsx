import Link from "next/link";
import { ArrowRight, CircleDot } from "lucide-react";

import { SessionCard } from "@/components/sessions/session-card";
import { hasEnvVars } from "@/shared/lib/utils";
import { createClient } from "@/server/supabase/server";
import { loadOpenSessions } from "@/server/sessions/queries";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  if (!hasEnvVars) {
    return (
      <main className="app-page mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8">
        <PageHeader />
        <p className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">
          Open sessions will appear here after Supabase is configured and the
          Phase 2 migration is applied.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const result = await loadOpenSessions(supabase);

  return (
    <main className="app-page mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8">
      <PageHeader />
      <section className="py-10 sm:py-12">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#e6edd9] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#45602c]">
          <CircleDot aria-hidden="true" className="size-3.5" />
          Find your next game
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Open sessions
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Browse active sessions, find a game, and follow queue and match
          updates as they happen.
        </p>

        {result.data === null ? (
          <p
            className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-5 text-sm text-rose-100"
            role="alert"
          >
            Open sessions could not be loaded. Refresh the page to try again.
          </p>
        ) : result.data.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <h2 className="font-bold text-white">No open sessions right now</h2>
            <p className="mt-2 text-sm text-slate-400">
              Check back later or ask your facility administrator about the
              next session.
            </p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {result.data.map((summary) => (
              <li key={summary.session.id}>
                <SessionCard summary={summary} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function PageHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 pb-5">
      <Link
        aria-label="RallyLoop home"
        className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight"
        href="/"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-[#c4e65d] text-[#19251e]">
          <CircleDot aria-hidden="true" className="size-5" strokeWidth={2.5} />
        </span>
        RallyLoop
      </Link>
      <Link
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d6ddcd] bg-white px-4 text-sm font-bold text-[#365323] transition hover:bg-[#f5f8ee]"
        href="/login"
      >
        Sign in
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </header>
  );
}
