import Link from 'next/link';

const recoveryLinks = [
  { href: '/programs', label: 'Browse programs', description: 'Compare career training and apprenticeship options.' },
  { href: '/funding', label: 'Review funding', description: 'Understand eligibility and authorization steps.' },
  { href: '/apply', label: 'Start an application', description: 'Continue through the canonical admissions path.' },
  { href: '/testing', label: 'Testing center', description: 'Find credential testing and scheduling information.' },
  { href: '/contact', label: 'Contact support', description: 'Ask for help locating a resource or next step.' },
];

export default function MarketingNotFound() {
  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16 text-slate-950">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-red-700">404 · Page unavailable</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Let&apos;s get you back on the right path.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          The address may be outdated, incomplete, or moved to another Elevate service. Choose a verified destination below or return home.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {recoveryLinks.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-red-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-600">
              <span className="font-black text-slate-950">{item.label}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">{item.description}</span>
            </Link>
          ))}
        </div>

        <Link href="/" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2">
          Return to homepage
        </Link>
      </div>
    </main>
  );
}
