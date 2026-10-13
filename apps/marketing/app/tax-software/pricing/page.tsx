import type { Metadata } from 'next';
import Link from 'next/link';
import { SELF_FILE_BASE_PRICE, SELF_FILE_FORM_CHARGES } from '@/lib/tax-software/self-file-pricing';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
export const metadata: Metadata = {
  title: 'Tax Preparation Pricing | Supersonic Fast Cash',
  description:
    'Free base federal preparation, additional form charges and professional tax preparation options.',
};
export default function Pricing() {
  return (
    <TaxSiteShell>
      <main>
        <section className="bg-[#f1f6ff] px-5 py-10 sm:p-10">
          <h1 className="text-4xl font-black sm:text-5xl">Know your options. Know the cost.</h1>
          <p className="mt-5 max-w-xl text-lg leading-7 text-slate-700">
            Start your own return for free. Review any additional preparation charges as your return
            needs change.
          </p>
          <p className="mt-6 text-5xl font-black text-[#073ca2]">${SELF_FILE_BASE_PRICE}</p>
          <p className="mt-2 font-semibold">Starting a return & base federal preparation</p>
          <Link
            href="/tax-software/self-file"
            className={taxButton + ' mt-6 bg-[#c8102e] text-white'}
          >
            Start my return →
          </Link>
        </section>
        <section className="px-5 py-10 sm:px-10">
          <h2 className="text-3xl font-bold">Additional preparation charges</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Only the additions identified for your return appear in your estimate. These are
            software preparation charges; they do not indicate IRS submission.
          </p>
          <table className="mt-6 w-full text-left text-sm">
            <caption className="sr-only">Self-preparation form pricing</caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className="py-3 pr-4">
                  Form or service
                </th>
                <th scope="col" className="py-3 text-right">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {SELF_FILE_FORM_CHARGES.map((c) => (
                <tr key={c.code} className="border-b border-slate-100">
                  <th scope="row" className="py-4 pr-4 font-medium">
                    {c.label}
                  </th>
                  <td className="py-4 text-right">${c.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl bg-slate-50 p-6">
              <h2 className="text-xl font-bold">Hire a professional</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Discuss your return and request a quote. Ask about free preparation eligibility
                before choosing paid service.
              </p>
              <Link
                href="/tax-software/contact"
                className="mt-4 inline-block font-bold text-[#073ca2]"
              >
                Get tax help →
              </Link>
            </article>
            <article className="rounded-2xl bg-slate-50 p-6">
              <h2 className="text-xl font-bold">Start a tax business</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Review tuition, software and office setup costs with our team before enrolling.
              </p>
              <Link
                href="/tax-software/professional#enroll"
                className="mt-4 inline-block font-bold text-[#073ca2]"
              >
                Explore enrollment →
              </Link>
            </article>
          </div>
        </section>
      </main>
    </TaxSiteShell>
  );
}
