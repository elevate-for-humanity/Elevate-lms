export default function LmsLoading() {
  return (
    <main aria-busy="true" aria-live="polite" aria-label="Loading Elevate LMS" className="min-h-[50vh] bg-slate-50 px-4 py-10 text-slate-950">
      <section role="status" className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-black">Opening your dashboard…</h1>
        <p className="mt-3">Loading your saved records and available tools. Please keep this page open.</p>
      </section>
    </main>
  );
}
