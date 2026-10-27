import Image from 'next/image';
import Link from 'next/link';
import SocialLearningCommunity from '@/components/SocialLearningCommunity';
import { BusinessNetworkCard } from '@/components/portal/BusinessNetworkCard';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { CalendarDays, Mail, MessageSquare, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Program Holder Community',
  description: 'Program-holder collaboration, student support, meetings, and office communication.',
};

const resources = [
  {
    href: '/program-holder/inbox',
    title: 'Office Mail',
    detail: 'Send an auditable internal message to Elevate staff.',
    icon: Mail,
  },
  {
    href: '/program-holder/meetings',
    title: 'Meetings and events',
    detail: 'Schedule or join phone, video, and screen-share meetings.',
    icon: CalendarDays,
  },
  {
    href: '/program-holder/students',
    title: 'Student support',
    detail: 'Review enrolled learners and coordinate documented support.',
    icon: Users,
  },
  {
    href: '/program-holder/students/pending',
    title: 'Applicant follow-up',
    detail: 'Call routed applicants, document the outcome, and set the next follow-up.',
    icon: MessageSquare,
  },
];

export default async function ProgramHolderCommunityPage() {
  const { user, profile } = await requireProgramHolder();
  return (
    <main className="space-y-6 px-4 py-6 sm:px-6">
      <BusinessNetworkCard href="#network-feed" label="Program Holder network" />
      <div id="network-feed"><SocialLearningCommunity userId={user.id} userName={profile.full_name || 'Program Holder'} /></div>
      <section className="relative isolate min-h-[320px] overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-9">
        <Image
          src="/images/pages/community-page-2.webp"
          alt="Elevate workforce community"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-blue-950/90 to-violet-950/55" />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Program Holder Community</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black sm:text-5xl">Coordinate support without leaving your workspace</h1>
        <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-100 sm:text-base">
          Use these role-safe tools for staff communication, meetings, student support, and applicant follow-up.
          Student-only pages are intentionally kept out of this portal.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {resources.map(({ href, title, detail, icon: Icon }) => (
          <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
            <Icon className="h-7 w-7 text-blue-700" />
            <h2 className="mt-3 text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            <span className="mt-4 inline-flex text-sm font-black text-blue-800">Open workspace →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
