'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPublicPageFacts } from '@/lib/marketing/public-page-facts';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';

export default function PublicPageFacts() {
  const pathname = usePathname() || '/';
  const content = getPublicPageFacts(pathname);
  const slug = content.imageProgram || 'business-administration';
  const store = pathname.startsWith('/store');
  return <section aria-labelledby="page-facts-heading" className="border-t border-slate-200 bg-white px-4 py-10 sm:py-14">
    <div className="mx-auto grid max-w-6xl items-start gap-7 md:grid-cols-[0.8fr_1.2fr]">
      <div><div className="relative mx-auto max-w-[300px] aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100"><Image src={store ? '/images/pages/store-guide-1.webp' : getProgramHeroImage(slug)} alt={store ? 'Business professionals collaborating at a laptop' : getProgramImageAlt(slug)} fill sizes="(min-width: 768px) 40vw, 100vw" loading="lazy" className="object-cover" /></div><p className="mt-3 text-sm text-slate-600">Find the facts and your next step in one place.</p></div>
      <div><h2 id="page-facts-heading" className="text-2xl font-black sm:text-3xl">{content.title}</h2><div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
        {content.facts.map((fact) => <details key={fact.question} className="group p-4 open:bg-slate-50"><summary className="cursor-pointer py-2 font-bold text-slate-950">{fact.question}</summary><p className="mt-2 text-sm leading-6 text-slate-700">{fact.answer}</p><Link href={fact.href} className="mt-3 inline-flex min-h-11 items-center font-bold text-red-700">{fact.link} →</Link></details>)}
      </div></div>
    </div>
  </section>;
}
