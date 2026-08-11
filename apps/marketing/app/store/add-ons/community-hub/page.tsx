import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, CalendarDays, MessageSquare, ShieldCheck, Trophy, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InteractiveCommunityDemo } from '@/components/store/InteractiveCommunityDemo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Community Hub | Branded Community, Groups, Events & Memberships | Elevate',
  description: 'Launch a branded community with posts, discussions, groups, events, member engagement, gamification, AI support and free or paid membership tiers.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/add-ons/community-hub' },
};

const capabilities = [
  { icon: MessageSquare, title: 'Community feed', description: 'Members publish updates, questions, milestones, comments, tags, media, and likes in a tenant-owned community.' },
  { icon: Users, title: 'Groups & discussions', description: 'Create public or gated groups for programs, cohorts, certifications, memberships, and shared goals.' },
  { icon: CalendarDays, title: 'Events & RSVP', description: 'Run orientations, workshops, webinars, networking, community sessions, and cohort events in one system.' },
  { icon: Trophy, title: 'Points & leaderboards', description: 'Learning and engagement can feed the same gamification layer for points, levels, streaks, and leaderboards.' },
  { icon: Award, title: 'Badges & milestones', description: 'Recognize onboarding, learning, attendance, credentials, career milestones, and constructive community participation.' },
  { icon: ShieldCheck, title: 'Moderation & access', description: 'Operators manage posts, groups, events, free/paid access levels and flagged content from the same platform.' },
];

export default function CommunityHubPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Community Hub' }]} />
      </div>

      <section className="border-y border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">Community Hub · $39/month add-on</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Build the community around your business—not another disconnected app.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">Posts, groups, discussions, events, courses, member access, gamification and your AI Team work inside the same Elevate workspace. Start with a community now and add CRM, websites, payments, courses, workforce or apprenticeship operations when you need them.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/store/demo/community" className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-black text-white hover:bg-violet-800">Try Community Demo <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/store/trial?product=community-hub" className="rounded-xl border border-violet-300 bg-white px-6 py-3 font-black text-violet-900 hover:bg-violet-50">Start Community Trial</Link>
              <Link href="/store/plans?addon=community-hub" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-black text-slate-800 hover:bg-slate-50">Add Community — $39/mo</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-700">
              {['No fake production data in the demo', 'Free + paid access tiers', 'Stripe Connect ready', 'PARIS · ELLIE · LIZZY · ZORA roles'].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</span>)}
            </div>
          </div>

          <div className="rounded-[2rem] border border-violet-200 bg-white p-5 shadow-xl shadow-violet-100/60">
            <div className="rounded-2xl bg-gradient-to-br from-violet-700 to-cyan-600 p-5 text-white">
              <div className="text-xs font-black uppercase tracking-widest text-violet-100">AI Team in Community</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-white/15 p-3"><strong>PARIS</strong><span className="ml-2 text-sm">welcomes, qualifies, and guides new members.</span></div>
                <div className="rounded-xl bg-white/15 p-3"><strong>ELLIE</strong><span className="ml-2 text-sm">supports courses, Q&A, and resource recommendations.</span></div>
                <div className="rounded-xl bg-white/15 p-3"><strong>LIZZY</strong><span className="ml-2 text-sm">runs engagement, events, nudges, and community operations.</span></div>
                <div className="rounded-xl bg-white/15 p-3"><strong>ZORA</strong><span className="ml-2 text-sm">supports moderation, governance, and policy review.</span></div>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium leading-6 text-slate-600">The assistants are not separate community-only bots. They use the same Elevate AI Team architecture across the rest of the organization workspace.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-black text-slate-950">What the subscription unlocks</h2>
            <p className="mt-3 leading-7 text-slate-600">Community Hub is now a canonical platform entitlement rather than a descriptive Store page with no subscription SKU.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-7 w-7 text-violet-700" />
                <h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-violet-700">Member journey</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Join → Community → Course → Event → Progress → AI Team</h2>
            <p className="mt-4 leading-7 text-slate-600">Free, paid, premium, VIP and cohort access can gate groups, resources, events and learning experiences while preserving a single member identity.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-700">Owner journey</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Build → Connect Stripe → Create Offer → Publish → Get Paid</h2>
            <p className="mt-4 leading-7 text-slate-600">Tenant-owned Stripe Connect and tenant offers let organizations sell their own memberships from the same platform rather than routing member revenue through an Elevate product checkout.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-widest text-violet-700">Try the product</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">The demo is the product experience.</h2>
            <p className="mt-3 leading-7 text-slate-600">Create a sample community, post, group, member, course, ELLIE response and membership offer. Your sandbox state is preserved when you move into the trial.</p>
          </div>
          <InteractiveCommunityDemo />
        </div>
      </section>

      <section className="px-4 pb-20 pt-6 text-center">
        <div className="mx-auto max-w-3xl rounded-3xl border border-violet-200 bg-violet-50 p-8">
          <h2 className="text-3xl font-black text-slate-950">Community Hub is $39/month.</h2>
          <p className="mt-4 leading-7 text-slate-700">Start with the interactive sandbox. Keep the build in your 14-day workspace trial. Choose a base plan and add Community Hub when you are ready to activate the subscription.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/store/demo/community" className="rounded-xl bg-violet-700 px-6 py-3 font-black text-white">Try the Demo</Link>
            <Link href="/store/plans?addon=community-hub" className="rounded-xl border border-violet-300 bg-white px-6 py-3 font-black text-violet-900">Choose Plan + Community</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
