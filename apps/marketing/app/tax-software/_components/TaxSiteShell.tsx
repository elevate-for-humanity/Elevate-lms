import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
export const taxNav = [
  ['Prepare your taxes', '/tax-software/self-file'],
  ['Hire a professional', '/tax-software/contact'],
  ['Enroll to start your tax business', '/tax-software/professional#enroll'],
  ['Free preparation options', '/tax-software/contact#free-preparation'],
  ['Pricing', '/tax-software/pricing'],
  ['Sign in', '/tax-software/login'],
];
export const taxButton =
  'inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-center text-sm font-bold transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4';
export function TaxSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link
            href="/tax"
            aria-label="Supersonic Fast Cash home"
            className="block w-[220px] max-w-[70%] sm:w-[300px]"
          >
            <Image
              src="/images/tax/supersonic-fast-cash-logo.webp"
              alt="Supersonic Fast Cash LLC — Tax Preparation Service"
              width={900}
              height={600}
              sizes="(max-width: 639px) 220px, 300px"
              className="h-auto w-full object-contain"
              priority
            />
          </Link>
          <Link
            href="/tax-software/login"
            className="rounded-full border border-blue-200 px-5 py-3 text-sm font-bold text-[#073ca2]"
          >
            Sign in
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-[#e7efff] p-5 lg:border-b-0 lg:border-r">
          <details open className="lg:sticky lg:top-5">
            <summary className="cursor-pointer text-sm font-bold text-[#073ca2]">
              Your tax options
            </summary>
            <nav
              aria-label="Supersonic side navigation"
              className="mt-4 flex flex-wrap gap-2 lg:flex-col"
            >
              {taxNav.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold leading-5 hover:border-blue-400 hover:text-[#073ca2]"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/tax-software/contact"
                className="px-4 py-3 text-sm font-bold text-[#073ca2]"
              >
                Contact us →
              </Link>
            </nav>
          </details>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-9">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap justify-between gap-5">
            <div>
              <p className="font-black text-[#073ca2]">Supersonic Fast Cash LLC</p>
              <p className="mt-2 text-sm text-slate-600">
                Your taxes. Your next business opportunity.
              </p>
            </div>
            <a href="tel:+13179999620" className="font-bold text-[#073ca2]">
              (317) 999-9620
            </a>
          </div>
          <div className="mt-5 flex flex-wrap gap-5 text-sm">
            <Link href="/tax-software/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/">Elevate for Humanity</Link>
          </div>
          <p className="mt-5 max-w-3xl text-xs leading-6 text-slate-600">
            Free preparation eligibility, return scope and appointment availability must be
            confirmed. Training and business setup have separate costs and requirements. The online
            preparation workspace does not currently submit returns to the IRS or process bank
            products.
          </p>
        </div>
      </footer>
    </div>
  );
}
