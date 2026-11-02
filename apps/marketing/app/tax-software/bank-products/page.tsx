import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
export const metadata: Metadata = {
  title: 'Payment & Refund Options | Supersonic Fast Cash',
  description:
    'Understand paying upfront, eligible pay-from-refund options and optional refund advance loans.',
};
export default function BankProducts() {
  return (
    <TaxSiteShell>
      <main>
        <section className="bg-[#082b66] px-6 py-14 !text-white sm:px-10 lg:px-14">
          <p className="text-sm font-bold uppercase tracking-wide">Supersonic Fast Cash</p>
          <h1 className="mt-3 text-4xl font-black !text-white sm:text-5xl">
            Your preparation. Your payment choice.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8">
            Understand the price, how fees are paid and how your remaining refund reaches you before
            choosing an option.
          </p>
        </section>
        <section className="px-6 py-14 sm:px-10 lg:px-14">
          <section
            aria-labelledby="eps-offers"
            className="mb-10 rounded-2xl border border-blue-200 bg-white p-6 sm:p-9"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-[#073ca2]">
              Explore EPS Financial · 2027 tax season
            </p>
            <h2 id="eps-offers" className="mt-3 text-3xl font-black">
              More flexibility for your tax season.
            </h2>
            <p className="mt-4 max-w-3xl leading-7">
              Ask Supersonic Fast Cash about optional refund products through EPS, powered by
              Pathward®, N.A., Member FDIC. Office enrollment and software availability must be
              confirmed before an application can be offered.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <article className="rounded-xl border p-5">
                <h3 className="text-xl font-bold">Explore advances up to $7,500</h3>
                <p className="mt-3 leading-7">
                  EPS lists $250 (where available), $500 and $1,000 loans at 0% APR; eligible larger
                  advances from $1,250 to $7,500 carry 36% APR. Approval and amount depend on
                  identity verification, underwriting, state and software availability.
                </p>
                <p className="mt-3 text-sm leading-6">
                  The $7,500 maximum requires a well-qualified applicant with an expected refund of
                  at least $10,592. An advance is a loan, not your tax refund. Loan principal and
                  interest reduce refund proceeds. Other optional-product fees may apply.
                </p>
              </article>
              <article className="rounded-xl border p-5">
                <h3 className="text-xl font-bold">
                  Ask about paying preparation fees from your refund
                </h3>
                <p className="mt-3 leading-7">
                  An optional Refund Transfer can pay authorized fees from eligible refund proceeds.
                  It is not a loan, requires e-filing and approval, and has fees. You can file
                  without choosing a loan or Refund Transfer.
                </p>
                <p className="mt-3 text-sm leading-6">
                  Ask which disbursement options are available: direct deposit, check or
                  FasterMoney® Visa® Prepaid Card. Review the applicable fee schedule and agreement
                  before deciding.
                </p>
              </article>
            </div>
            <p className="mt-5 text-sm leading-6">
              Published provider information reviewed November 2, 2026. Supersonic website bank
              processing is not active. No instant funding or approval is promised.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link href="/tax-software/contact" className={taxButton + ' bg-[#c8102e] text-white'}>
                Ask our team about EPS options →
              </Link>
              <a
                href="https://www.epstax.net/terms-conditions/"
                target="_blank"
                rel="noopener noreferrer"
                className={taxButton + ' border border-blue-200'}
              >
                Read current EPS terms
              </a>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              [
                'Pay upfront',
                'Pay the agreed preparation price through an approved payment method. Paying upfront does not change IRS processing time.',
              ],
              [
                'Pay from an eligible refund',
                'A Refund Transfer can deduct authorized preparation and applicable product fees from refund proceeds. It is optional, subject to approval and fees, and is not a loan.',
              ],
              [
                'Optional refund advance',
                'An advance is a separate loan, not the actual tax refund. Approval, amounts, costs and repayment terms depend on the current bank program and applicant eligibility.',
              ],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-blue-200 p-6">
                <h2 className="text-2xl font-bold text-[#073ca2]">{title}</h2>
                <p className="mt-4 leading-7 text-slate-700">{body}</p>
              </article>
            ))}
          </div>
          <section className="mt-8 rounded-2xl bg-[#e7efff] p-6">
            <h2 className="text-2xl font-bold">What you should see before agreeing</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5">
              <li>Your preparation price and every applicable bank or optional-product fee.</li>
              <li>
                Your estimated remaining refund, with an explanation that offsets or other changes
                can affect the amount.
              </li>
              <li>The current bank agreement, applicable disclosures and consent documents.</li>
              <li>Your chosen disbursement method and verified instructions.</li>
            </ul>
          </section>
          <p className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-5 leading-7">
            <strong>Check availability with our team.</strong> Bank-product processing through this
            website is not active. We can discuss current office options and applicable terms. This
            page does not accept loan applications or promise funding.
          </p>
          <Link
            href="/tax-software/contact"
            className={taxButton + ' mt-7 bg-[#c8102e] text-white'}
          >
            Ask about payment options →
          </Link>
          <section className="mt-10 border-t pt-7">
            <h2 className="text-2xl font-bold">EPS product information and materials</h2>
            <p className="mt-3 leading-7">
              Review the provider's current program information. Older brochures or advertisements
              may contain different season terms. Your applicable agreement and verified office
              program determine availability.
            </p>
            <div className="mt-4 flex flex-wrap gap-5 font-bold text-[#073ca2]">
              <a
                href="https://www.epstax.net/refund-transfers/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Refund Transfer information
              </a>
              <a
                href="https://www.epstax.net/refund-transfers/e-advance/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Advance loan terms
              </a>
              <a
                href="https://www.epstax.net/support/marketing-support/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                EPS marketing resources
              </a>
            </div>
          </section>
        </section>
      </main>
    </TaxSiteShell>
  );
}
