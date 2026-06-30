export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Career Interest Assessment',
  description:
    'Discover which career training programs match your interests. Take the free O*NET Interest Profiler — powered by the U.S. Department of Labor.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-assessment' },
};

const ONET_API_KEY = process.env.ONET_API_KEY ?? '';

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
        {ONET_API_KEY ? (
          <>
            {/* O*NET Interest Profiler widget */}
            <Script
              src={`https://services.onetcenter.org/embed/onet-ip.js?x-api-key=${ONET_API_KEY}`}
              strategy="afterInteractive"
            />
            <div className="embed-onet-ip" />

            {/* Spanish version */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 mb-2">¿Prefiere español?</p>
              <div className="embed-onet-ip-es" />
            </div>
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <p className="text-amber-800 font-semibold mb-2">Assessment temporarily unavailable</p>
            <p className="text-amber-700 text-sm">
              Please check back shortly or{' '}
              <a href="/contact" className="underline">
                contact us
              </a>{' '}
              for program guidance.
            </p>
          </div>
        )}
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
            {/* IMAGE-CONTRACT: allow raw img because legacy markup */}
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
