import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
export const metadata: Metadata = {
  title: 'Start Your Own Tax Business | Supersonic Fast Cash',
  description:
    'Explore tax preparation training, client service, marketing and office setup with Supersonic Fast Cash.',
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
              Explore enrollment →
            </Link>
          </div>
          <div className="order-first relative aspect-[16/9] xl:order-last overflow-hidden rounded-3xl">
            <Image
              src="/images/tax/supersonic-tax-training-2026.webp"
              alt="Illustrative tax business instructor mentoring adult learners"
              fill
              priority
              sizes="(min-width: 1280px) 450px, 100vw"
              className="object-cover"
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
