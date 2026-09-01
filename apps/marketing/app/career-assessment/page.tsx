import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Interest Assessment',
  description:
    'Discover which career training programs match your interests. Take the free O*NET Interest Profiler — powered by the U.S. Department of Labor.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-assessment' },
};

export default function CareerAssessmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold text-brand-blue-300 uppercase tracking-widest mb-3">
            Free Career Tool
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Career Interest Assessment
          </h1>
          <p className="text-slate-300 text-base max-w-xl mx-auto">
            Answer a few questions to discover which career training programs match your strengths
            and interests. Powered by the U.S. Department of Labor O*NET system.
          </p>
        </div>
      </section>

      <section className="py-10 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900">Start the official O*NET profiler</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Complete the free assessment on My Next Move, the public career-exploration service
            sponsored by the U.S. Department of Labor. Return here afterward to compare your results
            with Elevate training programs.
          </p>
          <a
            href="https://www.mynextmove.org/explore/ip"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-600"
          >
            Take the career assessment
          </a>
          <p className="mt-4 text-sm text-slate-500">
            ¿Prefiere español? Use the language options provided by My Next Move.
          </p>
        </div>
      </section>

      {/* O*NET Attribution — required by license */}
      <section className="py-8 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="https://services.onetcenter.org/"
            target="_blank"
            rel="noopener noreferrer"
            title="This site incorporates information from O*NET Web Services. Click to learn more."
          >
            <img
              src="https://www.onetcenter.org/image/link/onet-in-it.svg"
              alt="O*NET in-it"
              width={130}
              height={60}
              style={{ border: 'none' }}
            />
          </a>
          <p className="text-xs text-slate-500 max-w-xl">
            This site incorporates information from{' '}
            <a
              href="https://services.onetcenter.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              O*NET Web Services
            </a>{' '}
            by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA).
            O*NET® is a trademark of USDOL/ETA.
          </p>
        </div>
      </section>
    </div>
  );
}
