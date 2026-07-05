'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const HANDBOOK_VERSION = '2025.1';

const SECTIONS = [
  {
    id: 'overview',
    title: 'Partnership Overview',
    content: `As an Elevate program-holder partner you are responsible for hosting training programs at your site, supporting enrolled students, and maintaining compliance with WIOA, DOL, and Indiana workforce development requirements.

${PLATFORM_DEFAULTS.orgName} provides curriculum, instructors, LMS access, and compliance reporting tools. You provide the training site, student recruitment support, and local coordination.

This handbook governs your responsibilities as a program holder. Review it carefully before signing your MOU.`,
  },
  {
    id: 'student-support',
    title: 'Student Support Responsibilities',
    content: `You are the first point of contact for students at your site. Your responsibilities include:

• Welcoming students and orienting them to your facility
• Tracking and reporting attendance daily
• Escalating attendance concerns (3+ absences) to your Elevate coordinator within 24 hours
• Connecting students with supportive services (transportation, childcare, housing) through your coordinator
• Maintaining a safe, professional learning environment

You are not responsible for delivering curriculum or grading — Elevate instructors handle that.`,
  },
  {
    id: 'compliance',
    title: 'WIOA and DOL Compliance',
    content: `All Elevate programs are ETPL-listed and subject to WIOA Title I performance reporting. As a program holder you must:

• Maintain accurate attendance records using the Elevate partner portal
• Submit required documentation within 48 hours of request
• Cooperate fully with DOL audits and site visits
• Report any suspected fraud, waste, or abuse immediately to compliance@${PLATFORM_DEFAULTS.canonicalDomain}
• Retain all program records for a minimum of 7 years

Failure to comply with WIOA requirements may result in suspension of your partnership and recovery of grant funds.`,
  },
  {
    id: 'data-privacy',
    title: 'Student Data and Privacy (FERPA)',
    content: `All student information is protected under FERPA. You may not share student records, grades, attendance, or personal information with any third party without written student authorization.

Permitted disclosures include: Elevate staff with a legitimate educational interest, DOL/WIOA auditors, and emergency situations involving imminent safety risk.

Use the Elevate partner portal for all record-keeping. Do not store student data in personal files, email, or external drives. Report any suspected data breach to Elevate immediately.`,
  },
  {
    id: 'reporting',
    title: 'Reporting and Documentation',
    content: `You are required to submit the following reports through the partner portal:

• Daily attendance logs (due by 5:00 PM each program day)
• Monthly student progress summaries (due by the 5th of each month)
• Incident reports (due within 24 hours of any incident)
• Quarterly outcome data (employment, credential attainment, wage gain)

Elevate provides all required templates in your partner portal. Contact your coordinator if you need assistance with any report.`,
  },
  {
    id: 'termination',
    title: 'Partnership Termination',
    content: `Either party may terminate this partnership with 30 days written notice. Elevate may terminate immediately for cause, including:

• Material breach of WIOA compliance requirements
• Failure to maintain a safe learning environment
• Misuse of student data or grant funds
• Repeated failure to submit required reports

Upon termination, you must return all Elevate materials and provide access to all student records within 5 business days.`,
  },
];

export default function PartnerHandbookPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>('overview');
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleAcknowledge() {
    if (!acknowledged) {
      setError('Please confirm you have read the handbook before continuing.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/onboarding/handbook');
        return;
      }
      await supabase.from('handbook_acknowledgments').upsert(
        {
          user_id: user.id,
          handbook_version: HANDBOOK_VERSION,
          acknowledged_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      setDone(true);
      setTimeout(() => router.push('/onboarding/school'), 1500);
    } catch {
      setError('Failed to record acknowledgment. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'School Onboarding', href: '/onboarding/school' },
              { label: 'Partner Handbook' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="bg-brand-blue-700 px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
              <BookOpen className="w-6 h-6 text-white opacity-80" />
              <h1 className="text-2xl font-bold text-white">Program-Holder Partner Handbook</h1>
            </div>
            <p className="text-blue-100 text-sm">Version {HANDBOOK_VERSION} · {PLATFORM_DEFAULTS.orgName}</p>
          </div>

          <div className="divide-y divide-slate-100">
            {SECTIONS.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() =>
                    setExpanded(expanded === section.id ? null : section.id)
                  }
                  className="w-full px-8 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{section.title}</span>
                  {expanded === section.id ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {expanded === section.id && (
                  <div className="px-8 pb-6">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50">
            {done ? (
              <div className="flex items-center gap-3 text-brand-green-700">
                <span className="w-5 h-5 rounded-full bg-brand-blue-600 inline-block flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Handbook acknowledged</p>
                  <p className="text-sm text-brand-green-600">Returning to onboarding…</p>
                </div>
              </div>
            ) : (
              <>
                <label className="flex items-start gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => {
                      setAcknowledged(e.target.checked);
                      setError('');
                    }}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-brand-blue-700 focus:ring-brand-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    I have read and understand the Program-Holder Partner Handbook (v{HANDBOOK_VERSION})
                    and agree to comply with all requirements.
                  </span>
                </label>
                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href="/onboarding/school"
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </Link>
                  <button
                    onClick={handleAcknowledge}
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-brand-blue-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-blue-800 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving…' : (
                      <>
                        Acknowledge &amp; Continue <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
