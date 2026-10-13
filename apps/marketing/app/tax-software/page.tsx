import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from './_components/TaxSiteShell';
export const metadata: Metadata = {
  title: { absolute: 'Supersonic Fast Cash | Tax Preparation & Start Your Tax Business' },
  description:
    'Prepare your own taxes, hire a tax professional, or enroll to start your own tax business with Supersonic Fast Cash.',
  alternates: { canonical: '/tax' },
  openGraph: {
    title: 'Supersonic Fast Cash',
    description: 'Prepare your taxes. Hire a professional. Start your tax business.',
    images: [
      {
        url: '/images/tax/supersonic-tax-hero-2026.webp',
        alt: 'Professionals reviewing documents together',
      },
    ],
  },
};
const choices = [
  {
    title: 'Prepare your own taxes',
    text: 'Answer guided questions, add your documents and review your information in your tax workspace.',
    href: '/tax-software/self-file',
    cta: 'Prepare my taxes',
    label: 'DO IT YOURSELF',
  },
  {
    title: 'Hire a professional',
    text: 'Get help with personal, self-employed, business or amended returns. Talk with our team about your tax needs.',
    href: '/tax-software/contact',
    cta: 'Get professional tax help',
    label: 'LET US HELP',
  },
  {
    title: 'Start your own tax business',
    text: 'Explore tax preparation training, business setup and the steps to serve your own clients.',
    href: '/tax-software/professional#enroll',
    cta: 'Explore enrollment',
    label: 'BUILD YOUR FUTURE',
  },
];
export default function TaxSoftwarePage() {
  return (
    <TaxSiteShell>
      <main>
        <section className="bg-[#082b66] px-5 py-9 text-white sm:p-10">
          <div className="grid items-center gap-7 xl:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-white">
                Supersonic Fast Cash
              </p>
              <h1 className="mt-4 text-4xl font-black !text-white leading-tight tracking-tight sm:text-5xl">
                Get your taxes prepared.
                <span className="mt-2 block text-white">Build your next chapter.</span>
              </h1>
              <p className="mt-5 text-lg leading-7 text-white">
                Do it yourself, hire a professional, or start your own tax business. Choose the
                option that fits you.
              </p>
              <Link href="#options" className={taxButton + ' mt-6 bg-white !text-[#082b66]'}>
                Choose my option →
              </Link>
            </div>
            <div className="order-first relative aspect-[16/9] xl:order-last overflow-hidden rounded-3xl bg-white">
              <Image
                src="/images/tax/supersonic-tax-hero-2026.webp"
                alt="Illustrative tax professional reviewing documents with a client"
                fill
                priority
                sizes="(min-width: 1280px) 450px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>
        <section id="options" className="scroll-mt-6 px-5 py-10 sm:px-10">
          <h2 className="text-3xl font-bold">How can we help you?</h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {choices.map((c) => (
              <article
                key={c.title}
                className="flex flex-col rounded-2xl border border-blue-200 border-t-4 border-t-[#073ca2] bg-white p-6 shadow-md"
              >
                <p className="text-xs font-bold tracking-wide text-[#073ca2]">{c.label}</p>
                <h3 className="mt-3 text-2xl font-bold leading-tight">{c.title}</h3>
                <p className="mb-6 mt-4 text-sm leading-6 text-slate-600">{c.text}</p>
                <Link href={c.href} className={taxButton + ' mt-auto bg-[#073ca2] text-white'}>
                  {c.cta} →
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#edf4ff] p-6">
            <div>
              <h3 className="text-xl font-bold">Looking for free tax preparation?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Check eligibility, covered returns and appointment availability.
              </p>
            </div>
            <Link
              href="/tax-software/contact#free-preparation"
              className="font-bold text-[#073ca2] underline"
            >
              Check free preparation options →
            </Link>
          </div>
        </section>
        <section className="bg-slate-50 px-5 py-10 sm:px-10">
          <h2 className="text-3xl font-bold">A clear next step.</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['Choose', 'Select tax preparation, professional help or business training.'],
              ['Review', 'Understand your next steps and any costs before committing.'],
              ['Get started', 'Open your workspace, arrange tax help or begin enrollment.'],
            ].map(([title, detail], i) => (
              <li key={title} className="rounded-2xl bg-white p-5">
                <span className="text-sm font-bold text-[#073ca2]">0{i + 1}</span>
                <h3 className="mt-2 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="px-5 py-10 sm:px-10">
          <h2 className="text-3xl font-bold">Questions? Start here.</h2>
          <div className="mt-5 divide-y divide-slate-200">
            {[
              [
                'Can someone prepare my taxes for me?',
                'Yes. Choose Hire a professional to discuss your return and arrange the next step with our team.',
              ],
              [
                'Can I prepare my own taxes online?',
                'The tax workspace lets you organize your return information and review documents. IRS filing is a separate step and is not available through this workspace yet.',
              ],
              [
                'Does asking about training enroll me?',
                'No. An inquiry requests information. An enrollment application requests admission; costs, agreements and required steps must be reviewed before enrollment is confirmed.',
              ],
            ].map(([q, a]) => (
              <details key={q} className="py-5">
                <summary className="cursor-pointer font-bold">{q}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </TaxSiteShell>
  );
}
