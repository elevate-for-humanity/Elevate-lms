import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, Users } from 'lucide-react';

export const metadata = {
  title: 'Business Network | Elevate for Humanity',
  description: 'A focused network for employers, entrepreneurs, small businesses, hiring partners, and apprenticeship hosts.',
};

const paths = [
  { icon: Building2, title: 'Employers', text: 'Connect with trained candidates and workforce pathways.', href: '/employers' },
  { icon: GraduationCap, title: 'Apprenticeship Hosts', text: 'Explore supervised work-based learning and Host Site participation.', href: '/host-shop/apply' },
  { icon: Users, title: 'Business Owners', text: 'Build visibility and connect with Elevate business resources.', href: '/contact?topic=business-network' },
];

export default function BusinessNetworkPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,.32),transparent_42%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[.2em] text-blue-300">Elevate Business Network</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">Business, talent and workforce opportunity in one network.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">For employers, entrepreneurs, small businesses and apprenticeship partners. Choose the path that matches what you want to do.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="#join" className="rounded-xl bg-blue-600 px-6 py-3 font-black">Join the Network</Link><Link href="/employers" className="rounded-xl border border-white/30 px-6 py-3 font-black">Employer Resources</Link></div>
        </div>
      </section>
      <section id="join" className="bg-white px-4 py-16 text-slate-950"><div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">{paths.map(({icon:Icon,...p})=><Link key={p.title} href={p.href} className="group rounded-3xl border border-slate-200 p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><Icon className="h-9 w-9 text-blue-700"/><h2 className="mt-5 text-2xl font-black">{p.title}</h2><p className="mt-3 leading-7 text-slate-600">{p.text}</p><span className="mt-6 inline-flex items-center gap-2 font-black text-blue-700">Get started <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></span></Link>)}</div></section>
    </main>
  );
}
