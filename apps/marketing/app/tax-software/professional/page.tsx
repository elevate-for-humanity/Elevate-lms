import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
export const metadata: Metadata = {
  title: 'Start Your Own Tax Business | Supersonic Fast Cash',
  description:
    'Start your own tax business with Supersonic Fast Cash training in Indianapolis. Ask about classes, WorkOne funding eligibility and tax-office careers.',
  alternates: { canonical: '/tax-software/professional' },
};
export default function ProfessionalPage() {
  return (
    <TaxSiteShell>
      <main>
        <section className="grid items-center gap-7 bg-[#082b66] text-white px-5 py-10 sm:p-10 xl:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white">
              YOUR NEXT BUSINESS
            </p>
            <h1 className="mt-4 text-4xl font-black !text-white leading-tight sm:text-5xl">
              Do you want to start your own tax business?
            </h1>
            <p className="mt-5 text-lg leading-7 text-white">
              Turn tax preparation skills into a plan for your own office. Explore training, client
              service and business setup through Supersonic Fast Cash.
            </p>
            <Link href="#enroll" className={taxButton + ' mt-6 bg-white !text-[#082b66]'}>
              Start now — ask about classes →
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src="/images/pexels/bookkeeping.webp"
              alt="Professionals reviewing financial documents together"
              fill
              priority
              sizes="(min-width: 1280px) 450px, 100vw"
              className="object-cover contrast-[1.1] saturate-[1.18]"
            />
          </div>
        </section>
        <section className="px-5 py-10 sm:px-10">
          <h2 className="text-3xl font-bold">Build the skills behind your office.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              [
                'Tax preparation',
                'Understand taxpayer interviews, income documents, deductions, credits and return review.',
              ],
              [
                'Office setup',
                'Plan your business structure, software, document handling and operating costs.',
              ],
              [
                'Client service',
                'Develop an intake process, appointment workflow and clear communication with clients.',
              ],
              [
                'Marketing your business',
                'Build your service offer, referral strategy and client acquisition plan.',
              ],
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-slate-200 p-6">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="px-5 py-10 sm:px-10" aria-labelledby="workone-heading">
          <p className="text-sm font-bold text-[#c8102e]">START NOW · TRAIN FOR YOUR NEXT STEP</p>
          <h2 id="workone-heading" className="mt-3 text-3xl font-bold">
            Ask WorkOne about funding for tax preparation training.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-700">
            Start your training inquiry with Elevate, then speak with WorkOne about your
            eligibility, the current program listing and any required approval before enrollment. An
            inquiry or orientation appointment does not guarantee funding. WorkOne determines
            individual eligibility and funding authorization.
          </p>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              [
                'Choose your training',
                'Tell us you are interested in tax preparation and starting a tax business.',
              ],
              [
                'Meet with WorkOne',
                'Discuss eligibility, the approved program, costs and your training plan.',
              ],
              [
                'Confirm your start',
                'Review the schedule, tuition, included materials and written enrollment steps with our team.',
              ],
            ].map(([title, body], i) => (
              <li key={title} className="rounded-2xl border p-5">
                <p className="font-bold text-[#073ca2]">0{i + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7">{body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/funding/workone-intake?program=tax-preparation"
              className={taxButton + ' bg-[#c8102e] text-white'}
            >
              Start funding intake →
            </Link>
            <a
              href={WORKONE_INDY_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={taxButton + ' border border-blue-200 text-[#073ca2]'}
            >
              Schedule WorkOne orientation →
            </a>
          </div>
        </section>
        <section className="bg-slate-50 px-5 py-10 sm:px-10">
          <h2 className="text-3xl font-bold">We're hiring — build your career in a tax office.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-700">
            Interested in office-based work or remote tax preparation? Tell Supersonic Fast Cash
            about your experience and work preference. Training enrollment, employment selection and
            starting an independent business are separate paths.
          </p>
          <Link
            href="/tax-software/careers"
            className={taxButton + ' mt-6 bg-[#073ca2] text-white'}
          >
            Explore tax-office and remote opportunities →
          </Link>
        </section>
        <section id="enroll" className="scroll-mt-6 bg-[#073ca2] px-5 py-10 text-white sm:px-10">
          <h2 className="text-3xl font-bold">Start your enrollment conversation.</h2>
          <p className="mt-4 max-w-xl leading-7 text-blue-100">
            Ask about training availability, tuition, what is included and the steps to apply. Your
            inquiry does not enroll you or open a tax office.
          </p>
          <Link
            href="/contact?course=supersonic-fast-cash-tax-business#contact-form"
            className={taxButton + ' mt-6 bg-white text-[#073ca2]'}
          >
            Request enrollment information →
          </Link>
          <p className="mt-4 text-sm text-blue-100">
            Business registration, preparer credentials and filing authorization are separate
            requirements. No earnings or office approval is guaranteed.
          </p>
        </section>
      </main>
    </TaxSiteShell>
  );
}
