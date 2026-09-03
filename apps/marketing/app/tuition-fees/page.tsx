import type { Metadata } from 'next';
import { Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { BARBER_PRICING } from '@/lib/programs/pricing';

export const metadata: Metadata = {
  title: 'Tuition & Fees',
  description: `Current tuition and fee information for ${PLATFORM_DEFAULTS.orgName} training programs. Funding and payment options vary by program and participant eligibility.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tuition-fees',
  },
};

export const dynamic = 'force-dynamic';

type TuitionRow = {
  name: string;
  duration: string;
  tuition: number;
  examFees: number;
  examFeesNote: string;
  materials: number;
  fundingType: string;
  total: number;
};

function withTotal(row: Omit<TuitionRow, 'total'>): TuitionRow {
  return {
    ...row,
    total: Number(row.tuition || 0) + Number(row.examFees || 0) + Number(row.materials || 0),
  };
}

export default async function TuitionFeesPage() {
  const supabase = await createClient();

  const { data: dbPrograms } = await supabase
    .from('programs')
    .select('*')
    .eq('is_active', true)
    .order('name');

  // Fallback schedule for programs whose current database record does not carry
  // a tuition amount. The barber price is intentionally imported from the same
  // source used by checkout so this page cannot drift from Stripe-facing logic.
  const STATIC_PROGRAMS: TuitionRow[] = [
    withTotal({
      name: 'Barber Apprenticeship',
      duration: 'Approximately 50 OJL weeks at 40 hours/week, plus required RTI',
      tuition: BARBER_PRICING.fullPrice,
      examFees: 0,
      examFeesNote: 'See enrollment disclosure for current licensing/exam charges and inclusions',
      materials: 0,
      fundingType: 'Registered Apprenticeship — funding eligibility varies; self-pay and payment options available',
    }),
    withTotal({
      name: 'Bookkeeping / Accounting Clerk',
      duration: '8 weeks',
      tuition: 4925,
      examFees: 0,
      examFeesNote: 'QuickBooks + MOS exams included where stated in the enrollment disclosure',
      materials: 0,
      fundingType: 'Contact admissions for current funding eligibility',
    }),
    withTotal({
      name: 'Business Management',
      duration: '5 weeks',
      tuition: 4900,
      examFees: 0,
      examFeesNote: 'See program enrollment disclosure',
      materials: 0,
      fundingType: 'Contact admissions for current funding eligibility',
    }),
    withTotal({
      name: 'CPR / AED / First Aid',
      duration: '1 day',
      tuition: 575,
      examFees: 0,
      examFeesNote: '',
      materials: 0,
      fundingType: 'Self-pay unless an eligible sponsor/funding source authorizes payment',
    }),
    withTotal({
      name: 'Emergency Health & Safety Technician',
      duration: '4 weeks',
      tuition: 4950,
      examFees: 0,
      examFeesNote: 'See program enrollment disclosure for included credentials',
      materials: 0,
      fundingType: 'Contact admissions for current funding eligibility',
    }),
    withTotal({
      name: 'Home Health Aide',
      duration: '4 weeks',
      tuition: 2500,
      examFees: 0,
      examFeesNote: 'See program enrollment disclosure',
      materials: 0,
      fundingType: 'Funding may be available to eligible participants',
    }),
    withTotal({
      name: 'HVAC Technician',
      duration: '12 weeks',
      tuition: 5000,
      examFees: 0,
      examFeesNote: 'See program enrollment disclosure for included credentials',
      materials: 0,
      fundingType: 'Contact admissions for current funding eligibility',
    }),
    withTotal({
      name: 'Medical Assistant',
      duration: 'See current program schedule',
      tuition: 4325,
      examFees: 0,
      examFeesNote: 'See program enrollment disclosure',
      materials: 0,
      fundingType: 'Contact admissions for current funding eligibility',
    }),
    withTotal({
      name: 'Professional Esthetician & Client Services',
      duration: '5 weeks',
      tuition: 4575,
      examFees: 0,
      examFeesNote: 'See program enrollment disclosure',
      materials: 0,
      fundingType: 'Contact admissions for current funding eligibility',
    }),
    withTotal({
      name: 'Public Safety Reentry Specialist',
      duration: '45 days',
      tuition: 4750,
      examFees: 0,
      examFeesNote: 'See program enrollment disclosure',
      materials: 0,
      fundingType: 'Contact admissions for current funding eligibility',
    }),
    withTotal({
      name: 'CDL Class A Training',
      duration: 'See current program schedule',
      tuition: 0,
      examFees: 0,
      examFeesNote: 'Third-party/state testing charges may apply; confirm before enrollment',
      materials: 0,
      fundingType: 'Contact admissions for current tuition and funding authorization',
    }),
  ];

  const dbMapped: TuitionRow[] = (dbPrograms || [])
    .filter((program: any) => program.tuition_cost != null && Number(program.tuition_cost) > 0)
    .map((program: any) =>
      withTotal({
        name: program.name,
        duration: program.duration_weeks
          ? `${program.duration_weeks} weeks`
          : program.duration || 'Varies',
        tuition: Number(program.tuition_cost || 0),
        examFees: Number(program.exam_fee || 0),
        examFeesNote: program.exam_fee_note || 'See current program enrollment disclosure',
        materials: Number(program.materials_cost || 0),
        fundingType: program.funding_type || 'Contact admissions for current funding eligibility',
      }),
    );

  // Database values are preferred by program name when present. Static rows fill
  // gaps rather than disappearing merely because one DB program has a price.
  const merged = new Map<string, TuitionRow>();
  for (const row of STATIC_PROGRAMS) merged.set(row.name.toLowerCase(), row);
  for (const row of dbMapped) merged.set(row.name.toLowerCase(), row);

  // Force the actual checkout price for Barber even if a stale database row has
  // not yet been corrected. This prevents public price vs checkout drift.
  const barberKey = 'barber apprenticeship';
  const existingBarber = merged.get(barberKey);
  if (existingBarber) {
    merged.set(
      barberKey,
      withTotal({
        ...existingBarber,
        tuition: BARBER_PRICING.fullPrice,
        examFees: 0,
        materials: 0,
        duration: 'Approximately 50 OJL weeks at 40 hours/week, plus required RTI',
      }),
    );
  }

  const programs = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Tuition & Fees' }]} />
        </div>
      </div>

      <section className="relative h-[200px] overflow-hidden bg-slate-100 sm:h-[280px] md:h-[340px]">
        <Image
          src="/images/pages/tuition-fees-page-1.webp"
          alt="Training tuition and fee information"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      <section className="bg-brand-blue-800 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-4xl font-black">Tuition & Fees Schedule</h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-white sm:text-xl">
            Program tuition, payment options, and public funding eligibility are separate decisions.
            Confirm the current enrollment disclosure for your selected program before committing to
            payment.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <section className="mb-8 rounded-xl border border-brand-blue-200 bg-brand-blue-50 p-6">
          <h2 className="font-bold text-slate-950">Important Information</h2>
          <ul className="mt-3 space-y-2 text-slate-800">
            <li>• Your signed enrollment agreement controls your tuition and included-cost terms.</li>
            <li>• Third-party exam/licensing charges can change and are identified separately when applicable.</li>
            <li>
              • Public funding eligibility and authorization are determined by the applicable funding
              agency; {PLATFORM_DEFAULTS.orgName} does not guarantee funding approval.
            </li>
            <li>
              • See the{' '}
              <Link href="/refund-policy" className="font-semibold text-brand-red-700 hover:underline">
                Refund Policy
              </Link>{' '}
              for cancellation and refund terms.
            </li>
          </ul>
        </section>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950 text-white">
                <th className="p-4 text-left font-bold">Program</th>
                <th className="p-4 text-left font-bold">Duration</th>
                <th className="p-4 text-right font-bold">Tuition</th>
                <th className="p-4 text-right font-bold">Separate Exam Fees*</th>
                <th className="p-4 text-right font-bold">Materials</th>
                <th className="p-4 text-right font-bold">Listed Total</th>
                <th className="p-4 text-left font-bold">Funding</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program, index) => (
                <tr key={program.name} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-4 font-semibold text-slate-950">{program.name}</td>
                  <td className="p-4 text-slate-800">{program.duration}</td>
                  <td className="p-4 text-right text-slate-950">
                    {program.tuition > 0 ? `$${program.tuition.toLocaleString()}` : 'Confirm with admissions'}
                  </td>
                  <td className="p-4 text-right text-slate-800">
                    {program.examFees > 0 ? `$${program.examFees.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-4 text-right text-slate-800">
                    {program.materials > 0 ? `$${program.materials.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-950">
                    {program.tuition > 0 ? `$${program.total.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-4 text-sm text-slate-800">{program.fundingType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-bold text-slate-950">*Third-Party Exam and Licensing Charges</h2>
          <p className="mt-3 text-slate-800">
            A certification, licensing, background-check, or testing charge is shown separately when
            the current program record identifies it as a separate charge. Your program disclosure
            is the controlling source for what is included in tuition.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-800">
            {programs
              .filter((program) => program.examFees > 0 || program.examFeesNote)
              .map((program) => (
                <li key={program.name}>
                  <strong>{program.name}:</strong> {program.examFeesNote}
                  {program.examFees > 0 ? ` — $${program.examFees.toLocaleString()}` : ''}
                </li>
              ))}
          </ul>
        </section>

        <section className="mt-12" aria-labelledby="payment-options-heading">
          <h2 id="payment-options-heading" className="text-2xl font-bold text-slate-950">
            Payment Options
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-950">Pay in Full</h3>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                Eligible self-pay programs may be paid in full through the program checkout.
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-950">Payment Plan / BNPL</h3>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                Available terms vary by program and payment provider. The checkout shows the exact
                down payment, schedule, and provider terms before payment.
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-950">Workforce Funding</h3>
              <p className="mt-2 text-sm leading-6 text-slate-800">
                Funding is program- and participant-specific and requires authorization from the
                applicable workforce or state agency before it is treated as payment.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-950">What may be included</h2>
            <p className="mt-3 text-sm leading-6 text-slate-800">
              Instruction, LMS access, course materials, career services, credentials, tools, and
              exam costs vary by program. Use the signed program disclosure rather than assuming
              every item is bundled in every tuition amount.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-950">Possible separate costs</h2>
            <p className="mt-3 text-sm leading-6 text-slate-800">
              Depending on the program or employer, separate costs can include testing/licensing,
              background checks, drug screens, transportation, or personal equipment. They must be
              disclosed when applicable.
            </p>
          </article>
        </section>

        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-slate-800">
            Questions about tuition or payment options? Call {PLATFORM_DEFAULTS.supportPhone} or use
            the contact form.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-5 text-sm">
            <Link href="/legal/disclosures" className="font-semibold text-brand-red-700 hover:underline">
              Student Disclosures
            </Link>
            <Link href="/refund-policy" className="font-semibold text-brand-red-700 hover:underline">
              Refund Policy
            </Link>
            <Link href="/legal/enrollment-agreement" className="font-semibold text-brand-red-700 hover:underline">
              Enrollment Agreement
            </Link>
          </div>
        </div>

        <section className="mt-10 rounded-2xl bg-brand-blue-800 px-6 py-10 text-center text-white sm:px-10">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to choose your program?</h2>
          <p className="mt-3 text-white">
            Apply for enrollment or contact admissions before paying if you need funding assistance.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-bold text-brand-blue-800 hover:bg-slate-100"
            >
              Apply Now
            </Link>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/\D/g, '')}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white px-6 py-3 font-bold text-white hover:bg-brand-blue-900"
            >
              <Phone className="h-4 w-4" />
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
