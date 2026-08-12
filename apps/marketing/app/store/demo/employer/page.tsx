'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MessageCircle, Search, Users } from 'lucide-react';
import { TalkingDemoGuide } from '@/components/store/TalkingDemoGuide';

const candidates = [
  { name: 'Marcus Sample', program: 'Barber Apprenticeship', skills: ['Fades', 'Customer Service'] },
  { name: 'Sarah Sample', program: 'HVAC Technician', skills: ['EPA 608', 'Diagnostics'] },
  { name: 'David Sample', program: 'Medical Assistant', skills: ['Patient Care', 'CPR'] },
];

const demoSteps = [
  {
    title: 'See employer activity at a glance',
    narration: 'The employer dashboard summarizes jobs, candidates and interviews so hiring partners do not need access to the administrative side of the platform.',
    actionLabel: 'Dashboard',
  },
  {
    title: 'Post and manage jobs',
    narration: 'Employers can create openings, review applicants and manage hiring activity from their own portal.',
    actionLabel: 'Jobs',
  },
  {
    title: 'Find qualified candidates',
    narration: 'Search candidates by training program and skills, then open a profile to continue the hiring workflow.',
    actionLabel: 'Candidates',
  },
  {
    title: 'Keep communication connected',
    narration: 'Messaging keeps employer conversations attached to the workforce relationship instead of scattering communication across separate tools.',
    actionLabel: 'Messages',
  },
];

export default function EmployerDemoPage() {
  const [tab, setTab] = useState<'dashboard' | 'jobs' | 'candidates' | 'messages'>('dashboard');
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState(['Licensed Barber', 'HVAC Technician']);
  const [notice, setNotice] = useState('');
  const matches = useMemo(
    () => candidates.filter((candidate) => `${candidate.name} ${candidate.program} ${candidate.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const simulate = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  };
  const syncGuide = (index: number) => {
    const tabs: Array<'dashboard' | 'jobs' | 'candidates' | 'messages'> = ['dashboard', 'jobs', 'candidates', 'messages'];
    setTab(tabs[index] || 'dashboard');
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 bg-emerald-800 text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3"><Link href="/store/demos" className="rounded-lg p-2 hover:bg-white/10" aria-label="Back to demo center"><ArrowLeft className="h-5 w-5" /></Link><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Sample data · Interactive demo</p><h1 className="font-black">Employer Portal</h1></div></div>
          <Link href="/store/trial" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-900">Start Trial</Link>
        </div>
      </header>
      {notice && <div className="fixed right-4 top-24 z-50 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <TalkingDemoGuide productName="Elevate Employer Portal" steps={demoSteps} onStepChange={syncGuide} />

        <nav className="mb-6 mt-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
          {[
            ['dashboard','Dashboard',Briefcase],
            ['jobs','Jobs',Briefcase],
            ['candidates','Candidates',Users],
            ['messages','Messages',MessageCircle],
          ].map(([id,label,Icon]: any) => <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${tab === id ? 'bg-emerald-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}><Icon className="h-4 w-4" />{label}</button>)}
        </nav>

        {tab === 'dashboard' && <section className="grid gap-5 md:grid-cols-3">{[['Active jobs',jobs.length],['Sample candidates',candidates.length],['Interviews','2']].map(([label,value]) => <button key={String(label)} onClick={() => simulate(`Opened ${String(label).toLowerCase()} detail`)} className="rounded-2xl border border-slate-200 bg-white p-6 text-left hover:shadow-sm"><p className="text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm text-slate-600">{label}</p></button>)}</section>}

        {tab === 'jobs' && <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Sample job postings</h2><p className="text-sm text-slate-500">Adding or editing here only changes this demo session.</p></div><button onClick={() => setJobs((current) => [...current, `Sample Job ${current.length + 1}`])} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Post sample job</button></div><div className="mt-5 space-y-3">{jobs.map((job, index) => <div key={`${job}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><p className="font-bold">{job}</p><p className="text-sm text-slate-500">Indianapolis, IN · Demo posting</p></div><div className="flex gap-2"><button onClick={() => simulate(`Opened applicants for ${job}`)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">Applicants</button><button onClick={() => simulate(`Demo editor opened for ${job}`)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white">Edit</button></div></div>)}</div></section>}

        {tab === 'candidates' && <section className="rounded-2xl border border-slate-200 bg-white p-6"><label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sample candidates" className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3" /></label><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{matches.map((candidate) => <article key={candidate.name} className="rounded-xl border border-slate-200 p-5"><h3 className="font-black">{candidate.name}</h3><p className="mt-1 text-sm text-slate-500">{candidate.program}</p><div className="mt-3 flex flex-wrap gap-1">{candidate.skills.map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-xs">{skill}</span>)}</div><button onClick={() => simulate(`Opened sample profile: ${candidate.name}`)} className="mt-5 w-full rounded-lg bg-emerald-700 py-2 text-sm font-bold text-white">View profile</button></article>)}</div></section>}

        {tab === 'messages' && <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><MessageCircle className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 text-xl font-black">Messaging demo</h2><p className="mt-2 text-slate-500">Compose a simulated employer message without contacting a real person.</p><button onClick={() => simulate('Demo message composed — nothing was sent')} className="mt-5 rounded-lg bg-emerald-700 px-5 py-2.5 font-bold text-white">Compose sample message</button></section>}

        <section className="mt-8 rounded-2xl bg-emerald-950 p-6 text-white md:flex md:items-center md:justify-between md:gap-6"><div><h2 className="text-xl font-black">Turn employer engagement into a managed workflow</h2><p className="mt-2 text-sm text-emerald-100">Start a real workspace and connect employer activity to workforce, apprenticeship and CRM modules.</p></div><div className="mt-5 flex gap-3 md:mt-0"><Link href="/store/trial" className="rounded-xl bg-white px-5 py-3 font-black text-emerald-950">Start Trial</Link><Link href="/store" className="rounded-xl border border-white/20 px-5 py-3 font-black">Explore Store</Link></div></section>
      </div>
    </main>
  );
}
