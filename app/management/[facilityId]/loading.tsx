import { AppShell } from "@/components/layout/app-shell";

export default function ManagementLoading() {
  return (
    <AppShell user={{}}>
      <main aria-label="Loading facility management" aria-live="polite" className="app-page mx-auto min-h-screen max-w-7xl px-1 sm:px-4" role="status">
        <div aria-hidden="true" className="loading-skeleton mt-8 h-8 w-64 rounded-md" />
        <div className="mt-8 space-y-5">
          <div aria-hidden="true" className="loading-skeleton h-56 rounded-xl" />
          <div aria-hidden="true" className="loading-skeleton h-56 rounded-xl" />
        </div>
      </main>
    </AppShell>
  );
}
