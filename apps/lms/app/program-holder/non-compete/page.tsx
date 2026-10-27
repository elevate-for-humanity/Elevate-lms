import Link from 'next/link';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Non-Compete and Non-Solicitation | Elevate',
  robots: { index: false },
};

export default async function NonCompetePage() {
  await requireProgramHolder();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-black uppercase tracking-widest text-amber-700">
        Required agreement
      </p>
      <h1 className="mt-2 text-3xl font-black">
        Confidentiality, non-solicitation, and limited non-compete terms
      </h1>
      <div className="mt-6 space-y-4">
        {[
          [
            'Protected relationships',
            'Do not divert Elevate-assigned applicants, enrolled learners, referral partners, funders, employers, or Host Shops into an outside competing arrangement using access obtained through Elevate.',
          ],
          [
            'Protected information',
            'Do not copy or misuse confidential curriculum, pricing, funding records, learner records, credentials, referral lists, operating procedures, or portal data.',
          ],
          [
            'Independent business activity',
            'These terms do not prohibit lawful work or operation of an independent business that does not misuse Elevate information or relationships.',
          ],
          [
            'Duration and enforceability',
            'Relationship-protection duties apply during the Program Holder relationship and for 12 months afterward, only to the extent permitted by controlling law. Confidentiality and learner-privacy duties continue as required by law and contract.',
          ],
          [
            'Remedies and reporting',
            'Report suspected misuse, conflicts, or unauthorized disclosures promptly. Elevate may suspend access while investigating and may use available contractual or legal remedies.',
          ],
        ].map(([title, body]) => (
          <section key={title} className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
        This portal summary is incorporated into the Program Holder agreement. Review the full
        agreement before signing.
      </p>
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
          Open full agreement
        </a>
      </div>
    </main>
  );
}
