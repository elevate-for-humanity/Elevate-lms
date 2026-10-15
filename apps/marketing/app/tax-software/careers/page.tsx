import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
import { TaxHero } from '../_components/TaxHero';
import { Application } from './Application';
export const metadata: Metadata = {
  title: 'Remote Tax Preparer & Tax Office Careers | Supersonic Fast Cash',
  description:
    'Explore office and remote tax work, understand the requirements, and complete your application, skills assessment and online system training with Supersonic Fast Cash.',
  alternates: { canonical: '/tax-software/careers' },
  openGraph: {
    images: [
      {
        url: '/images/tax/supersonic-tax-training-2026.webp',
        alt: 'Professionals learning a financial workflow together',
      },
    ],
  },
};
export default async function Careers({
  searchParams,
}: {
  searchParams: Promise<{ work?: string }>;
}) {
  const { work } = await searchParams;
  const preference = work === 'office' || work === 'either' ? work : 'remote';
  return (
    <TaxSiteShell>
      <main>
        <TaxHero
          eyebrow="We're hiring · Office & remote opportunities"
          title={
            <>
              Work with
              <br />
              Supersonic Fast Cash.
            </>
          }
          description="Bring your tax experience, explore work in an Indianapolis tax office, or find the training path that helps you get started. See what the role involves before you apply."
          image="/images/tax/supersonic-tax-training-2026.webp"
          imageAlt="Tax professionals reviewing a workflow together at a laptop"
        >
          <Link href="#opportunities" className={taxButton + ' bg-[#c8102e] !text-white'}>
            Find my opportunity →
          </Link>
          <Link
            href="#hiring-process"
            className={taxButton + ' border border-white/50 !text-white'}
          >
            How hiring works
          </Link>
        </TaxHero>
        <div className="grid divide-y divide-blue-100 border-b border-blue-100 bg-[#f0f5ff] px-6 text-sm font-semibold text-[#082b66] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <p className="py-5 sm:pr-6">Choose office-based or remote work</p>
          <p className="py-5 sm:px-6">Learn our system online</p>
          <p className="py-5 sm:pl-6">Hiring decisions reviewed by our team</p>
        </div>
        <section id="opportunities" className="scroll-mt-6 px-6 py-14 sm:px-10 lg:px-14">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#c8102e]">
            Start with your experience
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Where do you see yourself?</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            You can tell us your work preference in one application. New to tax preparation? Explore
            the education pathway before applying for a preparer role.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <article className="flex flex-col rounded-2xl border border-slate-200 p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-[#073ca2]">
                Experienced professionals
              </p>
              <h3 className="mt-3 text-2xl font-black">Remote tax work</h3>
              <p className="mt-4 leading-7 text-slate-600">
                For preparers and credentialed professionals interested in supporting clients from
                an approved private work environment.
              </p>
              <ul className="my-6 space-y-3 text-sm leading-6">
                <li>Tax experience and credentials reviewed</li>
                <li>Secure device and private workspace requirements</li>
                <li>Location eligibility and availability discussed with you</li>
              </ul>
              <Link
                href="/tax-software/careers?work=remote#apply"
                className={taxButton + ' mt-auto bg-[#082b66] !text-white'}
              >
                Apply for remote work →
              </Link>
            </article>
            <article className="flex flex-col rounded-2xl border border-slate-200 p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-[#073ca2]">
                Indianapolis opportunities
              </p>
              <h3 className="mt-3 text-2xl font-black">Tax-office work</h3>
              <p className="mt-4 leading-7 text-slate-600">
                Interested in preparation, client service or office support? Tell us what you have
                done and where you want to contribute.
              </p>
              <ul className="my-6 space-y-3 text-sm leading-6">
                <li>Share preparation or customer-service experience</li>
                <li>Discuss office availability and role requirements</li>
                <li>Complete system orientation before access is approved</li>
              </ul>
              <Link
                href="/tax-software/careers?work=office#apply"
                className={taxButton + ' mt-auto bg-[#c8102e] !text-white'}
              >
                Apply for tax-office work →
              </Link>
            </article>
            <article className="flex flex-col rounded-2xl bg-[#f0f5ff] p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-[#073ca2]">
                New to taxes?
              </p>
              <h3 className="mt-3 text-2xl font-black">Start with training</h3>
              <p className="mt-4 leading-7 text-slate-600">
                Explore bookkeeping and accounting with tax preparation, or business administration
                if your goal is to start your own business.
              </p>
              <ul className="my-6 space-y-3 text-sm leading-6">
                <li>Understand the education pathway</li>
                <li>Ask about WorkOne funding eligibility</li>
                <li>Keep class enrollment and job applications separate</li>
              </ul>
              <Link
                href="/tax-software/professional#training-paths"
                className={taxButton + ' mt-auto border border-[#082b66] bg-white !text-[#082b66]'}
              >
                Explore tax training →
              </Link>
            </article>
          </div>
          <p className="mt-6 text-sm leading-7 text-slate-600">
            The hiring team will confirm available roles, work location, compensation and employee
            or contractor terms with you. An application or course enrollment is not a job offer.
          </p>
        </section>
        <section
          id="hiring-process"
          className="scroll-mt-6 bg-[#082b66] px-6 py-14 !text-white sm:px-10 lg:px-14"
        >
          <p className="text-xs font-extrabold uppercase tracking-widest !text-white">
            Your path through hiring
          </p>
          <h2 className="mt-3 text-3xl font-black !text-white sm:text-4xl">
            Know what happens next.
          </h2>
          <ol className="mt-9 grid gap-x-7 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {[
              [
                'Apply',
                'Create or sign in to your account. Share your experience and work preference.',
              ],
              [
                'Take the skills test',
                'Complete the initial assessment so you know what to focus on during training.',
              ],
              [
                'Learn our system',
                'Work through eight online lessons and fictional practice documents.',
              ],
              [
                'Pass the final test',
                'Complete the lessons and earn at least 80% on the final system assessment.',
              ],
              [
                'Complete hiring review',
                'Our team reviews your practical work, credentials and onboarding requirements before any offer or access.',
              ],
            ].map(([title, body], i) => (
              <li key={title} className="border-t border-white/30 pt-5">
                <span className="text-sm font-bold !text-white">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold !text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 !text-white">{body}</p>
              </li>
            ))}
          </ol>
          <Link href="#apply" className={taxButton + ' mt-9 bg-white !text-[#082b66]'}>
            Start my application →
          </Link>
        </section>
        <section className="px-6 py-14 sm:px-10 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#c8102e]">
                Before you apply
              </p>
              <h2 className="mt-3 text-3xl font-black">Be ready for the responsibility.</h2>
              <p className="mt-5 leading-8 text-slate-600">
                Tax work involves private financial information. We review professional readiness
                and the ability to follow a secure, accurate client workflow.
              </p>
              <ul className="mt-6 space-y-4 leading-7">
                <li>
                  <strong>Preparation credentials:</strong> a current PTIN when required for paid
                  preparation, plus any credentials applicable to your role.
                </li>
                <li>
                  <strong>Work habits:</strong> careful document review, clear client communication
                  and willingness to complete system training.
                </li>
                <li>
                  <strong>Remote readiness:</strong> a private work area and compliance with
                  approved device and security requirements.
                </li>
              </ul>
            </div>
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <h3 className="text-2xl font-black">Your hiring document checklist</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Start with your experience summary. If you advance, the hiring team will explain how
                and when to provide these items privately.
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-7">
                <li>□ PTIN and professional credential verification, when applicable</li>
                <li>□ References and interview information</li>
                <li>□ Separate background-screening disclosure and written authorization</li>
                <li>□ Offer, compensation and work classification documents</li>
                <li>□ I-9 and W-4 for employees, or W-9 for contractors, as applicable</li>
                <li>□ Confidentiality, security and remote-work acknowledgments</li>
              </ul>
              <p className="mt-5 text-xs leading-6 text-slate-600">
                Only provide these documents when the hiring team sends approved private instructions.
                Do not upload identity, banking or background documents into this application.
              </p>
            </aside>
          </div>
        </section>
        <section className="border-y border-slate-200 px-6 py-12 sm:px-10 lg:px-14">
          <h2 className="text-3xl font-black">A few things to know.</h2>
          <div className="mt-6 divide-y divide-slate-200">
            {[
              [
                'Do I need an EIN to apply?',
                'For an individual paid preparer, the relevant identifier is generally a PTIN. An EIN identifies a business; an EFIN relates to an authorized firm’s electronic filing setup. The hiring team verifies the requirements for your role.',
              ],
              [
                'Is this the same as enrolling in a tax class?',
                'No. The application and internal system orientation are part of the hiring process. The education pathways on our training page have their own enrollment and funding steps.',
              ],
              [
                'Does passing the test mean I am hired?',
                'No. An 80% final score completes the online assessment requirement. Practical review, credentials, screening, documentation and a hiring decision remain separate.',
              ],
              [
                'When will I discuss pay and my schedule?',
                'The hiring team will discuss role availability, compensation, schedule, work location and classification with you before you accept an offer. No pay rate or placement is promised by this page.',
              ],
            ].map(([q, a]) => (
              <details key={q} className="py-5">
                <summary className="cursor-pointer font-bold">{q}</summary>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section id="apply" className="scroll-mt-6 bg-[#f0f5ff] px-6 py-14 sm:px-10 lg:px-14">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#c8102e]">
              Take the first step
            </p>
            <h2 className="mt-3 text-3xl font-black">Start your application.</h2>
            <p className="mb-8 mt-4 leading-7 text-slate-600">
              Use your account to save your application, assessments and training progress. Choose
              remote work, tax-office work or either. You can return to this page to continue.
            </p>
            <Application key={preference} initialPreference={preference} />
          </div>
        </section>
      </main>
    </TaxSiteShell>
  );
}
