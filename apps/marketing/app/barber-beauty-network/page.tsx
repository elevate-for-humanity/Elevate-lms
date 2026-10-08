import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BriefcaseBusiness, MessageCircle, Scissors, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Barber & Beauty Network | Elevate for Humanity',
  description: 'Connect with barbers, stylists, nail technicians, estheticians, licensed host shops and beauty employers. Explore the directory, community and hiring opportunities.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/barber-beauty-network' },
};

const pathways = [
  { title: 'Community & Professional Groups', description: 'Connect with other learners and industry professionals through the authenticated Elevate community. Sign-in may be required.', href: 'https://app.elevateforhumanity.org/lms/community', action: 'Open member community', icon: MessageCircle },
  { title: 'Barber & Beauty Directory', description: 'Explore participating host shops, salons, barbershops, nail studios and esthetics businesses.', href: '/partners/host-shops', action: 'Explore directory', icon: Scissors },
  { title: 'Jobs & Opportunities', description: 'Browse available employer job postings across the Elevate network. Listings depend on approved employers.', href: '/jobs', action: 'Find opportunities', icon: BriefcaseBusiness },
  { title: 'Employers & Host Shops', description: 'Connect your business to apprentices and talent, apply to host apprentices, and access employer hiring tools.', href: '/host-shop/apply', action: 'Join as a host shop', icon: Users },
] as const;

export default function BarberBeautyNetworkPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <Image src="/images/pages/barber-shop-interior.webp" alt="Professional barber and beauty workspace" fill priority sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="text-sm font-black uppercase tracking-[.16em] text-blue-200">Elevate Professional Network</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Barber & Beauty Network</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100">A professional community for barbers, cosmetologists, estheticians, nail technicians, students, host shops and hiring businesses. Build connections, find opportunities and showcase the beauty industry.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="https://app.elevateforhumanity.org/lms/community" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-red-700 px-6 py-3 font-bold text-white hover:bg-red-600">Enter Community <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/partners/host-shops" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/60 px-6 py-3 font-bold text-white hover:bg-white/10">Browse Directory <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Connect, learn and grow</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700">Choose where you want to go. Community conversations require a member account; directory listings and job opportunities are shown separately.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {pathways.map(({ title, description, href, action, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon aria-hidden="true" className="h-8 w-8 text-blue-700" />
              <h3 className="mt-4 text-2xl font-bold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-700">{description}</p>
              <Link href={href} className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-red-700">{action} <ArrowRight className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/employers" className="font-bold text-blue-700 underline underline-offset-4">Employer resources</Link>
          <Link href="/barber-and-beauty-apprenticeships" className="font-bold text-blue-700 underline underline-offset-4">Beauty apprenticeships</Link>
        </div>
      </section>
    </main>
  );
}
