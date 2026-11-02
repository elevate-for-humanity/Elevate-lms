import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
import { practiceCases } from '@/lib/tax-software/training/practice';
export const metadata: Metadata = {
  title: 'Agent Training & Practice | Supersonic Fast Cash',
  description:
    'Original Supersonic agent orientation, practice cases, review checklists and online assessment pathway.',
};
const lessons = [
  [
    'Secure setup',
    'Sign in with your own account, enable MFA, confirm your assigned office and report unexpected client access. Never share credentials.',
    'Demonstrate secure sign-in and explain how to report a privacy incident.',
  ],
  [
    'Intake and source documents',
    'Interview the client, identify missing documents, check filing-status eligibility and confirm every imported value against its source.',
    'Use Case A to identify the missing employer document before calculating.',
  ],
  [
    'Prepare and reconcile',
    'Separate gross receipts from tax-document totals; reconcile documents to the ledger without double-counting. Escalate unsupported forms or uncertain treatment.',
    'Use Case B to reconcile receipts, list expenses and explain the worksheet profit.',
  ],
  [
    'Review and authorize',
    'Review source data, calculation diagnostics, required forms and taxpayer authorization. A material change requires recalculation and renewed review.',
    'Explain what must be repeated after the corrected W-2 in Case A.',
  ],
  [
    'EPS options and fee disclosures',
    'Explain the difference between optional Refund Transfers and advance loans. Use current provider agreements, quote all fees and obtain required consents through the approved process.',
    'Use Case C to explain net proceeds without promising a refund or loan approval.',
  ],
  [
    'Filing handoff and corrections',
    'An export is a handoff artifact. It does not prove transmission, IRS acceptance or EPS funding. Follow the approved office filing workflow and match acknowledgments to the correct return.',
    'Investigate the fictional rejection in Case C and describe the correction and resubmission record.',
  ],
  [
    'Daily office reconciliation',
    'Reconcile prepared, exported, transmitted, rejected and accepted returns separately. Match payments and bank disbursements to provider evidence.',
    'Explain why twenty prepared returns with twelve acceptance acknowledgments means twelve accepted returns.',
  ],
  [
    'Supervisor readiness review',
    'Complete the online knowledge checks and final assessment, then demonstrate a full practice workflow to a supervisor. Access to real clients requires a separate hiring and office-assignment decision.',
    'Demonstrate intake, preparation, review, fee explanation, handoff and correction using fictional documents.',
  ],
];
export default function Training() {
  return (
    <TaxSiteShell>
      <main>
        <section className="px-6 py-12 sm:px-10 lg:px-14">
          <p className="text-sm font-bold uppercase tracking-wide text-[#073ca2]">
            Supersonic Fast Cash · Agent learning center
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Learn the workflow. Practice before serving clients.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8">
            Follow eight focused lessons, complete original practice cases and review your work with
            a supervisor. Your signed-in application connects to online knowledge checks and saved
            module progress.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/tax-software/careers#apply"
              className={taxButton + ' bg-[#073ca2] text-white'}
            >
              Apply / continue saved training →
            </Link>
            <Link href="#practice" className={taxButton + ' border'}>
              Explore practice cases
            </Link>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            These public exercises do not save progress or submit returns. Use fictional information
            only. Internal orientation does not award IRS continuing education credit or authorize
            taxpayer access.
          </p>
        </section>
        <section
          aria-label="Agent learning path"
          className="grid gap-5 px-6 pb-12 sm:grid-cols-2 sm:px-10 lg:px-14"
        >
          {lessons.map(([title, content, task], i) => (
            <article key={title} className="rounded-2xl border p-6">
              <p className="text-sm font-bold text-[#073ca2]">
                LESSON {i + 1} OF {lessons.length}
              </p>
              <h2 className="mt-3 text-2xl font-bold">{title}</h2>
              <p className="mt-4 leading-7">{content}</p>
              <p className="mt-4 rounded-lg bg-slate-50 p-4 leading-7">
                <strong>Demonstrate:</strong> {task}
              </p>
            </article>
          ))}
        </section>
        <section id="practice" className="scroll-mt-6 px-6 pb-14 sm:px-10 lg:px-14">
          <h2 className="text-3xl font-black">Practice lab · fictional documents only</h2>
          <p className="mt-4 leading-7">
            Work each case first, then compare with the review notes. These are Supersonic training
            exercises, separate from official IRS ATS scenarios.
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {practiceCases.map((c) => (
              <article key={c.title} className="min-w-0 rounded-2xl border p-6">
                <h3 className="text-xl font-bold">{c.title}</h3>
                <p className="mt-2 font-semibold">{c.name}</p>
                {c.documents.map(([title, body]) => (
                  <p key={title} className="mt-4 break-words leading-7">
                    <strong>{title}:</strong> {body}
                  </p>
                ))}
                <ol className="mt-5 list-decimal space-y-3 pl-5">
                  {c.tasks.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ol>
                <details className="mt-6 rounded-xl bg-slate-50 p-4">
                  <summary className="cursor-pointer py-2 font-bold">Compare your work</summary>
                  <p className="mt-3 leading-7">{c.key}</p>
                </details>
              </article>
            ))}
          </div>
          <Link
            href="/tax-software/careers#apply"
            className={taxButton + ' mt-8 bg-[#c8102e] text-white'}
          >
            Start your application and saved assessments →
          </Link>
        </section>
      </main>
    </TaxSiteShell>
  );
}
