'use client';

import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function ProgramAppointmentBanner() {
  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Appointment-Based Enrollment & Funding Process
          </p>
          <p className="mt-1 text-sm text-amber-900/90 leading-relaxed">
            Funding and eligibility are determined through an appointment with your local WorkOne /
            Indiana Career Connect office. We do not provide funding decisions by walk-in, email, or
            social media.
          </p>

          <ol className="mt-3 list-decimal pl-5 text-sm text-amber-900/90 space-y-1">
            <li>Complete our Inquiry Form</li>
            <li>
              Schedule an appointment at{' '}
              <a
                className="underline font-medium"
                href="https://www.indianacareerconnect.com"
                target="_blank"
                rel="noreferrer"
              >
                indianacareerconnect.com
              </a>
            </li>
            <li>Tell the advisor you are working with {PLATFORM_DEFAULTS.orgName}</li>
            <li>Return and complete your Next Steps Checklist so we can move you forward</li>
          </ol>
        </div>

        <div className="flex gap-2 sm:flex-col sm:min-w-[220px]">
          <Link
            href="/apply"
            className="inline-flex items-center justify-center rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Start Inquiry
          </Link>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center rounded-xl border border-amber-900/30 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Next Steps Checklist
          </Link>
        </div>
      </div>
    </div>
  );
}
