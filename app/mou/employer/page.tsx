import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import EmployerMOUSignForm from './EmployerMOUSignForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Employer Partnership MOU',
  description:
    `Sign your Memorandum of Understanding with ${PLATFORM_DEFAULTS.orgName} to become an official employer hiring partner.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/mou/employer' },
};

export const dynamic = 'force-dynamic';

// Fallback list used only if the DB query fails
const FALLBACK_PROGRAMS = [
  'CNA / Healthcare',
  'HVAC Technician',
  'Barber Apprenticeship',
  'Cosmetology Apprenticeship',
  'Bookkeeping & QuickBooks',
  'Peer Recovery Specialist',
];

export default async function EmployerMOUPage() {
  // Load active programs from DB for the employer to select
  let programNames: string[] = FALLBACK_PROGRAMS;
  try {
    const db = await requireAdminClient();
    const { data } = await db
      .from('programs')
      .select('title')
      .eq('is_active', true)
      .eq('published', true)
      .order('display_order', { ascending: true });
    if (data && data.length > 0) {
      programNames = data.map((p: { title: string }) => p.title);
    }
  } catch {
    // Non-fatal — fallback list used
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0e3a7d] text-white px-4 py-8 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-blue-300 mb-2">
          {PLATFORM_DEFAULTS.orgName} · Technical and Career Institute
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Employer Partnership MOU</h1>
        <p className="text-blue-200 text-sm max-w-lg mx-auto">
          Sign your Memorandum of Understanding to become an official Elevate hiring partner.
          Takes about 5 minutes. No financial obligation.
        </p>
      </div>

      {/* What you're agreeing to — above the fold */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
          {[
            { icon: '✓', title: 'No cost', body: 'This is a hiring partnership only — no fees, no financial commitment.' },
            { icon: '✓', title: 'State-funded graduates', body: 'Our graduates are trained through Indiana  — fully funded.' },
            { icon: '✓', title: '5 minutes', body: 'Fill out your info, draw your signature, download your signed MOU.' },
          ].map((item) => (
            <div key={item.title} className="space-y-1">
              <p className="text-emerald-600 font-bold text-lg">{item.icon} {item.title}</p>
              <p className="text-slate-500">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border shadow-sm p-6 sm:p-8">
          <EmployerMOUSignForm programs={programNames} />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Questions? Call Elizabeth Greene directly at{' '}
          <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-blue-600 hover:underline">{PLATFORM_DEFAULTS.supportPhone}</a>
          {' '}or email{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 hover:underline">
            elevate4humanityedu@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
