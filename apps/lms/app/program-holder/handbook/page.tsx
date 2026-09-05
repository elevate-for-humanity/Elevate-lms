import Link from 'next/link';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Program Holder Handbook | Elevate', robots: { index: false, follow: false } };

export default async function ProgramHolderHandbookPage() {
  await requireProgramHolder();
  const sections = [
    ['Student records', 'Maintain accurate enrollment, attendance, 48-hour WorkOne progress, milestones, completion evidence, and credential records for every assigned student.'],
    ['Communication', 'Contact students about attendance, deadlines, missing documents, onboarding, and career services through approved portal channels. Record meaningful follow-up notes.'],
    ['Training delivery', 'Deliver the approved curriculum, document hands-on skills, verify practical competency, and complete progress updates before the training end date.'],
    ['Documents and media', 'Upload current licenses, insurance, W-9, training plans, profile photo, and authorized student training photos or videos through protected storage.'],
    ['Privacy and security', 'Use student information only for authorized training and workforce purposes. Do not download, disclose, or share protected records outside approved systems.'],
    ['Closeout and payment', 'Complete all student back work, hour sign-offs, credential dates, required agreements, and payout verification before requesting released funds.'],
    ['Career services', 'Direct graduates to their student dashboards and Career Services feed and continue recording placement and follow-up outcomes.'],
  ];
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/program-holder/onboarding" className="text-sm font-bold text-blue-700">← Back to onboarding</Link>
        <div className="mt-5 rounded-3xl bg-slate-950 p-6 text-white sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">Required reading</p>
          <h1 className="mt-2 text-3xl font-black">Program Holder Handbook</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Operational guidelines for authorized Program Holders delivering Elevate for Humanity workforce training.</p>
        </div>
        <div className="mt-6 grid gap-4">
          {sections.map(([title, body], index) => (
            <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Section {index + 1}</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
            </section>
          ))}
        </div>
        <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-black text-amber-950">Non-compete and non-solicitation</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">The Program Holder agrees not to use Elevate confidential information, student relationships, referral sources, curriculum, or program opportunities to divert enrolled or referred participants away from Elevate or to solicit those participants for a competing training arrangement outside the authorized Program Holder relationship. This obligation applies during the relationship and for 12 months after it ends, only to the extent permitted by applicable law. It does not prohibit lawful employment or operation of an independent trade business that does not misuse Elevate information or relationships.</p>
          <p className="mt-2 text-xs font-bold text-amber-800">The signed acknowledgement records the version reviewed, signer, timestamp, IP address, and user agent.</p>
        </section>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/program-holder/onboarding" className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white">Return to sign acknowledgements</Link>
          <Link href="/legal/program-host-agreement" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-900">Read full Program Holder Agreement</Link>
        </div>
      </div>
    </main>
  );
}
