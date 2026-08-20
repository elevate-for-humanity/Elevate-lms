import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
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

export default async function HostShopsPage() {
  const shops = await getApprovedShops();
  const featured = shops.filter((s) => (s.mediaGallery?.length ?? 0) > 0 || s.logoUrl || s.flyerUrl || s.videoUrl);

  return <main className="min-h-screen bg-white text-slate-950">
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[.16em] text-brand-red-700"><Sparkles className="h-4 w-4"/> Learn where the work happens</p>
          <h1 className="mt-4 text-5xl font-black leading-[.96] tracking-tight sm:text-6xl">Meet the shops.<br/>See the craft.<br/>Build your career.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Apprentices learn inside real barbershops, salons and beauty studios. Explore the businesses, their work and the environments where hands-on training happens.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="#shops" className="rounded-xl bg-brand-red-600 px-6 py-3.5 font-black text-white">Explore Host Sites</a><Link href={HOST_SITE_APPLY_HREF} className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-black">Become a Host Site</Link></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featured.slice(0,4).map((shop,i) => {
            const img=shop.mediaGallery?.[0]?.url || shop.flyerUrl || shop.logoUrl;
            return img ? <Link key={shop.id} href={shop.publicSlug ? `/host-shops/${shop.publicSlug}`:'#shops'} className={`group relative overflow-hidden rounded-3xl bg-slate-100 ${i===0?'col-span-2 h-72':'h-52'}`}><img src={img} alt={`${shop.name} work and studio`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-14 text-white"><p className="text-xl font-black">{shop.name}</p><p className="text-sm font-semibold">{shop.city}, {shop.state}</p></div></Link>:null;
          })}
        </div>
      </div>
    </section>

    <section id="shops" className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-black uppercase tracking-[.14em] text-brand-red-700">Host Site network</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">Find a place that feels like your future.</h2></div><p className="max-w-lg text-sm leading-6 text-slate-600">Each location below is connected to an approved apprenticeship worksite record. Open a profile to see more of the shop and training environment.</p></div>
        {shops.length===0 ? <div className="rounded-2xl bg-white p-8">Host Site profiles are temporarily unavailable.</div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shops.map(shop=>{
            const a=address(shop); const media=shop.mediaGallery??[]; const image=media[0]?.url||shop.flyerUrl||shop.logoUrl; const href=shop.publicSlug?`/host-shops/${shop.publicSlug}`:undefined;
            return <article key={shop.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-64 overflow-hidden bg-slate-100">
                {image ? <img src={image} alt={`${shop.name} gallery`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : a ? <iframe title={`Map — ${shop.name}`} src={embedUrl(a)} className="h-full w-full border-0" loading="lazy"/> : null}
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black shadow"><ShieldCheck className="h-4 w-4 text-emerald-700"/> Approved Host Site</span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-black">{shop.name}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red-700"/>{shop.city}, {shop.state}</p>
                <div className="mt-4 flex flex-wrap gap-2">{shop.programs.map(slug=><span key={slug} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{PROGRAM_LABELS[slug]??slug}</span>)}</div>
                {shop.description ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{shop.description}</p>:null}
                <div className="mt-6 flex items-center justify-between gap-3">{href?<Link href={href} className="inline-flex items-center gap-2 font-black text-brand-red-700">Explore this shop <ArrowRight className="h-4 w-4"/></Link>:<span/>}{shop.website?<a href={shop.website} target="_blank" rel="noopener noreferrer" aria-label={`${shop.name} website`} className="rounded-lg border border-slate-200 p-2.5"><ExternalLink className="h-4 w-4"/></a>:null}</div>
              </div>
            </article>;
          })}
        </div>}
      </div>
    </section>

    <section className="px-4 py-16 sm:px-6"><div className="mx-auto max-w-7xl rounded-[2rem] bg-brand-red-600 px-6 py-12 text-center text-white sm:px-10"><p className="text-sm font-black uppercase tracking-[.16em] text-white/80">For shop owners</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Turn your shop into a place where careers begin.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-white/90">Bring apprentices into a real working environment, mentor emerging professionals and grow the talent pipeline for your industry.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href={HOST_SITE_APPLY_HREF} className="rounded-xl bg-white px-7 py-3.5 font-black text-slate-950">Apply to become a Host Site</Link><a href={ROUTES.hostShopPortal} className="rounded-xl border border-white/40 px-7 py-3.5 font-black text-white">Host Site Portal</a></div></div></section>
  </main>;
}
