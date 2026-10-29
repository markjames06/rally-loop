import { AppShell } from "@/components/layout/app-shell";

export default function SessionsLoading() {
  return (
    <AppShell>
      <main aria-label="Loading open sessions" aria-live="polite" className="app-page mx-auto min-h-screen max-w-6xl px-1 sm:px-4" role="status">
        <div aria-hidden="true" className="loading-skeleton mt-8 h-8 w-56 rounded-md" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div aria-hidden="true" className="loading-skeleton h-56 rounded-xl" />
          <div aria-hidden="true" className="loading-skeleton h-56 rounded-xl" />
        </div>
      </main>
    </AppShell>
  );
}
