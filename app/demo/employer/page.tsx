'use client';

import { useState, useEffect } from 'react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import Link from 'next/link';
import { Users, GraduationCap, DollarSign, FileText, ChevronRight, ArrowRight, Search, Clock, Eye, ThumbsUp, Download } from 'lucide-react';

import { createBrowserClient } from '@supabase/ssr';

export default function DemoEmployerPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  const APPRENTICES = (dbRows as any[]) || [];
  const CANDIDATES = (dbRows as any[]) || [];
  const INCENTIVES = (dbRows as any[]) || [];
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('employers').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [toast, setToast] = useState<string | null>(null);
  const [approvedHours, setApprovedHours] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'apprentices' | 'candidates' | 'incentives'>('apprentices');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const approveHours = (id: number, name: string, hours: number) => {
    setApprovedHours(prev => new Set([...prev, id]));
    showToast(`${hours} hours approved for ${name}`);
  };

  const totalIncentives = '$18,400';

  return (
    <DemoPageShell title="Employer Dashboard" description="Manage apprentices, find candidates, and track hiring incentives." portal="employer">
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-brand-green-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-fade-in-up">{toast}</div>
      )}

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up">
          {[
            { label: 'Active Apprentices', value: APPRENTICES.length, icon: GraduationCap, color: 'bg-brand-blue-50 text-brand-blue-700' },
            { label: 'Candidates Available', value: CANDIDATES.length + 31, icon: Users, color: 'bg-brand-green-50 text-brand-green-700' },
            { label: 'Incentives Earned', value: totalIncentives, icon: DollarSign, color: 'bg-amber-50 text-amber-700' },
            { label: 'Documents', value: 8, icon: FileText, color: 'bg-purple-50 text-purple-700' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4">
              <div className={`p-2 rounded-lg ${s.color} w-fit mb-2`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(['apprentices', 'candidates', 'incentives'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
              {t === 'apprentices' && APPRENTICES.some(a => a.pendingHours > 0 && !approvedHours.has(a.id)) && (
                <span className="ml-1.5 bg-brand-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{APPRENTICES.filter(a => a.pendingHours > 0 && !approvedHours.has(a.id)).length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Apprentices tab */}
        {tab === 'apprentices' && (
          <div className="bg-white rounded-xl border animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                    <th className="px-5 py-3 font-medium">Apprentice</th>
                    <th className="px-5 py-3 font-medium">Program</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Wage</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {APPRENTICES.map(a => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{a.name}</td>
                      <td className="px-5 py-3 text-gray-600">{a.program}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-blue-500 rounded-full" style={{ width: `${(a.hours / a.total) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{a.hours}/{a.total}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{a.wage}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          a.status === 'Ahead' ? 'bg-brand-green-100 text-brand-green-800' :
                          a.status === 'New' ? 'bg-brand-blue-100 text-brand-blue-800' :
                          'bg-brand-green-100 text-brand-green-800'
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-5 py-3">
                        {a.pendingHours > 0 && !approvedHours.has(a.id) ? (
                          <button onClick={() => approveHours(a.id, a.name, a.pendingHours)} className="text-xs bg-brand-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-green-700 transition flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> Approve {a.pendingHours}h
                          </button>
                        ) : a.pendingHours > 0 && approvedHours.has(a.id) ? (
                          <span className="text-xs text-brand-green-600 flex items-center gap-1"><span className="text-slate-400 flex-shrink-0">•</span> Approved</span>
                        ) : (
                          <button onClick={() => showToast(`Viewing ${a.name}'s profile`)} className="text-xs border text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
                            <Eye className="w-3 h-3" /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Candidates tab */}
        {tab === 'candidates' && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search candidates by name, credential, or program..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red-500" />
            </div>
            {CANDIDATES.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.credential.toLowerCase().includes(search.toLowerCase())).map(c => (
              <div key={c.id} className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition">
                <div>
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-sm text-gray-500">{c.credential} · {c.program}</div>
                  <div className="text-xs text-gray-400 mt-1">Available: {c.available}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Match</div>
                    <div className={`text-sm font-bold ${c.match >= 90 ? 'text-brand-green-600' : c.match >= 80 ? 'text-brand-blue-600' : 'text-gray-600'}`}>{c.match}%</div>
                  </div>
                  <button onClick={() => showToast(`Interview request sent to ${c.name}`)} className="text-xs bg-brand-red-600 text-white px-4 py-2 rounded-lg hover:bg-brand-red-700 transition">
                    Request Interview
                  </button>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center">Showing top matches. {31} more candidates available.</p>
          </div>
        )}

        {/* Incentives tab */}
        {tab === 'incentives' && (
          <div className="bg-white rounded-xl border animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                    <th className="px-5 py-3 font-medium">Incentive</th>
                    <th className="px-5 py-3 font-medium">Employee</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {INCENTIVES.map((inc, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{inc.type}</td>
                      <td className="px-5 py-3 text-gray-600">{inc.employee}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">{inc.amount}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          inc.status === 'Approved' ? 'bg-brand-green-100 text-brand-green-800' :
                          inc.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-brand-blue-100 text-brand-blue-800'
                        }`}>{inc.status}</span>
                      </td>
                      <td className="px-5 py-3">
                        {inc.status === 'Approved' && (
                          <button onClick={() => showToast(`${inc.type} documentation downloaded`)} className="text-xs border text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
                            <Download className="w-3 h-3" /> Docs
                          </button>
                        )}
                        {inc.status === 'Pending' && (
                          <span className="text-xs text-gray-400">Awaiting review</span>
                        )}
                        {inc.status === 'Processing' && (
                          <span className="text-xs text-brand-blue-600">In progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t bg-gray-50 flex justify-between text-sm">
              <span className="text-gray-500">Total incentives earned</span>
              <span className="font-bold text-gray-900">{totalIncentives}</span>
            </div>
          </div>
        )}
      </div>
    </DemoPageShell>
  );
}
