import type { Metadata } from 'next';
import Link from 'next/link';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
import { TaxHero } from '../_components/TaxHero';
export const metadata: Metadata = {
  title: 'Tax Preparation Training & Starting a Tax Business | Supersonic Fast Cash',
  description:
    'Explore business administration for starting a tax business. Ask about current enrollment and funding options.',
  alternates: { canonical: '/tax-software/professional' },
};
export default function ProfessionalPage() {
  return (
    <TaxSiteShell>
      <main>
        <TaxHero
          eyebrow="Learn the profession · Build your business"
          title={
            <>
              Turn your next step
              <br />
              into a plan.
            </>
          }
          description="Want to learn tax preparation or start your own tax business? Choose the education pathway that fits your goal, then review enrollment and WorkOne funding with our team."
          image="/images/bookkeeping-training-vibrant-2026.webp"
          imageAlt="A learner and mentor reviewing bookkeeping records together"
        >
          <Link href="#training-paths" className={taxButton + ' bg-[#c8102e] !text-white'}>
            Choose my training path →
          </Link>
          <Link href="#workone" className={taxButton + ' border border-white/50 !text-white'}>
            Explore funding
          </Link>
        </TaxHero>
        <section id="training-paths" className="scroll-mt-6 px-6 py-14 sm:px-10 lg:px-14">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#c8102e]">
            Business education pathway.
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">What do you want to do?</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">
            Tax preparation is the career focus. Explore how to establish and operate a business.
          </p>
          <div className="mt-8 grid max-w-3xl gap-6">
            <article className="flex flex-col rounded-2xl border border-slate-200 p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#073ca2]">
                Start your own tax business
              </p>
              <h3 className="mt-3 text-2xl font-black">Business administration</h3>
              <p className="mt-4 leading-8 text-slate-600">
                Choose the business administration pathway when your goal is to start and run a
                business. Connect your tax-office goal to business planning, operations and client
                service.
              </p>
              <ul className="my-6 space-y-3 text-sm leading-7">
                <li>Business planning and operating decisions</li>
                <li>Client service, marketing and office workflow</li>
                <li>A plan for the separate registrations and authorizations your office needs</li>
              </ul>
              <Link
                href="/programs/business-administration"
                className={taxButton + ' mt-auto self-start bg-[#c8102e] !text-white'}
              >
                View business administration →
              </Link>
              <Link
                href="/apply/student?program=business-administration"
                className="mt-5 font-bold text-[#073ca2] underline underline-offset-4"
              >
                Apply for this pathway →
              </Link>
            </article>
          </div>
        </section>
        <section id="workone" className="scroll-mt-6 bg-[#f0f5ff] px-6 py-14 sm:px-10 lg:px-14">
          <div className="grid gap-9 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#c8102e]">
                Ask about WorkOne
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Explore training at no cost if you qualify.
              </h2>
              <p className="mt-5 leading-8 text-slate-700">
                WorkOne may cover approved training costs for eligible participants. Your advisor
                must confirm the current program listing, your individual eligibility and written
                funding authorization before you enroll.
              </p>
              <a
                href={WORKONE_INDY_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={taxButton + ' mt-6 border border-[#082b66] bg-white !text-[#082b66]'}
              >
                Schedule WorkOne orientation →
              </a>
            </div>
            <ol className="space-y-5">
              {[
                [
                  'Choose your pathway',
                  'Bookkeeping and accounting for the financial work, or business administration for starting and operating a business.',
                ],
                [
                  'Complete your intake',
                  'Tell the enrollment team which program and tax-career goal you are pursuing.',
                ],
                [
                  'Confirm funding and enrollment',
                  'Meet with WorkOne and our team to review approval, costs, schedule, materials and your confirmed start.',
                ],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-5 rounded-xl bg-white p-6">
                  <span className="font-black text-[#c8102e]">0{i + 1}</span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-7 text-xs leading-6 text-slate-600">
            An inquiry or orientation appointment does not guarantee funding. Confirm any uncovered
            costs before committing to enrollment.
          </p>
        </section>
        <section className="px-6 py-14 sm:px-10 lg:px-14">
          <h2 className="text-3xl font-black">
            Education, hiring and office setup each have their own next step.
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              [
                'Your education',
                'Apply for the full program that fits your goal. Review the curriculum, funding, schedule and enrollment agreement with the education team.',
              ],
              [
                'Your professional readiness',
                'Paid preparation, electronic filing and business operations have separate credential and authorization requirements. A course does not automatically grant a PTIN or EFIN.',
              ],
              [
                'Your employment application',
                'If you want to work for Supersonic Fast Cash, use our hiring page. Class enrollment and online staff orientation do not guarantee a position.',
              ],
            ].map(([title, body]) => (
              <article key={title} className="border-t-4 border-[#073ca2] pt-5">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-4 text-sm leading-8 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
          <Link
            href="/tax-software/careers"
            className="mt-8 inline-block font-bold text-[#073ca2] underline underline-offset-4"
          >
            Looking for a job? Explore tax-office and remote careers →
          </Link>
        </section>
        <section
          id="enroll"
          className="scroll-mt-6 bg-[#082b66] px-6 py-14 !text-white sm:px-10 lg:px-14"
        >
          <h2 className="text-3xl font-black !text-white">Ready to choose your pathway?</h2>
          <p className="mt-5 max-w-2xl leading-8 !text-white">
            Apply for the program that matches your goal, or ask the enrollment team to help you
            review the available options.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/apply/student?program=business-administration"
              className={taxButton + ' bg-[#c8102e] !text-white'}
            >
              Apply: business administration →
            </Link>
          </div>
          <Link
            href="/contact?course=supersonic-fast-cash-tax-business#contact-form"
            className="mt-6 inline-block font-semibold !text-white underline underline-offset-4"
          >
            Help me choose a program
          </Link>
        </section>
      </main>
    </TaxSiteShell>
  );
}
