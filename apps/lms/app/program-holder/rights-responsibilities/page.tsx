import Link from 'next/link';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Program Holder Responsibilities | Elevate',
  robots: { index: false },
};

export default async function RightsResponsibilitiesPage() {
  await requireProgramHolder();
  const responsibilities = [
    [
      'Contact assigned applicants',
      'Call each assigned applicant promptly, explain the next steps, record the outcome, and help the applicant complete enrollment.',
    ],
    [
      'Deliver only assigned programs',
      'Use the approved curriculum, courses, credentials, schedule, and requirements shown in this portal. Never substitute another program’s requirements.',
    ],
    [
      'Maintain verified records',
      'Record attendance, instruction, assessments, practical evidence, progress, barriers, accommodations, and completion accurately and on time.',
    ],
    [
      'Protect learners',
      'Maintain qualified staff, safe facilities, required licenses and insurance, nondiscrimination, accessibility, privacy, and appropriate complaint escalation.',
    ],
    [
      'Complete payment setup',
      'Submit a correct W-9 and business records, connect and verify the payout account, and complete student closeout before requesting payment.',
    ],
  ];
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-black uppercase tracking-widest text-blue-700">
        Program Holder agreement
      </p>
      <h1 className="mt-2 text-3xl font-black">Rights and responsibilities</h1>
      <p className="mt-3 text-slate-700">
        These duties follow the live portal workflow and apply only to programs assigned to this
        Program Holder.
      </p>
      <div className="mt-6 grid gap-4">
        {responsibilities.map(([title, body]) => (
          <section key={title} className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
          </section>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/program-holder/documents"
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white"
        >
          Sign acknowledgements
        </Link>
        <a
          href="https://www.elevateforhumanity.org/legal/program-host-agreement"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border px-5 py-3 text-sm font-black"
        >
          Full agreement
        </a>
      </div>
    </main>
  );
}
