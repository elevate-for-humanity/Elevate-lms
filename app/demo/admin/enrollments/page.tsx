'use client';

import Image from 'next/image';
import { useState, useEffect, Fragment } from 'react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_STUDENTS } from '@/lib/demo/sandbox-data';
import { Search, Filter, Download, ChevronDown, ChevronUp, Clock, AlertTriangle, XCircle, Mail, Phone } from 'lucide-react';

import { createBrowserClient } from '@supabase/ssr';
export default function DemoEnrollmentsPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('program_enrollments').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'attendance'>('name');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const programs = (dbRows as any[]) || [];

  const filtered = DEMO_STUDENTS
    .filter((s: any) => {
      const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
      const matchProgram = programFilter === 'all' || s.program === programFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchProgram && matchStatus;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0);
      if (sortBy === 'attendance') return (b.attendance || 0) - (a.attendance || 0);
      return a.full_name.localeCompare(b.full_name);
    });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active': return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'completed': return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'pending': return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'at_risk': return <AlertTriangle className="w-3.5 h-3.5 text-brand-red-500" />;
      default: return <XCircle className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  return (
    <DemoPageShell title="Enrollments" description="All currently enrolled students across programs." portal="admin">
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-brand-green-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-fade-in-up">

      {/* Hero Image */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px]">
        <Image src="/images/pages/demo-page-4.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-700 hidden sm:block" />
          <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="border rounded-lg px-3 py-2.5 text-sm bg-white outline-none">
            <option value="all">All Programs</option>
            {programs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2.5 text-sm bg-white outline-none">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="at_risk">At Risk</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border rounded-lg px-3 py-2.5 text-sm bg-white outline-none">
            <option value="name">Sort: Name</option>
            <option value="progress">Sort: Progress</option>
            <option value="attendance">Sort: Attendance</option>
          </select>
          <button onClick={() => showToast('Enrollment report exported to CSV')} className="inline-flex items-center gap-1.5 border rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-gray-50 transition">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-700 mb-3">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-700 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Attendance</th>
                <th className="px-4 py-3 font-medium">Funding</th>
                <th className="px-4 py-3 font-medium w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <Fragment key={s.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{s.full_name}</div>
                      <div className="text-xs text-slate-700">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{s.program}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        {statusIcon(s.status)}
                        <span className="capitalize text-xs">{s.status?.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-green-500 rounded-full transition-all" style={{ width: `${s.progress || 0}%` }} />
                        </div>
                        <span className="text-xs text-slate-700">{s.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${(s.attendance || 0) >= 90 ? 'text-brand-green-600' : (s.attendance || 0) >= 80 ? 'text-amber-600' : 'text-brand-red-600'}`}>
                        {s.attendance || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-brand-blue-50 text-brand-blue-700 px-2 py-0.5 rounded">{s.funding}</span>
                    </td>
                    <td className="px-4 py-3">
                      {expandedId === s.id ? <ChevronUp className="w-4 h-4 text-slate-700" /> : <ChevronDown className="w-4 h-4 text-slate-700" />}
                    </td>
                  </tr>
                  {expandedId === s.id && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 px-4 py-4 border-b">
                        <div className="grid sm:grid-cols-4 gap-4 mb-3 animate-fade-in-up">
                          <div>
                            <p className="text-xs text-slate-700">Hours</p>
                            <p className="text-sm font-semibold">{s.hours_completed?.toLocaleString()} / {s.hours_required?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-700">Start Date</p>
                            <p className="text-sm font-semibold">{s.start_date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-700">Mentor / Employer</p>
                            <p className="text-sm font-semibold">{s.mentor || s.company || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-700">Certification</p>
                            <p className="text-sm font-semibold">{s.certification || 'In progress'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <button onClick={() => showToast(`Email sent to ${s.full_name}`)} className="inline-flex items-center gap-1.5 border text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white transition">
                            <Mail className="w-3 h-3" /> Send Email
                          </button>
                          <button onClick={() => showToast(`Calling ${s.phone}`)} className="inline-flex items-center gap-1.5 border text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white transition">
                            <Phone className="w-3 h-3" /> Call
                          </button>
                          {s.status === 'at_risk' && (
                            <button onClick={() => showToast(`Intervention flagged for ${s.full_name}`)} className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-600 transition">
                              <AlertTriangle className="w-3 h-3" /> Flag for Intervention
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DemoPageShell>
  );
}
