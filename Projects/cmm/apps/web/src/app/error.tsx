'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-50">
      <h1 className="text-3xl font-semibold text-white">Something went wrong</h1>
      <button
        onClick={() => reset()}
        className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
