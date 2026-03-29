import Link from 'next/link';

/**
 * Shown when a published program page is missing required DB relations.
 * Prevents empty-section renders while the program is being built out.
 */
export function ProgramComingSoon({ title, slug }: { title: string; slug: string }) {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">
          Coming Soon
        </p>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          We&apos;re finishing the details for this program. Check back soon or contact us to learn more.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/contact?program=${slug}`}
            className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Get Notified
          </Link>
          <Link
            href="/programs"
            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View All Programs
          </Link>
        </div>
      </div>
    </main>
  );
}
