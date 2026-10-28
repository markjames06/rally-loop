export default function ManagementLoading() {
  return (
    <main
      aria-label="Loading facility management"
      aria-live="polite"
      className="app-page mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10"
      role="status"
    >
      <div className="h-12 border-b border-white/10" />
      <div className="mt-12 h-8 w-64 animate-pulse rounded bg-white/10" />
      <div className="mt-8 space-y-5">
        <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
      </div>
    </main>
  );
}
