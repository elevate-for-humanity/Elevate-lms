'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Check,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { useDemoSalesSession } from './useDemoSalesSession';

type DemoCommunity = {
  name: string;
  brand: string;
  groups: string[];
  posts: string[];
  members: string[];
  courseTitle: string;
  membershipName: string;
  membershipPrice: number;
  ellieReply: string;
};

const DEFAULT_COMMUNITY: DemoCommunity = {
  name: 'My Growth Community',
  brand: 'Modern & Bright',
  groups: ['Welcome'],
  posts: [],
  members: ['Jordan (sample member)'],
  courseTitle: '',
  membershipName: '',
  membershipPrice: 0,
  ellieReply: '',
};

function normalize(value: unknown): DemoCommunity {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Partial<DemoCommunity>
    : {};
  return {
    name: typeof source.name === 'string' && source.name ? source.name : DEFAULT_COMMUNITY.name,
    brand: typeof source.brand === 'string' && source.brand ? source.brand : DEFAULT_COMMUNITY.brand,
    groups: Array.isArray(source.groups) ? source.groups.filter((item): item is string => typeof item === 'string').slice(0, 12) : DEFAULT_COMMUNITY.groups,
    posts: Array.isArray(source.posts) ? source.posts.filter((item): item is string => typeof item === 'string').slice(0, 20) : [],
    members: Array.isArray(source.members) ? source.members.filter((item): item is string => typeof item === 'string').slice(0, 20) : DEFAULT_COMMUNITY.members,
    courseTitle: typeof source.courseTitle === 'string' ? source.courseTitle : '',
    membershipName: typeof source.membershipName === 'string' ? source.membershipName : '',
    membershipPrice: Number.isFinite(Number(source.membershipPrice)) ? Number(source.membershipPrice) : 0,
    ellieReply: typeof source.ellieReply === 'string' ? source.ellieReply : '',
  };
}

