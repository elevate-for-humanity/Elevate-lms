'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPublicPageFacts } from '@/lib/marketing/public-page-facts';

export default function PublicPageFacts() {
  const pathname = usePathname() || '/';
  const content = getPublicPageFacts(pathname);
  // The homepage already ends with its own illustrated enrollment CTA.
  if (pathname === '/') return null;
  return (
    <section
      aria-labelledby="page-facts-heading"
      className="border-t border-slate-200 bg-white px-4 py-10 sm:py-14"
    >
      <div className="mx-auto max-w-6xl">
        <div>
          <h2 id="page-facts-heading" className="text-2xl font-black sm:text-3xl">
            {content.title}
          </h2>
          <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
            {content.facts.map((fact) => (
              <details key={fact.question} className="group p-4 open:bg-slate-50">
                <summary className="cursor-pointer py-2 font-bold text-slate-950">
                  {fact.question}
                </summary>
                <p className="mt-2 text-sm leading-6 text-slate-700">{fact.answer}</p>
                <Link
                  href={fact.href}
                  className="mt-3 inline-flex min-h-11 items-center font-bold text-red-700"
                >
                  {fact.link} →
                </Link>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
