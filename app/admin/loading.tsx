export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl" aria-label="Loading administration">
      <div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm md:p-8">
        <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--school-primary-soft)]" />
        <div className="mt-4 h-9 w-64 max-w-full animate-pulse rounded-xl bg-[var(--school-primary-soft)]" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded-lg bg-[var(--school-primary-soft)]" />
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-[var(--school-border)] bg-[var(--school-surface)] p-6 shadow-sm">
            <div className="h-2 w-16 animate-pulse rounded-full bg-[var(--school-primary-soft)]" />
            <div className="mt-5 h-6 w-32 animate-pulse rounded-lg bg-[var(--school-primary-soft)]" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded-lg bg-[var(--school-primary-soft)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
