'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarDays, Trophy, Users, BookOpen, BriefcaseBusiness, Sparkles, MessageSquare } from 'lucide-react';
import GroupDiscussions from '@/components/lms/GroupDiscussions';

const groups = [
  { slug: 'all', label: 'All Community' },
  { slug: 'healthcare', label: 'Healthcare' },
  { slug: 'trades', label: 'Skilled Trades' },
  { slug: 'barber-beauty', label: 'Barber & Beauty' },
  { slug: 'career', label: 'Career & Employment' },
];

const quickLinks = [
  { href: '/lms/courses', label: 'My Programs', icon: BookOpen },
  { href: '/lms/calendar', label: 'Events', icon: CalendarDays },
  { href: '/lms/members', label: 'Members', icon: Users },
  { href: '/lms/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/lms/jobs', label: 'Career Opportunities', icon: BriefcaseBusiness },
  { href: '/lms/messages', label: 'Messages', icon: MessageSquare },
];

export default function CommunityPage() {
  const [activeGroup, setActiveGroup] = useState('all');

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-2xl bg-slate-900 p-6 text-white md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                <Sparkles className="h-4 w-4" /> Elevate Community
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Learn together. Build your career together.</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                One place for your cohort, program discussions, events, achievements, classmates, career opportunities, and support.
              </p>
            </div>
            <Link href="/lms/support" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-100">
              Ask PARIS for Help
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <Icon className="mb-3 h-5 w-5 text-brand-blue-600" />
              <span className="text-sm font-bold text-slate-900">{label}</span>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-black uppercase tracking-wider text-slate-500">Groups</p>
            <div className="space-y-1">
              {groups.map((group) => (
                <button
                  key={group.slug}
                  type="button"
                  onClick={() => setActiveGroup(group.slug)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${activeGroup === group.slug ? 'bg-brand-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">{groups.find((group) => group.slug === activeGroup)?.label}</h2>
                <p className="text-sm text-slate-500">Share updates, ask questions, and help your cohort move forward.</p>
              </div>
            </div>
            <GroupDiscussions groupSlug={activeGroup} />
          </div>
        </section>
      </div>
    </main>
  );
}
