import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, CalendarDays, MessageSquare, ShieldCheck, Trophy, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InteractiveCommunityDemo } from '@/components/store/InteractiveCommunityDemo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Community Hub Preview | Groups, Discussions & Engagement | Elevate',
  description: 'Preview Elevate Community Hub capabilities for posts, discussions, groups, engagement and gamification. Managed activation is available while tenant-level paid access enforcement is finalized.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/add-ons/community-hub' },
};

const capabilities = [
  { icon: MessageSquare, title: 'Community feed', description: 'Members can publish updates, questions, milestones, comments, tags, media and likes.' },
  { icon: Users, title: 'Groups & discussions', description: 'Community tools support groups, cohorts, professional interests and structured discussions.' },
  { icon: CalendarDays, title: 'Events & engagement', description: 'The community data model supports events and member engagement workflows alongside learning.' },
  { icon: Trophy, title: 'Points & leaderboards', description: 'Learning and engagement can feed the existing gamification layer for points and leaderboards.' },
  { icon: Award, title: 'Badges & milestones', description: 'The platform can recognize learning, attendance, credentials and community milestones.' },
  { icon: ShieldCheck, title: 'Moderation foundation', description: 'Moderation, reporting and access data structures are present while commercial tenant-level enforcement is being completed.' },
];

export default function CommunityHubPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Community Hub Preview' }]} />
      </div>

      <section className="border-y border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-4 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">Community Hub · Managed Preview</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Build community around learning and work without adding another disconnected identity system.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">The community experience, social-learning components and supporting data structures are present in Elevate. Self-service paid activation is intentionally paused until tenant-level entitlement enforcement controls the learner community end to end.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/store/demo/community" className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-black text-white hover:bg-violet-800">Try Community Demo <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/contact?subject=Community%20Hub%20Managed%20Preview" className="rounded-xl border border-violet-300 bg-white px-6 py-3 font-black text-violet-900 hover:bg-violet-50">Request Managed Access</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-700">
              {['Interactive preview available', 'Community feed and groups', 'Gamification foundation', 'Managed activation only'].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</span>)}
            </div>
          </div>

          <div className="rounded-[2rem] border border-violet-200 bg-white p-5 shadow-xl shadow-violet-100/60">
            <div className="rounded-2xl bg-gradient-to-br from-violet-700 to-cyan-600 p-5 text-white">
              <div className="text-xs font-black uppercase tracking-widest text-violet-100">Connected community concept</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-white/15 p-3"><strong>Learning</strong><span className="ml-2 text-sm">courses, progress and community can share the same learner identity.</span></div>
                <div className="rounded-xl bg-white/15 p-3"><strong>Groups</strong><span className="ml-2 text-sm">cohorts and interest groups can sit alongside structured training.</span></div>
                <div className="rounded-xl bg-white/15 p-3"><strong>Engagement</strong><span className="ml-2 text-sm">posts, comments, points and milestones support participation.</span></div>
                <div className="rounded-xl bg-white/15 p-3"><strong>Governance</strong><span className="ml-2 text-sm">paid tenant activation remains managed until the entitlement boundary is complete.</span></div>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium leading-6 text-slate-600">The preview demonstrates existing platform capabilities without representing unfinished paid access controls as production-complete self-service commerce.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-black text-slate-950">What exists today</h2>
            <p className="mt-3 leading-7 text-slate-600">Community UI, social-learning interactions, groups, discussions and gamification foundations exist. The remaining production gate is commercial tenant-level entitlement enforcement, not the basic community experience itself.</p>
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
            <p className="text-xs font-black uppercase tracking-widest text-violet-700">Member experience</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Community → Group → Discussion → Progress</h2>
            <p className="mt-4 leading-7 text-slate-600">The existing community experience supports social learning and member engagement inside the broader LMS environment.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-700">Production gate</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Tenant entitlement → Access enforcement → Self-service sale</h2>
            <p className="mt-4 leading-7 text-slate-600">Self-service commerce will remain disabled until a purchased Community entitlement deterministically controls access for the correct tenant without disrupting existing Elevate learners.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-widest text-violet-700">Try the experience</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Use the interactive community preview.</h2>
            <p className="mt-3 leading-7 text-slate-600">Explore a sample community before discussing managed activation.</p>
          </div>
          <InteractiveCommunityDemo />
        </div>
      </section>

      <section className="px-4 pb-20 pt-6 text-center">
        <div className="mx-auto max-w-3xl rounded-3xl border border-violet-200 bg-violet-50 p-8">
          <h2 className="text-3xl font-black text-slate-950">Community Hub is currently managed preview.</h2>
          <p className="mt-4 leading-7 text-slate-700">There is no self-service Community subscription checkout while the tenant entitlement boundary is being finalized.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/store/demo/community" className="rounded-xl bg-violet-700 px-6 py-3 font-black text-white">Try the Demo</Link>
            <Link href="/contact?subject=Community%20Hub%20Managed%20Preview" className="rounded-xl border border-violet-300 bg-white px-6 py-3 font-black text-violet-900">Request Managed Access</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
