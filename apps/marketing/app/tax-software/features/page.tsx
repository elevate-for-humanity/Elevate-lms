import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
export const metadata: Metadata = {
  title: 'Your Online Tax Workspace | Supersonic Fast Cash',
  description:
    'See how guided questions, income-document confirmation, saved return information and review steps support tax preparation.',
  alternates: { canonical: '/tax-software/features' },
};
export default function Features() {
  return (
    <TaxSiteShell>
      <main>
        <section className="grid gap-9 bg-[#082b66] px-6 py-14 !text-white sm:px-10 lg:grid-cols-[1.2fr_1fr] lg:px-14">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest !text-white">
              Your online preparation workspace
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight !text-white sm:text-5xl">
              Bring your information together.
              <br />
              Know what needs review.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 !text-white">
              Guided questions, income-document checks and saved return information help you work
              through preparation one step at a time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tax-software/self-file"
                className={taxButton + ' bg-[#c8102e] !text-white'}
              >
                Open my tax workspace →
              </Link>
              <Link
                href="/tax-software/demo"
                className={taxButton + ' border border-white/50 !text-white'}
              >
                See the preparation steps
              </Link>
            </div>
          </div>
          <aside className="self-center rounded-2xl bg-white p-7 text-slate-950">
            <h2 className="text-xl font-black">Your preparation, in order</h2>
            <ol className="mt-5 space-y-4">
              {[
                'Confirm your tax year and household',
                'Add and verify income documents',
                'Review your information and estimate',
                'Resolve questions before filing arrangements',
              ].map((text, i) => (
                <li
                  key={text}
                  className="flex gap-4 border-b border-slate-100 pb-4 text-sm leading-7"
                >
                  <span className="font-black text-[#c8102e]">0{i + 1}</span>
                  {text}
                </li>
              ))}
            </ol>
          </aside>
        </section>
        <section className="px-6 py-14 sm:px-10 lg:px-14">
          <h2 className="text-3xl font-black">What the workspace helps you do.</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {[
              [
                'Answer guided questions',
                'Work through household, income, deductions and credit questions. Review the information you enter rather than treating automated guidance as a filing decision.',
              ],
              [
                'Check income-document details',
                'Upload supported documents, then compare extracted fields against the originals before using them in preparation. Request help when a document is missing or unclear.',
              ],
              [
                'Save and review your return information',
                'Keep preparation progress connected to your account. Review entered data, calculations and any identified preparation charges as your return changes.',
              ],
              [
                'Identify the next review step',
                'Resolve missing information and questions before arranging final preparation and filing. An estimate or saved worksheet does not establish IRS acceptance.',
              ],
            ].map(([title, body]) => (
              <article key={title} className="border-t-4 border-[#073ca2] pt-5">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-4 leading-8 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="mx-6 mb-14 rounded-2xl bg-[#f0f5ff] p-8 sm:mx-10 lg:mx-14">
          <h2 className="text-2xl font-black">
            Preparation and electronic filing are separate steps.
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            This workspace does not currently submit returns to the IRS or process bank products.
            For return types, complex issues or filing arrangements that need professional help,
            contact our team before paying for services.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tax-software/contact" className={taxButton + ' bg-[#082b66] !text-white'}>
              Get professional help →
            </Link>
            <Link
              href="/tax-software/pricing"
              className={taxButton + ' border border-[#082b66] !text-[#082b66]'}
            >
              Review pricing
            </Link>
          </div>
        </section>
      </main>
    </TaxSiteShell>
  );
}
