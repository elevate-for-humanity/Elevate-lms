"use client";

import { Shield, ExternalLink, Calendar } from 'lucide-react';

/**
 * Verified Credentials Component
 *
 * Shows REAL credentials with REAL numbers
 * Every claim is verifiable
 */
export function VerifiedCredentials() {
  const credentials = [
    {
      agency: 'U.S. Department of Labor',
      credential: 'Registered Apprenticeship Sponsor',
      id: 'RAPIDS ID: 2025-IN-132301',
      date: 'Registered: 2025',
      verifyUrl: 'https://www.apprenticeship.gov/apprenticeship-finder',
      verifyText: 'Verify on apprenticeship.gov',
    },
    {
      agency: 'Indiana Department of Workforce Development',
      credential: 'Approved Training Provider',
      id: 'INTraining Location ID: 10004621',
      date: 'Active Provider',
      verifyUrl: 'https://www.in.gov/dwd/',
      verifyText: 'Verify on in.gov/dwd',
    },
    {
      agency: 'WIOA Eligible Training Provider',
      credential: 'Listed on Indiana ETPL',
      id: 'Location ID: 10004621',
      date: 'Current Status: Active',
      verifyUrl: 'https://www.in.gov/dwd/etpl',
      verifyText: 'Verify on ETPL database',
    },
  ];

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-semibold">Verified Credentials</span>
          </div>
          <h2 className="text-3xl font-bold text-black mb-4">
            Official Approvals & Registrations
          </h2>
          <p className="text-black max-w-2xl mx-auto">
            Every credential listed below can be independently verified through
            government databases.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {credentials.map((cred, index) => (
            <div
              key={index}
              className="bg-white border-2 border-slate-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <Shield className="h-10 w-10 text-green-600 flex-shrink-0" />
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>

              <h3 className="font-bold text-black mb-2">{cred.agency}</h3>

              <p className="text-sm text-black mb-4">{cred.credential}</p>

              <div className="bg-slate-50 rounded p-3 mb-3">
                <p className="text-sm font-mono font-semibold text-black">
                  {cred.id}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <Calendar className="h-3 w-3" />
                <span>{cred.date}</span>
              </div>

              <a
                href={cred.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
              >
                {cred.verifyText}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/accreditation"
            className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
          >
            View Full Accreditation Details
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
