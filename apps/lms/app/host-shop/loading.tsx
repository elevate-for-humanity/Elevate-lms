export default function HostShopLoading() {
  return (
    <main aria-busy="true" className="min-h-[50vh] bg-slate-50 px-4 py-10 text-slate-950">
      <section role="status" aria-live="polite" className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-black">Loading your Host Shop page</h1>
        <p className="mt-3">Please wait while we load your saved records and form. Keep this page open until it finishes.</p>
      </section>
    </main>
  );
}
