export default function Loading() {
  return (
    <main role="status" aria-live="polite" className="mx-auto max-w-3xl p-6 sm:p-10">
      <h1 className="text-2xl font-bold text-slate-950">Opening your dashboard…</h1>
      <p className="mt-3 text-lg leading-8 text-slate-700">
        Loading your saved records and available tools.
      </p>
    </main>
  );
}
