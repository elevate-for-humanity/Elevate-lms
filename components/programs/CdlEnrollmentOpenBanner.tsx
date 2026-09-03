import Link from 'next/link';
import { Calendar, ExternalLink, Mail } from 'lucide-react';
import { ICC_URL } from '@/lib/page-design-tokens';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const WORKONE_LOCATOR_URL = 'https://www.workone.in.gov/';
const ENROLL_EMAIL = 'elevate4humanityedu@gmail.com';

/**
 * CDL program enrollment-open announcement (WIOA / WorkOne pathway).
 */
export default function CdlEnrollmentOpenBanner() {
  return (
    <div className="rounded-2xl border-2 border-brand-green-600 bg-brand-green-50 p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-green-800 mb-2">
        Now enrolling
      </p>
      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
        CDL Class A training is open for enrollment
      </h2>
      <p className="text-slate-700 text-sm sm:text-base leading-relaxed mb-4">
        <strong>Funding may be available if you qualify</strong> through WIOA and Indiana workforce
        programs. Most students start by creating an Indiana Career Connect account and scheduling a
        WorkOne appointment — then our team helps you complete enrollment with{' '}
        {PLATFORM_DEFAULTS.orgName}.
      </p>

      <ol className="space-y-3 text-sm text-slate-800 mb-5 list-decimal list-inside marker:font-bold">
        <li>
          <span className="font-semibold">Create your Indiana Career Connect account</span> at{' '}
          <a
            href={ICC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue-700 font-semibold underline inline-flex items-center gap-1"
          >
            indianacareerconnect.com
            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
          </a>
          .
        </li>
        <li>
          <span className="font-semibold">Schedule a WorkOne appointment</span> through Indiana
          Career Connect (or visit your nearest WorkOne office if you need help booking).
        </li>
        <li>
          At your appointment, tell your advisor you are enrolling with{' '}
          <strong>{PLATFORM_DEFAULTS.orgName}</strong> for <strong>CDL training</strong>.
        </li>
        <li>
          <span className="font-semibold">Email us your appointment date</span> at{' '}
          <a href={`mailto:${ENROLL_EMAIL}`} className="text-brand-blue-700 font-semibold underline">
            {ENROLL_EMAIL}
          </a>{' '}
          so we can follow up and keep your file active.
        </li>
        <li>
          <span className="font-semibold">Submit your application</span> on our site when you are
          ready to enroll.
        </li>
      </ol>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <Link
          href="/apply?program=cdl-training"
          className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors"
        >
          Apply for CDL Training
        </Link>
        <a
          href={ICC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-900 font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
        >
          <Calendar className="w-4 h-4" aria-hidden />
          Indiana Career Connect
        </a>
        <a
          href={WORKONE_LOCATOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-900 font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
        >
          Find a WorkOne office
        </a>
        <a
          href={`mailto:${ENROLL_EMAIL}?subject=CDL%20WorkOne%20appointment%20date`}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
        >
          <Mail className="w-4 h-4" aria-hidden />
          Email appointment date
        </a>
      </div>

      <p className="text-xs text-slate-600 mt-4 leading-relaxed">
        Having trouble scheduling online? Visit the nearest WorkOne office in person, mention{' '}
        {PLATFORM_DEFAULTS.orgName}, and ask to schedule an appointment for CDL / WIOA funding.
        Questions: {PLATFORM_DEFAULTS.supportPhone} or {ENROLL_EMAIL}.
      </p>
    </div>
  );
}
