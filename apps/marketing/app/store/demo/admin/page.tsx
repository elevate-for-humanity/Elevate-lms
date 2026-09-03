'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, BookOpen, FileText, Search, Users } from 'lucide-react';
import { TalkingDemoGuide } from '@/components/store/TalkingDemoGuide';

const students = [
  { name: 'Jordan Sample', program: 'Barber Apprenticeship', status: 'Active', progress: 65 },
  { name: 'Maria Sample', program: 'HVAC Technician', status: 'Active', progress: 42 },
  { name: 'Alex Sample', program: 'Medical Assistant', status: 'Review', progress: 18 },
];

const demoSteps = [
  {
    title: 'See the operating picture',
    narration: 'This overview gives an administrator a quick read on active learners, applications waiting for review, and program volume without opening multiple systems.',
    actionLabel: 'Overview',
  },
  {
    title: 'Manage learners from one place',
    narration: 'Search a learner, open the record, review the program and progress, then connect that student to enrollment, attendance and support workflows.',
    actionLabel: 'Students',
  },
  {
    title: 'Operate courses and curriculum',
    narration: 'The platform connects course management to the LMS and Course Builder so staff can edit, preview and deliver training from the same environment.',
    actionLabel: 'Courses',
  },
  {
    title: 'Turn records into compliance evidence',
    narration: 'Compliance views turn enrollment, apprenticeship and training activity into structured reports and audit-ready workflows instead of separate spreadsheets.',
    actionLabel: 'Compliance',
  },
];

export default function AdminDemoPage() {
  const [tab, setTab] = useState<'overview' | 'students' | 'courses' | 'compliance'>('overview');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const filtered = useMemo(
    () => students.filter((s) => `${s.name} ${s.program}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const simulate = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const syncGuideToTab = (index: number) => {
    const tabs: Array<'overview' | 'students' | 'courses' | 'compliance'> = ['overview', 'students', 'courses', 'compliance'];
    setTab(tabs[index] || 'overview');
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 bg-slate-950 text-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/store/demos" aria-label="Back to demo center" className="rounded-lg p-2 hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample data · Interactive demo</p>
              <h1 className="font-black">Admin Platform</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/store/plans" className="hidden rounded-lg border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10 sm:block">View Plans</Link>
            <Link href="/store/trial" className="rounded-lg bg-brand-red-600 px-4 py-2 text-sm font-bold hover:bg-brand-red-700">Start Trial</Link>
          </div>
        </div>
      </header>

      {notice && <div className="fixed right-4 top-24 z-50 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}

      <div className="mx-auto max-w-7xl px-4 py-8">
        <TalkingDemoGuide productName="Elevate Admin Platform" steps={demoSteps} onStepChange={syncGuideToTab} />

        <nav className="mb-6 mt-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
          {[
            ['overview', 'Overview', BarChart3],
            ['students', 'Students', Users],
            ['courses', 'Courses', BookOpen],
            ['compliance', 'Compliance', FileText],
          ].map(([id, label, Icon]: any) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${tab === id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && (
          <section className="grid gap-5 md:grid-cols-3">
            {[
              ['Active learners', '24'],
              ['Applications to review', '7'],
              ['Programs', '6'],
            ].map(([label, value]) => (
              <button key={label} onClick={() => simulate(`Opened ${label.toLowerCase()} detail`)} className="rounded-2xl border border-slate-200 bg-white p-6 text-left hover:border-slate-300 hover:shadow-sm">
                <p className="text-3xl font-black text-slate-950">{value}</p>
                <p className="mt-1 text-sm text-slate-600">{label}</p>
              </button>
            ))}
          </section>
        )}

        {tab === 'students' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <h2 className="text-xl font-black">Student management</h2>
                <p className="text-sm text-slate-500">Search and open sample learner records.</p>
              </div>
              <button onClick={() => simulate('Demo: add-student workflow opened')} className="rounded-lg bg-brand-red-600 px-4 py-2 text-sm font-bold text-white">Add sample student</button>
            </div>
            <label className="relative block">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sample learners" className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3" />
            </label>
            <div className="mt-4 space-y-3">
              {filtered.map((student) => (
                <button key={student.name} onClick={() => simulate(`Opened sample record: ${student.name}`)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:bg-slate-50">
                  <div>
                    <p className="font-bold">{student.name}</p>
                    <p className="text-sm text-slate-500">{student.program}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{student.progress}%</p>
                    <p className="text-xs text-slate-500">{student.status}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === 'courses' && (
          <section className="grid gap-4 md:grid-cols-2">
            {['Barber Apprenticeship', 'HVAC Technician', 'Medical Assistant', 'CNA'].map((course) => (
              <div key={course} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="font-black">{course}</h2>
                <p className="mt-2 text-sm text-slate-500">Sample course configuration</p>
                <div className="mt-5 flex gap-2">
                  <button onClick={() => simulate(`Demo editor opened: ${course}`)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Edit</button>
                  <button onClick={() => simulate(`Demo preview opened: ${course}`)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold">Preview</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === 'compliance' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black">Compliance reporting demo</h2>
            <p className="mt-2 text-slate-600">These actions use sample data only and demonstrate the workflow without touching production participant records.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['WIOA data review', 'Enrollment summary', 'Apprenticeship hours', 'Audit checklist'].map((report) => (
                <button key={report} onClick={() => simulate(`Generated sample report: ${report}`)} className="rounded-xl border border-slate-200 p-4 text-left font-bold hover:bg-slate-50">{report}</button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-2xl bg-slate-950 p-6 text-white md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h2 className="text-xl font-black">Want this with your own data and branding?</h2>
            <p className="mt-2 text-sm text-slate-300">Start the real 14-day workspace, then add the modules your organization needs.</p>
          </div>
          <div className="mt-5 flex gap-3 md:mt-0">
            <Link href="/store/trial" className="rounded-xl bg-brand-red-600 px-5 py-3 font-black hover:bg-brand-red-500">Start Trial</Link>
            <Link href="/store" className="rounded-xl border border-white/20 px-5 py-3 font-black hover:bg-white/10">Explore Store</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
