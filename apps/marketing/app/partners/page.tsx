import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PublicEditorialHero } from '@/components/marketing/PublicEditorialHero';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { VerifiedVendorLogos } from '@/components/marketing/VerifiedVendorLogos';

export const metadata: Metadata = {
  title: 'Employer & Workforce Partnerships',
  description: 'Explore employer, workforce agency, training provider, and host shop partnerships with Elevate for Humanity.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners' },
};

const partnerships = [
  { title: 'Employers', text: 'Connect with candidates, post open positions, and discuss your workforce training needs.', href: '/employers', action: 'Explore employer services', image: '/images/programs/refresh-20261101/employers.webp', alt: 'Illustrative employer and workforce collaboration scene' },
  { title: 'Workforce agencies', text: 'Explore participant referrals, program requirements, and workforce coordination.', href: '/for-agencies', action: 'Explore agency partnerships', image: '/images/programs/refresh-20261101/business.webp', alt: 'Illustrative workforce planning scene' },
  { title: 'Training providers', text: 'Apply to deliver training through the program-holder network. Share your programs, credentials, and delivery capacity for review.', href: '/apply/program-holder', action: 'Apply as a program holder', image: '/images/about-training-20261102.webp', alt: 'Illustrative adult career education scene' },
  { title: 'Host shops & salons', text: 'Find or become a host shop. Connect related instruction with supervised on-the-job learning in barber and beauty apprenticeships.', href: '/partners/host-shops', action: 'Find or become a host shop', image: '/images/programs/refresh-20261101/beauty.webp', alt: 'Illustrative barber and beauty training scene' },
];

export default function PartnersPage() {
  return <main className="min-h-screen bg-white text-slate-950">
    <div className="mx-auto max-w-6xl px-4 py-3"><Breadcrumbs items={[{ label: 'Partnerships' }]} /></div>
    <PublicEditorialHero eyebrow="Employer & workforce partnerships" title="Build opportunity together." description="Choose the partnership that fits your organization. We connect employers, workforce agencies, training providers, and host shops with career education and practical support." image="/images/programs/refresh-20261101/employers.webp" imageAlt="Illustrative scene of workforce partners collaborating">
      <Link href="#partnership-options" className="inline-flex min-h-11 items-center rounded-lg bg-brand-red-700 px-5 py-3 font-bold text-white hover:bg-brand-red-800">Find your partnership</Link>
      <Link href="/contact" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-950">Talk with our team</Link>
    </PublicEditorialHero>
    <section id="partnership-options" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-12">
      <h2 className="mb-7 text-3xl font-bold">Where does your organization fit?</h2>
      <div className="grid gap-6 md:grid-cols-2">{partnerships.map(item => <article key={item.title} className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="relative aspect-[2/1]"><Image src={item.image} alt={item.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /></div>
        <div className="p-6"><h3 className="text-2xl font-bold">{item.title}</h3><p className="mt-3 leading-7 text-slate-700">{item.text}</p><Link href={item.href} className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700 hover:underline">{item.action} <ArrowRight className="h-4 w-4" /></Link></div>
      </article>)}</div>
    </section>
    <VerifiedVendorLogos />
    <section className="bg-slate-50 px-4 py-12"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6"><div><h2 className="text-2xl font-bold">Looking for the workforce platform?</h2><p className="mt-3 max-w-2xl leading-7 text-slate-700">Explore the technology, portal options, and licensing plans supporting training organizations.</p></div><Link href="/platform" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-red-700 px-5 py-3 font-bold text-white hover:bg-brand-red-800">Explore the platform <ArrowRight className="h-4 w-4" /></Link></div></section>
  </main>;
}
