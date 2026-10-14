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
        <section className="bg-[#082b66] px-6 py-14 !text-white sm:px-10 lg:px-14">
          <h1 className="max-w-3xl text-4xl font-black !text-white sm:text-5xl">
            Know your options. Know the cost.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 !text-white">
            Start your own return for free. Review any additional preparation charges as your return
            needs change.
          </p>
          <p className="mt-8 text-5xl font-black !text-white">${SELF_FILE_BASE_PRICE}</p>
          <p className="mt-2 font-semibold !text-white">
            Starting a return & base federal preparation
          </p>
          <Link
            href="/tax-software/self-file"
            className={taxButton + ' mt-6 bg-[#c8102e] text-white'}
          >
            Start my return →
          </Link>
        </section>
        <section className="px-6 pt-14 sm:px-10 lg:px-14" aria-labelledby="service-options">
          <h2 id="service-options" className="text-3xl font-bold">
            Choose how much help you want.
          </h2>
          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {[
              {
                title: 'Do it yourself',
                price: 'Free to start',
                body: 'Use the guided workspace, confirm your documents and review your estimate. Additional preparation charges are listed below.',
                cta: 'Open my workspace',
                href: '/tax-software/self-file',
              },
              {
                title: 'Prepare with a review',
                price: 'Quote before work begins',
                body: 'Organize your information, then ask our team to review the return scope, missing documents and preparation needs.',
                cta: 'Request a review',
                href: '/tax-software/contact',
              },
              {
                title: 'Let us prepare it',
                price: 'Quote before work begins',
                body: 'Work with a preparer on personal, self-employed or business tax needs. Review the included services and full price before committing.',
                cta: 'Talk to a preparer',
                href: '/tax-software/contact',
              },
            ].map((option) => (
              <article
                key={option.title}
                className="flex flex-col rounded-2xl border border-blue-200 border-t-4 border-t-[#c8102e] bg-white p-6 shadow-sm"
              >
                <h3 className="text-2xl font-bold">{option.title}</h3>
                <p className="mt-4 font-black text-[#073ca2]">{option.price}</p>
                <p className="mb-6 mt-4 text-sm leading-7 text-slate-600">{option.body}</p>
                <Link href={option.href} className={taxButton + ' mt-auto bg-[#073ca2] text-white'}>
                  {option.cta} →
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Starting a workspace does not submit a return. Electronic filing and bank-product
            availability require separate provider setup and authorization.
          </p>
        </section>
        <section className="px-6 py-14 sm:px-10 lg:px-14">
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
