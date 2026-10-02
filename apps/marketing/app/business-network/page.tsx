import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  GraduationCap,
  Handshake,
  Network,
  Users,
} from 'lucide-react';

export const metadata = {
  title: 'Business Network | Elevate for Humanity',
  description:
    'A focused network for employers, entrepreneurs, small businesses, hiring partners, and apprenticeship hosts.',
};

const paths = [
  {
    icon: Building2,
    title: 'Employers',
    eyebrow: 'Hire & Develop Talent',
    text: 'Connect with trained candidates, workforce pathways, work-based learning, and employer support.',
    href: '/employers',
    image: '/images/pages/employer-page-1.webp',
    imageAlt: 'Employer reviewing workforce and hiring information',
  },
  {
    icon: GraduationCap,
    title: 'Apprenticeship Hosts',
    eyebrow: 'Train & Mentor',
    text: 'Become a Host Site, train apprentices, document progress, and participate in supervised work-based learning.',
    href: '/host-shop/apply',
    image: '/images/pages/barber-apprentice-learning.webp',
    imageAlt: 'Apprentice receiving hands-on instruction from a professional',
  },
  {
    icon: Users,
    title: 'Business Owners',
    eyebrow: 'Grow & Connect',
    text: 'Build visibility, access business resources, explore partnerships, and connect your company to the Elevate network.',
    href: '/business-network/business-owners',
    image: '/images/pages/business-sector.webp',
    imageAlt: 'Business professionals working together',
  },
  {
    icon: Camera,
    title: 'Business Community',
    eyebrow: 'Post & Share',
    text: 'Join the community feed to post updates, upload and share photos or videos, comment, connect, and join discussions.',
    href: '/lms/community',
    image: '/images/pages/community-page-1.webp',
    imageAlt: 'Community members connecting and sharing updates',
  },
];

const benefits = [
  'Candidate and talent connections',
  'Apprenticeship and Host Site pathways',
  'Work-based learning opportunities',
  'Business and employer resources',
  'Community posts, photos, videos and discussions',
  'Partnership and referral support',
];

export default function BusinessNetworkPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <Image
            src="/images/pages/admin-employers-hero.webp"
            alt="Business leaders collaborating on workforce and hiring opportunities"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-35"
          />
          <div className="absolute inset-0 bg-slate-950/65" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,.36),transparent_42%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-blue-200">
              <Network className="h-4 w-4" />
              Elevate Business Network
            </div>
            <h1 className="max-w-4xl font-serif text-5xl font-black leading-[.98] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
              Business, talent and workforce opportunity in one network.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-200 sm:text-xl">
              One entry point for employers, entrepreneurs, small businesses, and apprenticeship
              partners who want to hire, train, grow, share their work, or participate in workforce
              programs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#join"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-500"
              >
                Choose Your Path <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/lms/community"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3 font-black text-white backdrop-blur transition hover:bg-white/10"
              >
                Open Community <Camera className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-200">
              What this page does
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Choose the right business pathway without guessing where to go.
            </h2>
            <p className="mt-4 leading-7 text-slate-200">
              Use this page as the front door to employer hiring resources, apprenticeship Host
              Site participation, business-owner support, and the member community.
            </p>
            <ul className="mt-6 space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-100">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section id="join" className="bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">
              Choose your path
            </p>
            <h2 className="mt-3 font-serif text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Start with what you want to do.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Every card below opens a real working area of the platform. Choose the role or
              activity that matches your goal.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {paths.map(({ icon: Icon, ...p }) => (
              <Link
                key={p.title}
                href={p.href}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <Image
                    src={p.image}
                    alt={p.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-6 pb-5 pt-12">
                    <p className="text-xs font-black uppercase tracking-[.18em] text-blue-200">
                      {p.eyebrow}
                    </p>
                  </div>
                </div>
                <div className="p-7 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="font-serif text-3xl font-black text-slate-950">{p.title}</h3>
                  </div>
                  <p className="mt-4 text-base leading-7 text-slate-600">{p.text}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-black text-blue-700">
                    Open {p.title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">
              Community
            </p>
            <h2 className="mt-3 font-serif text-4xl font-black tracking-tight text-slate-950">
              Show your work. Share updates. Connect with people in the network.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The Elevate community is not just a discussion board. Members can create posts,
              upload photos, videos or files, add captions and tags, like and comment on posts,
              participate in groups, and start discussions.
            </p>
            <Link
              href="/lms/community"
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-black text-white hover:bg-slate-800"
            >
              Go to the Community <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl shadow-xl">
            <Image
              src="/images/pages/community-page-2.webp"
              alt="People building connections through a professional community"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
