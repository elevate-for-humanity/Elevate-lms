import Link from 'next/link';
import { Award, BadgeCheck, MapPin, Search, Store, WalletCards } from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';
import { getVerifiedProgramFunding } from '@/lib/programs/funding-registry';
import { buildProgramSearchFaqs } from '@/lib/seo/program-search-faqs';

export default function BeautyProgramSearchSection({ program }: { program: ProgramSchema }) {
  const hosts = FEATURED_BEAUTY_HOST_PARTNERS.filter((shop) => shop.programs.includes(program.slug));
  const verifiedFunding = getVerifiedProgramFunding(program.slug);
  const workforceFunded = Boolean(
    verifiedFunding?.etplListedFor2Exclusive &&
      (verifiedFunding.wioaEligible || verifiedFunding.wrgEligible),
  );
  const registered = program.complianceAlignment?.some((item) => /DOL Registered Apprenticeship/i.test(item.standard));
  const credential = program.credentials?.[0]?.name ?? 'program credential';
  const faqs = buildProgramSearchFaqs(program);

  return (
    <section className="border-y border-slate-200 bg-gradient-to-b from-white to-rose-50/40 py-14" aria-labelledby={`${program.slug}-search-heading`}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-rose-700">
            <Search className="h-4 w-4" /> Indiana Beauty & Grooming Pathway
          </p>
          <h2 id={`${program.slug}-search-heading`} className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {program.title} in Indiana
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-700">
            Find the verified program facts, host-shop pathway, credential target, and funding status in one crawlable place. Elevate separates each beauty track so applicants, Google, and AI search engines can identify the exact pathway without relying on a generic beauty-program page.
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <BadgeCheck className="h-5 w-5 text-blue-700" />
            <div className="mt-3 text-sm font-black text-slate-950">{registered ? 'DOL Registered Apprenticeship' : 'Structured Career Program'}</div>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Program status is drawn from the canonical program compliance record.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Award className="h-5 w-5 text-violet-700" />
            <div className="mt-3 text-sm font-black text-slate-950">{credential}</div>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Credential preparation remains subject to current licensing requirements.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <WalletCards className="h-5 w-5 text-emerald-700" />
            <div className="mt-3 text-sm font-black text-slate-950">{workforceFunded ? 'Agency funding review available' : 'Funding reviewed separately'}</div>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">No page promises funding unless the verified funding registry supports the track.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Store className="h-5 w-5 text-amber-700" />
            <div className="mt-3 text-sm font-black text-slate-950">{hosts.length} published host partner{hosts.length === 1 ? '' : 's'}</div>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Host availability varies by city, capacity, and approval status.</p>
          </div>
        </div>

        {hosts.length > 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Local search network</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">Approved host shops for this track</h3>
              </div>
              <Link href="/host-shops" className="text-sm font-black text-rose-700 hover:text-rose-800">View host-shop network →</Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {hosts.map((shop) => (
                <Link key={shop.slug} href={`/host-shops/${shop.slug}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-rose-300 hover:bg-rose-50/60">
                  <div className="font-black text-slate-950">{shop.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600"><MapPin className="h-4 w-4" /> {shop.city}, {shop.state}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Frequently searched questions</p>
          <div className="mt-4 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer list-none font-black text-slate-950">{faq.question}</summary>
                <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-slate-700">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
