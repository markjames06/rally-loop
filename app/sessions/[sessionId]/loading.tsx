import { AppShell } from "@/components/layout/app-shell";

export default function SessionLoading() {
  return (
    <AppShell>
      <main aria-label="Loading session details" aria-live="polite" className="app-page mx-auto min-h-screen max-w-5xl px-1 sm:px-4" role="status">
        <div aria-hidden="true" className="loading-skeleton mt-8 h-8 w-64 rounded-md" />
        <div aria-hidden="true" className="loading-skeleton mt-6 h-64 rounded-xl" />
      </main>
    </AppShell>
  );
}
