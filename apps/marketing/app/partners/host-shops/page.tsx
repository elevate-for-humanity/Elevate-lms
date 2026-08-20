import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { ROUTES } from '@/lib/navigation/routes';
import { getApprovedShops, PROGRAM_LABELS } from '@/lib/programs/host-shops';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Apprenticeship Host Sites | Elevate for Humanity',
  description: 'Explore the shops and studios where Elevate apprentices train with approved professionals in real working environments.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/host-shops' },
};

const HOST_SITE_APPLY_HREF = '/host-shop/apply';
function address(shop: Awaited<ReturnType<typeof getApprovedShops>>[number]) { return [shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', '); }
function embedUrl(value: string) { return `https://www.google.com/maps?q=${encodeURIComponent(value)}&z=14&output=embed`; }
function firstImage(shop: Awaited<ReturnType<typeof getApprovedShops>>[number]) { return shop.mediaGallery?.[0]?.url || shop.flyerUrl || shop.logoUrl || null; }

export default async function HostShopsPage() {
  const shops = await getApprovedShops();
  const seenHeroImages = new Set<string>();
  const featured = shops.filter((shop) => {
    const image = firstImage(shop);
    if (!image || seenHeroImages.has(image)) return false;
    seenHeroImages.add(image);
    return true;
  }).slice(0, 3);

  return <main className="overflow-x-hidden bg-white text-slate-950">
    <section className="border-b border-slate-200 bg-gradient-to-b from-white via-white to-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-20">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-brand-red-700 sm:text-sm"><Sparkles className="h-4 w-4"/> Learn where the work happens</p>
          <h1 className="mt-4 text-4xl font-black leading-[.98] tracking-tight sm:text-5xl lg:text-6xl">Meet the shops.<br/>See the craft.<br/>Build your career.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Explore approved apprenticeship worksites and the businesses behind them. Each profile keeps the approved training facts separate from verified business-owned promotional media.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><a href="#shops" className="rounded-xl bg-brand-red-600 px-6 py-3.5 text-center font-black text-white">Explore Host Sites</a><Link href={HOST_SITE_APPLY_HREF} className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-center font-black">Become a Host Site</Link></div>
        </div>
        {featured.length ? <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {featured.map((shop,i) => {
            const img = firstImage(shop)!;
            return <Link key={shop.id} href={shop.publicSlug ? `/host-shops/${shop.publicSlug}`:'#shops'} className={`group relative min-w-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm sm:rounded-3xl ${i===0?'aspect-[16/10] sm:col-span-2':'aspect-[4/3]'}`}><img src={img} alt={`${shop.name} business media`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading={i === 0 ? 'eager' : 'lazy'} decoding="async"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 pt-16 text-white sm:p-5"><p className="break-words text-lg font-black sm:text-xl">{shop.name}</p><p className="text-sm font-semibold">{shop.city}, {shop.state}</p></div></Link>;
          })}
        </div> : null}
      </div>
    </section>

    <section id="shops" className="bg-slate-50 px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-9 lg:flex-row lg:items-end"><div><p className="text-sm font-black uppercase tracking-[.14em] text-brand-red-700">Host Site network</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">Find a place that feels like your future.</h2></div><p className="max-w-lg text-sm leading-6 text-slate-600">Every listing must map to an approved apprenticeship worksite record. Business descriptions and media are displayed only when they can be tied to that exact business.</p></div>
        {shops.length===0 ? <div className="rounded-2xl bg-white p-8">Host Site profiles are temporarily unavailable.</div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          {shops.map(shop=>{
            const a=address(shop); const image=firstImage(shop); const href=shop.publicSlug?`/host-shops/${shop.publicSlug}`:undefined;
            return <article key={shop.id} className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 sm:aspect-[16/11]">
                {image ? <img src={image} alt={`${shop.name} business media`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" decoding="async"/> : a ? <iframe title={`Map — ${shop.name}`} src={embedUrl(a)} className="h-full w-full border-0" loading="lazy"/> : <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">Verified business media not yet available.</div>}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black shadow sm:left-4 sm:top-4"><ShieldCheck className="h-4 w-4 text-emerald-700"/> Approved Host Site</span>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="break-words text-xl font-black sm:text-2xl">{shop.name}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red-700"/><span className="break-words">{shop.city}, {shop.state}</span></p>
                <div className="mt-4 flex flex-wrap gap-2">{shop.programs.map(slug=><span key={slug} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{PROGRAM_LABELS[slug]??slug}</span>)}</div>
                {shop.description ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{shop.description}</p>:null}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">{href?<Link href={href} className="inline-flex min-h-11 items-center gap-2 font-black text-brand-red-700">Explore this shop <ArrowRight className="h-4 w-4"/></Link>:<span/>}{shop.website?<a href={shop.website} target="_blank" rel="noopener noreferrer" aria-label={`${shop.name} website`} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200"><ExternalLink className="h-4 w-4"/></a>:null}</div>
              </div>
            </article>;
          })}
        </div>}
      </div>
    </section>

    <section className="px-4 py-12 sm:px-6 sm:py-16"><div className="mx-auto max-w-7xl rounded-2xl bg-brand-red-600 px-5 py-10 text-center text-white sm:rounded-[2rem] sm:px-10 sm:py-12"><p className="text-sm font-black uppercase tracking-[.16em] text-white/80">For shop owners</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Turn your shop into a place where careers begin.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-white/90">Bring apprentices into a real working environment, mentor emerging professionals and grow the talent pipeline for your industry.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap"><Link href={HOST_SITE_APPLY_HREF} className="rounded-xl bg-white px-7 py-3.5 font-black text-slate-950">Apply to become a Host Site</Link><a href={ROUTES.hostShopPortal} className="rounded-xl border border-white/40 px-7 py-3.5 font-black text-white">Host Site Portal</a></div></div></section>
  </main>;
}
