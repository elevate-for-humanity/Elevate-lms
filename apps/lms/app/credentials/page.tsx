'use client';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Award, Download, ExternalLink, Clock, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Credentials | Elevate for Humanity',
  description: 'View and download your earned certifications and credentials.',
};

const earnedCredentials = [
  {
    name: 'CNA Certification',
    issuer: 'Indiana State Department of Health',
    dateEarned: 'June 15, 2026',
    expirationDate: 'June 15, 2028',
    credentialId: 'IN-CNA-2026-12345',
    status: 'active',
  },
  {
    name: 'CPR/BLS Certification',
    issuer: 'American Heart Association',
    dateEarned: 'June 15, 2026',
    expirationDate: 'June 15, 2028',
    credentialId: 'AHA-CPR-2026-98765',
    status: 'active',
  },
];

const availableCredentials = [
  { name: 'Alzheimer\'s Care Certificate', program: 'CNA Training', examUrl: '/exams/alzheimers' },
  { name: 'Medication Administration', program: 'QMA Program', examUrl: '/exams/medication' },
  { name: 'EPA 608 Universal', program: 'HVAC Technician', examUrl: '/exams/epa608' },
];

export default function CredentialsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[{ label: 'My Credentials' }]} />
      
      {/* Hero */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">My Credentials</h1>
              <p className="text-slate-600 mt-1">View and download your earned certifications.</p>
            </div>
            <Award className="w-12 h-12 text-brand-blue-600" />
          </div>
        </div>
      </section>

      {/* Earned Credentials */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-lg font-bold text-black mb-4">Earned Credentials</h2>
          {earnedCredentials.length > 0 ? (
            <div className="space-y-4">
              {earnedCredentials.map((cred) => (
                <div key={cred.credentialId} className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-brand-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-black">{cred.name}</h3>
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-green-100 text-brand-green-700 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">Issued by: {cred.issuer}</p>
                        <div className="flex items-center gap-6 mt-3 text-sm text-slate-500">
                          <span>Earned: {cred.dateEarned}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires: {cred.expirationDate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Credential ID: {cred.credentialId}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 transition-colors text-sm">
                        <ExternalLink className="w-4 h-4" />
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">No Credentials Yet</h3>
              <p className="text-slate-500 mb-4">Complete your program requirements to earn credentials.</p>
              <Link href="/lms/programs" className="inline-block bg-brand-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-blue-700">
                View My Programs
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Available Credentials */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-lg font-bold text-black mb-4">Available Certifications</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Certification</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Program</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {availableCredentials.map((cred) => (
                  <tr key={cred.name}>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{cred.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{cred.program}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={cred.examUrl} className="text-brand-blue-600 font-medium hover:text-brand-blue-700">
                        Schedule Exam →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Share Credentials */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-brand-blue-900 mb-2">Share Your Credentials</h3>
            <p className="text-sm text-brand-blue-800 mb-4">
              Add your credentials to LinkedIn or download a PDF to share with employers.
            </p>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-[#0077B5] text-white font-medium rounded-lg hover:bg-[#00619b] transition-colors text-sm">
                Add to LinkedIn
              </button>
              <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
