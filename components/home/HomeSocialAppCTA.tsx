import Link from 'next/link';
import { Download, Facebook, Linkedin, Youtube } from 'lucide-react';
import { SOCIAL_LINKS } from '@/config/social-links';

const SOCIAL_ACTIONS = [
  {
    label: 'Follow on Facebook',
    description: 'Get program news, events, success stories, and enrollment updates.',
    href: SOCIAL_LINKS.facebook,
    icon: Facebook,
    className: 'bg-blue-700 hover:bg-blue-800',
  },
  {
    label: 'Watch on YouTube',
    description: 'See program videos, platform demonstrations, and practical guidance.',
    href: SOCIAL_LINKS.youtube,
    icon: Youtube,
    className: 'bg-red-600 hover:bg-red-700',
  },
  {
    label: 'Connect on LinkedIn',
    description: 'Follow Elevate’s business, workforce, and partnership announcements.',
    href: SOCIAL_LINKS.linkedin,
    icon: Linkedin,
    className: 'bg-sky-800 hover:bg-sky-900',
  },
] as const;

export function HomeSocialAppCTA() {
  return (
    <section className="border-y border-slate-200 bg-slate-950 px-4 py-12 text-white" aria-labelledby="follow-elevate-heading">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Stay Connected</p>
          <h2 id="follow-elevate-heading" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Follow Elevate and take the platform with you.</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-slate-300">Follow the official Elevate business channels, watch product and program demos, and install the Elevate app on your phone or tablet.</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SOCIAL_ACTIONS.map((action) => (
            <a key={action.label} href={action.href} target="_blank" rel="noopener noreferrer" className={`rounded-2xl p-5 text-white shadow-lg transition hover:-translate-y-0.5 ${action.className}`}>
              <action.icon className="h-7 w-7" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-black">{action.label}</h3>
              <p className="mt-2 text-sm leading-6 text-white/90">{action.description}</p>
            </a>
          ))}

          <Link href="/mobile-app" className="rounded-2xl bg-emerald-700 p-5 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-800">
            <Download className="h-7 w-7" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-black">Download / Install the App</h3>
            <p className="mt-2 text-sm leading-6 text-white/90">Get iPhone, iPad, and Android installation steps and open Elevate from your home screen.</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
