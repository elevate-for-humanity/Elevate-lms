import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
export const taxNav = [
  ['Prepare your taxes', '/tax-software/self-file'],
  ['Hire a professional', '/tax-software/contact'],
  ['Enroll to start your tax business', '/tax-software/professional#enroll'],
  ['Free preparation options', '/tax-software/contact#free-preparation'],
  ['Pricing', '/tax-software/pricing'],
  ["We're hiring", '/tax-software/careers'],
  ['Office reports & staff training', '/tax-software/office'],
  ['Refund and bank options', '/tax-software/bank-products'],
  ['Sign in', '/tax-software/login'],
];
export const taxButton =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 py-3 text-center text-sm font-bold transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';
const services = [
  ['Hire a professional', '/tax-software/contact'],
  ['Prepare your taxes', '/tax-software/self-file'],
  ['Pricing', '/tax-software/pricing'],
  ['Refund and bank options', '/tax-software/bank-products'],
  ['Free preparation options', '/tax-software/contact#free-preparation'],
];
export function TaxSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <div className="bg-[#082b66] px-5 py-2 text-center text-xs font-semibold !text-white sm:text-sm">
        Indianapolis tax preparation ·{' '}
        <a
          href="tel:+14632401404"
          className="whitespace-nowrap !text-white underline underline-offset-4"
        >
          (463) 240-1404
        </a>
      </div>
      <header className="relative z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3 lg:px-8">
          <Link href="/tax" aria-label="Supersonic Fast Cash home" className="shrink-0">
            <Image
              src="/images/tax/supersonic-fast-cash-logo.webp"
              alt="Supersonic Fast Cash — Tax Preparation Service"
              width={900}
              height={600}
              sizes="150px"
              className="h-[86px] w-[145px] object-contain sm:h-[96px] sm:w-[165px]"
              priority
            />
          </Link>
          <nav
            aria-label="Supersonic main navigation"
            className="hidden items-center gap-6 text-sm font-bold lg:flex"
          >
            <details className="group relative">
              <summary className="cursor-pointer py-4">Tax services</summary>
              <div className="absolute left-0 top-full w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {services.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="block rounded-lg px-4 py-3 hover:bg-blue-50"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </details>
            <Link href="/tax-software/professional" className="py-4 hover:text-[#073ca2]">
              Training & business
            </Link>
            <Link href="/tax-software/careers" className="py-4 hover:text-[#073ca2]">
              Careers
            </Link>
            <Link href="/tax-software/login" className="py-4 hover:text-[#073ca2]">
              Sign in
            </Link>
          </nav>
          <Link
            href="/tax-software/contact"
            className={taxButton + ' hidden bg-[#c8102e] !text-white lg:inline-flex'}
          >
            Get tax help →
          </Link>
          <details className="group lg:hidden">
            <summary className="cursor-pointer rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold">
              Menu
            </summary>
            <nav
              aria-label="Supersonic mobile navigation"
              className="absolute inset-x-0 top-full max-h-[75vh] overflow-auto border-b border-slate-200 bg-white px-5 py-5 shadow-xl"
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#073ca2]">
                Tax services
              </p>
              {services.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block border-b border-slate-100 py-3 font-semibold"
                >
                  {label}
                </Link>
              ))}
              <p className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-[#073ca2]">
                Training & careers
              </p>
              <Link href="/tax-software/professional" className="block py-3 font-semibold">
                Learn taxes or start a business
              </Link>
              <Link href="/tax-software/careers" className="block py-3 font-semibold">
                We're hiring
              </Link>
              <Link
                href="/tax-software/login"
                className={taxButton + ' mt-4 w-full bg-[#082b66] !text-white'}
              >
                Sign in
              </Link>
            </nav>
          </details>
        </div>
      </header>
      <div className="mx-auto max-w-7xl">{children}</div>
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <p className="text-2xl font-black text-[#082b66]">Supersonic Fast Cash</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                Tax preparation, a path into the tax profession, and support for your next business
                step.
              </p>
              <a
                href="tel:+14632401404"
                className="mt-5 inline-block text-lg font-bold text-[#082b66]"
              >
                (463) 240-1404
              </a>
            </div>
            <nav aria-label="Tax service footer">
              <p className="mb-3 font-bold">For tax clients</p>
              {services.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="block py-2 text-sm text-slate-700 hover:underline"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <nav aria-label="Training and team footer">
              <p className="mb-3 font-bold">Learn. Work. Grow.</p>
              <Link href="/tax-software/professional" className="block py-2 text-sm">
                Tax training & business classes
              </Link>
              <Link href="/tax-software/careers" className="block py-2 text-sm">
                Office & remote careers
              </Link>
              <Link href="/tax-software/office" className="block py-2 text-sm">
                Staff reports & training
              </Link>
              <Link href="/tax-software/contact" className="block py-2 text-sm">
                Contact us
              </Link>
            </nav>
          </div>
          <div className="mt-9 border-t border-slate-200 pt-6 text-xs leading-6 text-slate-600">
            <p className="font-semibold">HOTT KAMODITTY DBA Supersonic Fast Cash</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              <Link href="/tax-software/about">About Supersonic Fast Cash</Link>
              <Link href="/tax-software/features">How the tax workspace works</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms-of-service">Terms</Link>
              <Link href="/">Elevate for Humanity</Link>
            </div>
            <p className="mt-4 max-w-4xl">
              Free preparation eligibility, return scope and availability must be confirmed.
              Training funding, employment and business authorization have separate requirements.
              The online preparation workspace does not currently submit returns to the IRS or
              process bank products.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
