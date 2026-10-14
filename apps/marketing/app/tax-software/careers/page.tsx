import type { Metadata } from 'next';
import { TaxSiteShell } from '../_components/TaxSiteShell';
import { Application } from './Application';
export const metadata: Metadata = {
  title: 'Remote Tax Preparer & Tax Office Careers | Supersonic Fast Cash',
  description:
    'Apply for remote and office-based tax work with Supersonic Fast Cash. Complete a skills assessment, system training and a final test before hiring-team review.',
  alternates: { canonical: '/tax-software/careers' },
};
export default function Careers() {
  return (
    <TaxSiteShell>
      <main>
        <section className="bg-[#082b66] px-5 py-12 text-white sm:px-10">
          <p className="text-sm font-bold uppercase">We're hiring · Supersonic Fast Cash</p>
          <h1 className="mt-4 text-4xl font-black !text-white">
            Bring your tax skills. Build your next opportunity.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8">
            Apply for office-based or remote tax work. Share your experience, complete an initial
            skills assessment and learn our system online before the final test and hiring review.
          </p>
          <a
            href="#apply"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-bold text-[#073ca2]"
          >
            Start your application →
          </a>
        </section>
        <section className="px-5 py-10 sm:px-10">
          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border p-6">
              <h2 className="text-2xl font-bold">Remote professionals</h2>
              <p className="mt-4 leading-7">
                We welcome applications from experienced tax preparers and credentialed
                professionals. Role requirements, work location eligibility, availability and
                compensation are reviewed with the hiring team. Remote work requires a private work
                area and compliance with the approved device, identity and data-security process.
              </p>
            </article>
            <article className="rounded-2xl border p-6">
              <h2 className="text-2xl font-bold">Tax-office opportunities</h2>
              <p className="mt-4 leading-7">
                Interested in working in an Indianapolis tax office? Tell us about your preparation,
                customer-service or office experience. Training enrollment does not guarantee
                employment, and an application does not activate production access.
              </p>
            </article>
          </div>
          <section className="mt-8 rounded-2xl bg-[#e7efff] p-6">
            <h2 className="text-2xl font-bold">Know the identifiers</h2>
            <p className="mt-4 leading-7">
              <strong>PTIN:</strong> generally required for individuals paid to prepare or
              substantially assist with federal returns; verify it for the calendar year when work
              is performed. <strong>EIN:</strong> a business tax identifier. <strong>EFIN:</strong>{' '}
              part of an authorized firm's electronic filing setup. Staff do not automatically need
              their own business EIN or permission to share an office EFIN.
            </p>
            <a
              href="https://www.irs.gov/tax-professionals/ptin-requirements-for-tax-return-preparers"
              className="mt-4 inline-block font-bold text-[#073ca2] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              IRS PTIN requirements →
            </a>
          </section>
          <section id="apply" className="scroll-mt-6 pt-10">
            <Application />
          </section>
        </section>
      </main>
    </TaxSiteShell>
  );
}
