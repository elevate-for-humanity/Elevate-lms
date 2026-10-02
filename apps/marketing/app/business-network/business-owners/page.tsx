import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Megaphone,
  Network,
  Store,
  Users,
} from 'lucide-react';

export const metadata = {
  title: 'Business Owners Network | Elevate for Humanity',
  description:
    'Business-owner resources, visibility, workforce connections, community participation, and partnership pathways through Elevate for Humanity.',
};

const resources = [
  {
    icon: Users,
    title: 'Workforce & Talent',
    text: 'Connect your business to employer resources, talent pipelines, and workforce opportunities.',
    href: '/employers',
  },
  {
    icon: Network,
    title: 'Business Community',
    text: 'Post updates, share photos or videos, connect with members, and participate in discussions.',
    href: '/lms/community',
  },
  {
    icon: Store,
    title: 'Business Tools',
    text: 'Explore available digital products, platform tools, and business-support resources.',
    href: '/store',
  },
  {
    icon: Megaphone,
    title: 'Partnership Support',
    text: 'Request partnership, referral, outreach, or business-network support from Elevate.',
    href: '/contact?topic=business-network',
  },
];

export default function BusinessOwnersNetworkPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <Image
            src="/images/pages/business-sector.webp"
            alt="Business owners collaborating and planning growth"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-slate-950/70" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-200">
            Elevate Business Network
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl font-black tracking-tight text-white sm:text-6xl">
            A full network for business owners who want visibility, resources, and stronger connections.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
            Use this space to connect your business to workforce opportunities, the Elevate community,
            partnership support, and business tools without being routed through a generic contact page.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/lms/community"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-500"
            >
              Join the Community <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/business-network"
              className="inline-flex min-h-12 items-center rounded-xl border border-white/30 px-6 py-3 font-black text-white hover:bg-white/10"
            >
              Back to Business Network
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2">
            {resources.map(({ icon: Icon, title, text, href }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <Icon className="h-8 w-8 text-blue-700" />
                <h2 className="mt-5 font-serif text-3xl font-black text-slate-950">{title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-black text-blue-700">
                  Open {title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[380px] overflow-hidden rounded-3xl shadow-xl">
            <Image
              src="/images/pages/community-page-1.webp"
              alt="Professional community members connecting and sharing"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">
              Share your business
            </p>
            <h2 className="mt-3 font-serif text-4xl font-black text-slate-950">
              Post photos, updates, wins, events, and opportunities.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The community supports member posts with images, videos, files, tags, likes, comments,
              groups, and discussions. That gives business owners a real place to show what they do
              and build relationships inside the network.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Upload and share photos or videos',
                'Post business updates and opportunities',
                'Like and comment on community posts',
                'Join groups and professional discussions',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 font-semibold text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
