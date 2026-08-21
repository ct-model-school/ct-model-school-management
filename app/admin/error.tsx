"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-[var(--school-border)] bg-[var(--school-surface)] p-8 text-center shadow-sm md:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.16em] theme-primary">Administration</p>
        <h1 className="mt-3 text-2xl font-bold text-[var(--school-text)]">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--school-muted)]">
          The administration section could not finish loading this page. Your existing data and settings were not changed by this screen.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-xl px-5 py-3 text-sm font-bold theme-primary-bg"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
