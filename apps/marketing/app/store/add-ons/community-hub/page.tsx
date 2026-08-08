import { Metadata } from 'next';
import Link from 'next/link';
import { Award, CalendarDays, MessageSquare, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Community Hub | Elevate Platform',
  description: 'Community feed, study groups, discussions, events, points, badges, leaderboards, and moderation connected to the Elevate learning platform.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/add-ons/community-hub' },
};

const capabilities = [
  { icon: MessageSquare, title: 'Live community feed', description: 'Authenticated learners can publish updates, questions, milestones, comments, tags, and likes from the LMS community workspace.' },
  { icon: Users, title: 'Study groups', description: 'Learners can create and join study groups for programs, certifications, cohorts, and career goals.' },
  { icon: MessageSquare, title: 'Structured discussions', description: 'Forum categories and discussion topics provide a durable Q&A and resource-sharing layer beyond the activity feed.' },
  { icon: Trophy, title: 'Points, levels & leaderboards', description: 'Community activity and learning milestones feed one idempotent gamification ledger and global or course-scoped leaderboards.' },
  { icon: Award, title: 'Canonical badges', description: 'Badges recognize onboarding, learning, attendance, credentials, career milestones, and constructive community participation.' },
  { icon: CalendarDays, title: 'Events & RSVP', description: 'Orientations, workshops, webinars, networking, career events, and community sessions share one event and registration system.' },
  { icon: ShieldCheck, title: 'Operator moderation', description: 'Authorized staff manage real learner posts, groups, discussions, and engagement activity from the Admin community workspace.' },
];

export default function CommunityHubPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4"><Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Community Hub' }]} /></div>

      <section className="border-y border-slate-200 bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Connected platform capability</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black md:text-6xl">Community belongs inside learning—not beside it.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Elevate connects community activity to courses, events, progress, badges, credentials, and the AI Team. It is built as part of the platform experience rather than a separate social-product demo.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/platform" className="rounded-xl bg-brand-blue-600 px-6 py-3 font-black text-white hover:bg-brand-blue-700">Explore the platform</Link><Link href="/contact" className="rounded-xl border border-white/30 px-6 py-3 font-black text-white hover:bg-white/10">Talk with Elevate</Link></div>
        </div>
      </section>

      <section className="px-4 py-16"><div className="mx-auto max-w-6xl"><div className="mb-10 max-w-3xl"><h2 className="text-3xl font-black text-slate-950">What is implemented</h2><p className="mt-3 leading-7 text-slate-600">These capabilities use the same production data model as the learner LMS and operator Admin workspace. No demo engagement statistics or separate one-time source-code pricing are used on this page.</p></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{capabilities.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Icon className="h-7 w-7 text-brand-blue-600" /><h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div></div></section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-16"><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2"><div><p className="text-xs font-black uppercase tracking-widest text-brand-blue-700">Learner experience</p><h2 className="mt-2 text-3xl font-black text-slate-950">Home → Community → Learn → Events → Progress → AI Team</h2><p className="mt-4 leading-7 text-slate-600">Community is a daily destination in the same learner shell as coursework, event registration, progress, and PARIS/ELLIE/LIZZY/ZORA.</p></div><div><p className="text-xs font-black uppercase tracking-widest text-brand-blue-700">Organization experience</p><h2 className="mt-2 text-3xl font-black text-slate-950">CRM → Community → Courses → Website → Automations → AI Team → Reports</h2><p className="mt-4 leading-7 text-slate-600">Operators can manage the community alongside the rest of the organization workflow, with workforce, apprenticeship, testing, compliance, employers, and Dev Studio retained as specialized modules.</p></div></div></section>

      <section className="px-4 py-16 text-center"><div className="mx-auto max-w-3xl"><h2 className="text-3xl font-black text-slate-950">Pricing stays with the canonical platform catalog</h2><p className="mt-4 leading-7 text-slate-600">Community availability is determined by the active Elevate platform offering and organization configuration. This page no longer publishes a separate hard-coded purchase amount that can drift from checkout.</p><div className="mt-6 flex justify-center gap-3"><Link href="/pricing" className="rounded-xl bg-slate-950 px-6 py-3 font-black text-white">View platform pricing</Link><Link href="/store" className="rounded-xl border border-slate-300 px-6 py-3 font-black text-slate-800">Browse Store</Link></div></div></section>
    </main>
  );
}
