import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documented Activity | Elevate for Humanity',
  description:
    'Operational activity counts from current platform records. This page does not publish unsupported placement, wage, funding, or success-rate claims.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/impact' },
};

export const revalidate = 3600;

type ImpactStats = {
  totalEnrollments: number;
  completedPrograms: number;
  providerCompletionRecords: number;
  activePrograms: number;
  approvedHours: number;
};

async function getImpactStats(): Promise<ImpactStats | null> {
  try {
    const supabase = await createClient();
    const [enrollmentsRes, completedRes, completionRecordsRes, programsRes, hoursRes] =
      await Promise.all([
        supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
        supabase
          .from('program_enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
        supabase
          .from('program_completion_certificates')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('programs')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.from('hour_entries').select('accepted_hours').eq('status', 'approved'),
      ]);

    if (
      enrollmentsRes.error ||
      completedRes.error ||
      completionRecordsRes.error ||
      programsRes.error ||
      hoursRes.error
    ) {
      return null;
    }

    return {
      totalEnrollments: enrollmentsRes.count ?? 0,
      completedPrograms: completedRes.count ?? 0,
      providerCompletionRecords: completionRecordsRes.count ?? 0,
      activePrograms: programsRes.count ?? 0,
      approvedHours: (hoursRes.data ?? []).reduce(
        (sum, entry) => sum + (Number(entry.accepted_hours) || 0),
        0,
      ),
    };
  } catch {
    return null;
  }
}

export default async function ImpactPage() {
  const stats = await getImpactStats();

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400">
            Evidence-based reporting
          </p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Documented platform activity</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            This page reports only counts that can be read from current platform records. It does not
            turn enrollment data into placement, wage, licensure, funding, retention, or economic-impact
            claims without a defined source and methodology.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-bold">How to read these numbers</h2>
              <p className="mt-2 text-sm leading-6">
                An enrollment is not a completion. A provider completion record is not a third-party
                certification or state license. Approved apprenticeship or OJT hours are not proof of
                employment retention or wages. Each metric is labeled according to the record actually
                counted.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          {stats ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Enrollment records', stats.totalEnrollments],
                ['Completed enrollment records', stats.completedPrograms],
                ['Provider completion records', stats.providerCompletionRecords],
                ['Active program records', stats.activePrograms],
                ['Approved logged hours', stats.approvedHours],
              ].map(([label, value]) => (
                <article key={label} className="rounded-xl border border-slate-200 p-5">
                  <p className="text-3xl font-extrabold text-slate-950">
                    {Number(value).toLocaleString()}
                  </p>
                  <h2 className="mt-2 text-sm font-bold text-slate-700">{label}</h2>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
              <h2 className="font-bold">Current activity counts are temporarily unavailable</h2>
              <p className="mt-2 text-sm leading-6">
                No substitute or estimated figures are displayed when the source records cannot be
                read. This prevents stale or invented fallback metrics from being published as fact.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-14">
        <div className="mx-auto max-w-5xl grid gap-5 md:grid-cols-3">
          {[
            [
              'Employment outcomes',
              'Placement, retention, employer, wage, and earnings claims require a defined outcome dataset and reporting period. They are not inferred from enrollment or completion records.',
            ],
            [
              'Credentials and licenses',
              'Third-party certifications, registry status, examinations, and state licenses remain under the authority of the applicable external body unless a specific verified record says otherwise.',
            ],
            [
              'Funding outcomes',
              'Program funding status and participant funding authorization are separate. Neither is inferred from this activity page.',
            ],
          ].map(([title, body]) => (
            <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-14 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Review the controlling records</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Program requirements and funding status belong on the program and funding pages; consumer
          disclosures explain the limits of employment, credential, and funding claims.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/programs" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800">
            Review Programs <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/consumer-disclosures" className="rounded-lg border border-slate-300 px-6 py-3 font-bold text-slate-800 hover:bg-slate-50">
            Consumer Disclosures
          </Link>
        </div>
      </section>
    </main>
  );
}
