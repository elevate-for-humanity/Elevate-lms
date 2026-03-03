'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import { DEMO_STUDENTS } from '@/lib/demo/sandbox-data';
import { Search, XCircle, Eye, ChevronDown, ChevronUp, Filter } from 'lucide-react';

import { createBrowserClient } from '@supabase/ssr';
const applicants = DEMO_STUDENTS.filter((s: any) => s.status === 'pending' || s.status === 'active').map((s: any, i: number) => ({
  ...s,
  applied: s.enrolledDate || 'Jan 2026',
  documents: i % 3 === 0 ? 'Missing ID' : i % 3 === 1 ? 'Complete' : 'Pending review',
  eligibility: i % 2 === 0 ? 'Verified' : 'Pending',
}));

export default function DemoApplicationsPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('applications').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actions, setActions] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = (id: string, action: 'approved' | 'rejected', name: string) => {
    setActions(prev => ({ ...prev, [id]: action }));
    showToast(`${name} has been ${action}`);
  };

  const filtered = applicants.filter((s: any) => {
    if (actions[s.id]) return false; // hide actioned items
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) || s.program.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DemoPageShell title="Applications" description="Review and process incoming student applications." portal="admin">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-brand-green-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-fade-in-up">

      {/* Hero Image */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px]">
        <Image src="/images/heroes-hq/how-it-works-hero.jpg" alt="Platform demo" fill sizes="100vw" className="object-cover" priority />
      </section>
          {toast}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-brand-red-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500 mb-3">{filtered.length} application{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Applications list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No applications match your search.</div>
        )}
        {filtered.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-sm transition">
            {/* Summary row */}
            <button
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{s.full_name}</div>
                <div className="text-sm text-gray-500">{s.program} · Applied {s.applied}</div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  s.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-brand-green-100 text-brand-green-800'
                }`}>
                  {s.status === 'pending' ? 'Needs Review' : 'Enrolled'}
                </span>
                {expandedId === s.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {/* Expanded detail */}
            {expandedId === s.id && (
              <div className="border-t px-4 py-4 bg-gray-50 animate-fade-in-up">
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Contact</p>
                    <p className="text-sm font-medium text-gray-900">{s.email}</p>
                    <p className="text-sm text-gray-600">{s.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Funding Source</p>
                    <p className="text-sm font-medium text-gray-900">{s.funding}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Documents</p>
                    <p className={`text-sm font-medium ${s.documents === 'Complete' ? 'text-brand-green-700' : s.documents === 'Missing ID' ? 'text-brand-red-700' : 'text-amber-700'}`}>
                      {s.documents}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Eligibility</p>
                    <p className={`text-sm font-medium ${s.eligibility === 'Verified' ? 'text-brand-green-700' : 'text-amber-700'}`}>
                      {s.eligibility}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Program Start</p>
                    <p className="text-sm font-medium text-gray-900">{s.start_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Hours Required</p>
                    <p className="text-sm font-medium text-gray-900">{s.hours_required?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleAction(s.id, 'approved', s.full_name)}
                    className="inline-flex items-center gap-1.5 bg-brand-green-600 hover:bg-brand-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    <span className="text-slate-400 flex-shrink-0">•</span> Approve & Enroll
                  </button>
                  <button
                    onClick={() => handleAction(s.id, 'rejected', s.full_name)}
                    className="inline-flex items-center gap-1.5 bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Deny
                  </button>
                  <button className="inline-flex items-center gap-1.5 border text-gray-600 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                    <Eye className="w-3.5 h-3.5" /> View Full Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </DemoPageShell>
  );
}
