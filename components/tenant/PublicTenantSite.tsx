'use client';

import Link from 'next/link';
import type { PublishedTenantSite } from '@/lib/tenant/site-types';

type PageKey = 'home' | 'programs' | 'about' | 'contact';

function resolvePage(pathname: string): PageKey {
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/programs') return 'programs';
  if (p === '/about') return 'about';
  if (p === '/contact') return 'contact';
  return 'home';
}

export function PublicTenantSite({
  site,
  pathname = '/',
}: {
  site: PublishedTenantSite;
  pathname?: string;
}) {
  const { config } = site;
  const page = resolvePage(pathname);
  const primary = config.branding.primaryColor;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="font-bold text-lg" style={{ color: primary }}>
            {config.branding.logoText}
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm font-medium">
            {config.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  resolvePage(item.href) === page ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/admin"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: primary }}
          >
            Admin
          </Link>
        </div>
      </header>

      <main>
        {page === 'home' && (
          <>
            <section className="px-4 py-16 md:py-24 bg-slate-50">
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-3">
                  {config.branding.tagline}
                </p>
                <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
                  {config.homepage.heroTitle}
                </h1>
                <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                  {config.homepage.heroSubtitle}
                </p>
                <Link
                  href="/programs"
                  className="inline-flex px-6 py-3 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: primary }}
                >
                  {config.homepage.heroCtaText}
                </Link>
              </div>
            </section>
            <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
              {config.homepage.features.map((f) => (
                <div key={f.title} className="rounded-xl border border-slate-200 p-6">
                  <h2 className="font-bold text-lg mb-2">{f.title}</h2>
                  <p className="text-slate-600 text-sm">{f.description}</p>
                </div>
              ))}
            </section>
          </>
        )}
        {page === 'programs' && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Training Programs</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.programs.map((prog) => (
                <article key={prog.name} className="border border-slate-200 rounded-xl p-6">
                  <h2 className="font-bold text-lg mb-2">{prog.name}</h2>
                  <p className="text-slate-600 text-sm mb-4">{prog.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        {page === 'about' && (
          <section className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-4">About {config.branding.logoText}</h1>
            <p className="text-slate-600 leading-relaxed">{config.footer.description}</p>
          </section>
        )}
        {page === 'contact' && (
          <section className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-4">Contact</h1>
            {config.footer.contactEmail && (
              <p className="text-slate-800">
                Email:{' '}
                <a href={`mailto:${config.footer.contactEmail}`} className="underline font-medium">
                  {config.footer.contactEmail}
                </a>
              </p>
            )}
          </section>
        )}
      </main>
      <footer className="border-t border-slate-200 mt-12 py-8 bg-slate-50 text-center text-sm text-slate-600">
        <p>{config.footer.description}</p>
      </footer>
    </div>
  );
}
