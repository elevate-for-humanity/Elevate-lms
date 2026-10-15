import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
export const metadata: Metadata = {
  title: 'Hire a Tax Professional | Supersonic Fast Cash',
  description:
    'Get help with personal, self-employed, business and amended tax returns. Ask about free preparation eligibility.',
};
export default function Contact() {
  return (
    <TaxSiteShell>
      <main>
        <section className="bg-[#082b66] px-6 py-14 !text-white sm:px-10 lg:px-14">
          <p className="text-xs font-extrabold uppercase tracking-widest !text-white">
            PROFESSIONAL TAX HELP
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black !text-white sm:text-5xl">
            Get your taxes prepared by a professional.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 !text-white">
            Personal taxes, self-employment, business returns or an amended return. Tell us what you
            need help with.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="tel:+13179999620" className={taxButton + ' bg-[#c8102e] text-white'}>
              Call (317) 999-9620
            </a>
            <Link
              href="/contact?product=supersonic-fast-cash-tax-preparation#contact-form"
              className={taxButton + ' border border-[#073ca2] bg-white text-[#073ca2]'}
            >
              Request tax preparation help →
            </Link>
          </div>
        </section>
        <section className="px-6 py-14 sm:px-10 lg:px-14">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#c8102e]">
            What happens next
          </p>
          <h2 className="mt-3 text-3xl font-black">
            A clear preparation plan, from the first conversation.
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              [
                'Tell us what you need',
                'Describe your return and how to reach you. Your inquiry requests follow-up; it does not book an appointment.',
              ],
              [
                'Review your documents',
                'Our team explains the records needed and the approved private way to provide them.',
              ],
              [
                'Confirm the service and price',
                'Review the preparation scope, fee quote, appointment or service process, and required authorizations.',
              ],
            ].map(([title, body], i) => (
              <li key={title} className="border-t-4 border-[#073ca2] pt-5">
                <span className="font-black text-[#c8102e]">0{i + 1}</span>
                <h3 className="mt-3 text-xl font-bold">{title}</h3>
                <p className="mt-4 text-sm leading-8 text-slate-600">{body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="px-6 py-14 sm:px-10 lg:px-14">
          <h2 className="text-3xl font-bold">Have these documents ready.</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Income documents, including W-2s and applicable 1099s',
              'Your prior-year return, if available',
              'Records for deductions and credits you want reviewed',
              'Business income and expense records, if applicable',
            ].map((t) => (
              <li key={t} className="rounded-2xl border border-slate-200 p-5 text-sm leading-6">
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            Use the contact form only to request help. Do not include Social Security numbers, bank
            details or tax documents; our team will explain the appropriate document process.
          </p>
        </section>
        <section
          id="free-preparation"
          className="scroll-mt-6 bg-slate-50 px-6 py-14 sm:px-10 lg:px-14"
        >
          <h2 className="text-3xl font-bold">Free tax preparation options.</h2>
          <p className="mt-4 max-w-xl leading-7 text-slate-600">
            Starting your own return and base federal preparation in the software are free.
            Additional schedules and state preparation may carry separate charges. If you want a
            professional to prepare your return, ask our team about eligibility, covered returns and
            appointments.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tax-software/self-file" className={taxButton + ' bg-[#073ca2] text-white'}>
              Start my own return →
            </Link>
            <Link
              href="/contact?product=supersonic-fast-cash-free-tax-preparation#contact-form"
              className={taxButton + ' border border-[#073ca2] text-[#073ca2]'}
            >
              Ask about free professional preparation →
            </Link>
          </div>
        </section>
      </main>
    </TaxSiteShell>
  );
}