export function InteractiveCommunityDemo() {
  const { token, state, patch, ready } = useDemoSalesSession('community-hub', 'build-community');
  const community = useMemo(() => normalize(state.community), [state.community]);
  const [post, setPost] = useState('Welcome! Tell us what you want to accomplish this month.');
  const [group, setGroup] = useState('Accountability Circle');
  const [courseTitle, setCourseTitle] = useState('30-Day Momentum Course');
  const [membershipName, setMembershipName] = useState('Premium Member');
  const [membershipPrice, setMembershipPrice] = useState('29');
  const [saving, setSaving] = useState(false);

  async function save(next: DemoCommunity, eventType: string) {
    setSaving(true);
    try {
      await patch(
        { community: next },
        { type: eventType, communityName: next.name },
      );
    } finally {
      setSaving(false);
    }
  }

  async function addPost() {
    const value = post.trim();
    if (!value) return;
    const next = { ...community, posts: [...community.posts, value].slice(-20) };
    await save(next, 'community.post.created');
    setPost('');
  }

  async function addGroup() {
    const value = group.trim();
    if (!value || community.groups.includes(value)) return;
    const next = { ...community, groups: [...community.groups, value].slice(0, 12) };
    await save(next, 'community.group.created');
    setGroup('');
  }

  async function addMember() {
    const sample = `Sample Member ${community.members.length + 1}`;
    await save({ ...community, members: [...community.members, sample].slice(0, 20) }, 'community.member.sample-added');
  }

  async function addCourse() {
    const value = courseTitle.trim();
    if (!value) return;
    await save({ ...community, courseTitle: value }, 'community.course.created');
  }

  async function askEllie() {
    const latest = community.posts.at(-1) || 'A new member just joined.';
    const reply = `ELLIE: Welcome! I noticed your latest update — “${latest.slice(0, 90)}${latest.length > 90 ? '…' : ''}” I can help turn that goal into a learning path and recommend the next community resource.`;
    await save({ ...community, ellieReply: reply }, 'community.ellie.responded');
  }

  async function createMembership() {
    const amount = Math.max(0, Math.min(Number(membershipPrice) || 0, 5000));
    const next = {
      ...community,
      membershipName: membershipName.trim() || 'Premium Member',
      membershipPrice: amount,
    };
    await save(next, 'community.membership.created');
  }

  const stepsDone = [
    community.name !== DEFAULT_COMMUNITY.name,
    community.posts.length > 0,
    community.groups.length > 1,
    community.members.length > 1,
    Boolean(community.courseTitle),
    Boolean(community.ellieReply),
    Boolean(community.membershipName),
  ].filter(Boolean).length;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-6 text-white sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-widest">
            <Sparkles className="h-4 w-4" /> Real sales sandbox
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Build a community. Keep what you build.</h2>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-violet-50 sm:text-base">
            This sandbox saves your work. Create a community, post, group, sample member, starter course, AI response, and paid membership — then convert the same build into a real Elevate workspace.
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-4">
            <div className="flex items-center justify-between text-sm font-black">
              <span>Launch progress</span>
              <span>{stepsDone}/7</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${(stepsDone / 7) * 100}%` }} />
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm font-semibold text-violet-50">
            {[
              'Sandbox data only — never touches production learner/community records',
              'Persistent during this browser session',
              'Sandbox configuration carries into the trial workspace',
              'Paid membership checkout activates after the owner connects Stripe',
            ].map((item) => (
              <div key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" /> {item}</div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-violet-700">Live Community Hub Preview</div>
              <h3 className="mt-1 text-2xl font-black text-slate-950">{community.name}</h3>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              {ready ? (token ? 'Sandbox session saved' : 'Sandbox ready') : 'Starting sandbox…'}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-black text-slate-800">
              Community name
              <input
                value={community.name}
                onChange={(event) => void save({ ...community, name: event.target.value.slice(0, 100) }, 'community.name.changed')}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-semibold text-slate-900"
              />
            </label>
            <label className="text-sm font-black text-slate-800">
              Branding style
              <select
                value={community.brand}
                onChange={(event) => void save({ ...community, brand: event.target.value }, 'community.brand.changed')}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-semibold text-slate-900"
              >
                <option>Modern & Bright</option>
                <option>Professional</option>
                <option>Bold & Creative</option>
                <option>Calm & Premium</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-black text-slate-950"><MessageCircle className="h-4 w-4 text-violet-700" /> Create a post</div>
              <textarea value={post} onChange={(event) => setPost(event.target.value)} rows={3} className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium" />
              <button onClick={() => void addPost()} disabled={saving} className="mt-2 rounded-lg bg-violet-700 px-3 py-2 text-xs font-black text-white hover:bg-violet-800">Publish sample post</button>
              <div className="mt-3 space-y-2">
                {community.posts.slice(-2).map((item, index) => <div key={`${item}-${index}`} className="rounded-xl bg-white p-3 text-xs font-semibold text-slate-700 shadow-sm">{item}</div>)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-black text-slate-950"><Users className="h-4 w-4 text-cyan-700" /> Groups & members</div>
              <div className="mt-3 flex gap-2">
                <input value={group} onChange={(event) => setGroup(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium" />
                <button onClick={() => void addGroup()} className="rounded-xl bg-cyan-700 px-3 text-white"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {community.groups.map((item) => <span key={item} className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-black text-cyan-900">{item}</span>)}
              </div>
              <button onClick={() => void addMember()} className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">Add sample member ({community.members.length})</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="font-black text-slate-950">Starter course</div>
              <input value={courseTitle} onChange={(event) => setCourseTitle(event.target.value)} className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold" />
              <button onClick={() => void addCourse()} className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white">Add course to launch</button>
              {community.courseTitle && <p className="mt-2 text-xs font-bold text-emerald-700">Added: {community.courseTitle}</p>}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 font-black text-slate-950"><Bot className="h-4 w-4 text-fuchsia-700" /> ELLIE community companion</div>
              <button onClick={() => void askEllie()} className="mt-3 rounded-lg bg-fuchsia-700 px-3 py-2 text-xs font-black text-white">Let ELLIE respond</button>
              {community.ellieReply && <p className="mt-3 rounded-xl bg-fuchsia-50 p-3 text-xs font-semibold leading-5 text-fuchsia-950">{community.ellieReply}</p>}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="font-black text-amber-950">Create a membership offer</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_130px_auto]">
              <input value={membershipName} onChange={(event) => setMembershipName(event.target.value)} className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold" />
              <div className="flex items-center rounded-xl border border-amber-300 bg-white px-3"><span className="font-black text-slate-500">$</span><input value={membershipPrice} onChange={(event) => setMembershipPrice(event.target.value)} inputMode="decimal" className="w-full px-1 py-2 text-sm font-semibold outline-none" /></div>
              <button onClick={() => void createMembership()} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-700">Preview plan</button>
            </div>
            {community.membershipName && <p className="mt-2 text-xs font-bold text-amber-900">{community.membershipName}: ${community.membershipPrice}/mo sandbox preview. The real workspace can connect Stripe before taking payments.</p>}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black">Keep this build</div>
              <div className="mt-1 text-xs font-medium text-slate-300">Start the 14-day workspace trial and carry this community configuration with you.</div>
            </div>
            <Link href={token ? `/store/trial?demo=${encodeURIComponent(token)}&product=community-hub` : '/store/trial'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">
              Keep My Community <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
