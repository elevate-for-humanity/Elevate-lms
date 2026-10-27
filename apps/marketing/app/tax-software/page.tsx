import { supersonicBusiness } from '@/lib/tax-software/search-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxHero } from './_components/TaxHero';
import { TaxSiteShell, taxButton } from './_components/TaxSiteShell';
export const metadata: Metadata = {
  title: { absolute: 'Indianapolis Tax Preparation & Tax Business Classes | Supersonic Fast Cash' },
  description:
    'Get professional tax help, prepare your own return information, explore tax training or apply for office and remote tax work with Supersonic Fast Cash.',
  alternates: { canonical: '/tax' },
  openGraph: {
    title: 'Supersonic Fast Cash',
    description: 'Get tax help. Learn the profession. Build your next step.',
    images: [
      { url: '/images/tax/supersonic-tax-hero-2026.webp', alt: 'A tax preparation consultation' },
    ],
  },
};
export default function TaxSoftwarePage() {
  return (
    <TaxSiteShell>
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(supersonicBusiness).replace(/</g, '\\u003c'),
          }}
        />
        <TaxHero
          eyebrow="Supersonic Fast Cash · Indianapolis"
          title={
            <>
              Get your taxes
              <br className="hidden sm:block" /> prepared.
            </>
          }
          description="Personal taxes, self-employment or business questions? Start with the help you need. Work with a professional, or organize your own return information online."
          image="/images/tax/supersonic-tax-hero-2026.webp"
          imageAlt="A preparer and client reviewing financial documents together"
        >
          <Link href="/tax-software/contact" className={taxButton + ' bg-[#c8102e] !text-white'}>
            Hire a professional →
          </Link>
          <Link
            href="/tax-software/self-file"
            className={taxButton + ' border border-white/50 bg-white !text-[#082b66]'}
          >
            Prepare my taxes →
          </Link>
        </TaxHero>
        <div className="grid divide-y divide-blue-100 border-b border-blue-100 bg-[#f0f5ff] px-6 text-sm font-semibold text-[#082b66] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <p className="py-5 sm:pr-6">Personal & self-employed tax help</p>
          <p className="py-5 sm:px-6">Clear pricing before you commit</p>
          <p className="py-5 sm:pl-6">Indianapolis office & remote inquiries</p>
        </div>
        <section id="options" className="scroll-mt-6 px-6 py-14 sm:px-10 lg:px-14">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#c8102e]">
            For tax clients
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Choose how you want to prepare.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            You do not have to figure out every tax question before getting started. Choose
            professional help, or begin organizing your information yourself.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="flex flex-col rounded-2xl border border-slate-200 p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#073ca2]">
                Let us help
              </p>
              <h3 className="mt-3 text-2xl font-black">Hire a professional</h3>
              <p className="mt-4 leading-7 text-slate-600">
                Tell us about your personal, self-employed, business or amended return. We will
                discuss your needs, required documents and preparation price.
              </p>
              <ul className="my-6 space-y-3 text-sm">
                <li>✓ A conversation about your return</li>
                <li>✓ A document checklist for your situation</li>
                <li>✓ Scope and pricing reviewed before work begins</li>
              </ul>
              <Link
                href="/tax-software/contact"
                className={taxButton + ' mt-auto self-start bg-[#c8102e] !text-white'}
              >
                Request tax help →
              </Link>
            </article>
            <article className="flex flex-col rounded-2xl border border-slate-200 p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#073ca2]">
                Do it yourself
              </p>
              <h3 className="mt-3 text-2xl font-black">Prepare your own taxes</h3>
              <p className="mt-4 leading-7 text-slate-600">
                Use the guided workspace to enter your information, confirm uploaded documents and
                review your preparation estimate.
              </p>
              <ul className="my-6 space-y-3 text-sm">
                <li>✓ Free to start your return information</li>
                <li>✓ Review additional form charges before choosing services</li>
                <li>✓ Save your progress in your account</li>
              </ul>
              <Link
                href="/tax-software/self-file"
                className={taxButton + ' mt-auto self-start bg-[#082b66] !text-white'}
              >
                Open my tax workspace →
              </Link>
              <p className="mt-4 text-xs leading-6 text-slate-600">
                The workspace currently supports preparation. Electronic IRS submission is not
                available through it yet.
              </p>
            </article>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-l-4 border-[#c8102e] bg-slate-50 p-6">
            <div>
              <h3 className="font-bold">Looking for free preparation?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ask about eligibility, covered returns and available appointments.
              </p>
            </div>
            <Link
              href="/tax-software/contact#free-preparation"
              className="font-bold text-[#073ca2] underline underline-offset-4"
            >
              Check my options →
            </Link>
          </div>
        </section>
        <section className="bg-[#082b66] px-6 py-14 !text-white sm:px-10 lg:px-14">
          <p className="text-xs font-extrabold uppercase tracking-widest !text-white">
            For future tax professionals
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black !text-white sm:text-4xl">
            See yourself on the other side of the desk?
          </h2>
          <p className="mt-5 max-w-2xl leading-8 !text-white">
            Learning tax preparation, starting a business and applying for work are different next
            steps. Choose the one that matches your goal.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="border-t border-white/30 pt-6">
              <h3 className="text-2xl font-bold !text-white">
                Learn taxes. Start your own tax business.
              </h3>
              <p className="mt-4 leading-7 !text-white">
                Explore the bookkeeping and accounting pathway with tax preparation, or the business
                administration pathway for starting and operating a business. Ask about WorkOne
                funding.
              </p>
              <Link
                href="/tax-software/professional"
                className={taxButton + ' mt-6 bg-white !text-[#082b66]'}
              >
                Explore training & business classes →
              </Link>
            </div>
            <div className="border-t border-white/30 pt-6">
              <h3 className="text-2xl font-bold !text-white">Work with Supersonic Fast Cash.</h3>
              <p className="mt-4 leading-7 !text-white">
                Apply for office-based or remote tax work. See the role requirements, initial
                assessment, online system training and hiring review process.
              </p>
              <Link
                href="/tax-software/careers"
                className={taxButton + ' mt-6 bg-[#c8102e] !text-white'}
              >
                Explore careers →
              </Link>
            </div>
          </div>
        </section>
        <section className="px-6 py-14 sm:px-10 lg:px-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#c8102e]">
                Before you get started
              </p>
              <h2 className="mt-3 text-3xl font-black">Answers to the first questions.</h2>
            </div>
            <Link
              href="/tax-software/pricing"
              className="font-bold text-[#073ca2] underline underline-offset-4"
            >
              See preparation pricing →
            </Link>
          </div>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {[
              [
                'What should I bring for tax preparation?',
                'Start with your income documents, prior-year return if available, and records for relevant deductions, credits or business expenses. Our team will tell you what else your return needs.',
              ],
              [
                'How much does preparation cost?',
                'Starting a return and base federal preparation in the workspace are free. Additional forms or services may cost extra. Professional preparation is quoted after reviewing your situation.',
              ],
              [
                'Can preparation fees come out of my refund?',
                'An eligible Refund Transfer may allow approved fees to be paid from refund proceeds. Availability, charges and bank agreements must be confirmed. It does not speed up IRS processing.',
              ],
              [
                'Does a class inquiry also apply me for a job?',
                'No. Training inquiries, funding applications and job applications follow separate processes. Use the training page to explore classes or the careers page to apply for work.',
              ],
            ].map(([q, a]) => (
              <details key={q} className="py-5">
                <summary className="cursor-pointer pr-4 font-bold">{q}</summary>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="mx-6 mb-14 flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-[#f0f5ff] p-8 sm:mx-10 lg:mx-14">
          <div>
            <h2 className="text-2xl font-black">Ready to talk about your taxes?</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Start with a conversation. We will help you identify the next step.
            </p>
          </div>
          <Link href="/tax-software/contact" className={taxButton + ' bg-[#c8102e] !text-white'}>
            Get tax help →
          </Link>
        </section>
      </main>
    </TaxSiteShell>
  );
}
