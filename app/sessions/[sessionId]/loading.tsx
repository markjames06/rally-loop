export default function SessionLoading() {
  return (
    <main
      aria-label="Loading session details"
      aria-live="polite"
      className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8"
      role="status"
    >
      <div className="h-12 border-b border-white/10" />
      <div className="mt-12 h-8 w-64 animate-pulse rounded bg-white/10" />
      <div className="mt-6 h-64 animate-pulse rounded-3xl bg-white/5" />
    </main>
  );
}
