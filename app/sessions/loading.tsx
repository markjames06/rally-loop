export default function SessionsLoading() {
  return (
    <main
      aria-label="Loading open sessions"
      aria-live="polite"
      className="mx-auto min-h-screen max-w-5xl px-5 py-10 sm:px-8"
      role="status"
    >
      <div className="h-12 border-b border-white/10" />
      <div className="mt-12 h-8 w-56 animate-pulse rounded bg-white/10" />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
      </div>
    </main>
  );
}
