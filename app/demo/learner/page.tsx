'use client';

import { useState, useEffect } from 'react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import Link from 'next/link';
import { BookOpen, Clock, Trophy, ChevronRight, ArrowRight, Play, Download, Plus, Calendar } from 'lucide-react';

import { createBrowserClient } from '@supabase/ssr';

export default function DemoLearnerPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  const COURSES = (dbRows as any[]) || [];
  const HOURS_LOG = (dbRows as any[]) || [];
  const CERTS = (dbRows as any[]) || [];
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('program_enrollments').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [toast, setToast] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logHours, setLogHours] = useState('');
  const [logActivity, setLogActivity] = useState('');
  const [extraHours, setExtraHours] = useState<{ date: string; hours: number; activity: string }[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const submitHours = () => {
    if (!logHours || !logActivity) return;
    setExtraHours(prev => [{ date: 'Today', hours: Number(logHours), activity: logActivity }, ...prev]);
    showToast(`${logHours} hours submitted for supervisor approval`);
    setLogHours('');
    setLogActivity('');
    setShowLogForm(false);
  };

  const totalHours = 680 + extraHours.reduce((s, h) => s + h.hours, 0);

  return (
    <DemoPageShell title="My Dashboard" description="Welcome back, Marcus. Here's your training progress." portal="learner">
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-brand-green-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-fade-in-up">{toast}</div>
      )}

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in-up">
          <div className="bg-white rounded-xl border p-4">
            <BookOpen className="w-5 h-5 text-brand-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">4</div>
            <div className="text-xs text-gray-500">Courses</div>
            <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-blue-500 rounded-full" style={{ width: '54%' }} />
            </div>
            <div className="text-[10px] text-gray-400 mt-1">54% overall completion</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <Clock className="w-5 h-5 text-brand-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalHours}</div>
            <div className="text-xs text-gray-500">of 2,000 Hours</div>
            <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-green-500 rounded-full" style={{ width: `${(totalHours / 2000) * 100}%` }} />
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{((totalHours / 2000) * 100).toFixed(0)}% complete</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <Trophy className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{CERTS.length}</div>
            <div className="text-xs text-gray-500">Credentials</div>
            <div className="mt-2 text-[10px] text-brand-green-600 font-medium">All current</div>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-white rounded-xl border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">My Courses</h3>
          </div>
          <div className="divide-y">
            {COURSES.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-white">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{c.name}</span>
                    {c.status === 'Completed' && <span className="text-slate-400 flex-shrink-0">•</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.status === 'Completed' ? `Grade: ${c.grade}` : c.nextLesson ? `Next: ${c.nextLesson}` : 'Ready to start'}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.progress === 100 ? 'bg-brand-green-500' : c.progress > 0 ? 'bg-brand-blue-500' : 'bg-gray-300'}`} style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{c.progress}%</span>
                  </div>
                  {c.status === 'In Progress' && (
                    <button onClick={() => showToast(`Resuming ${c.name}...`)} className="text-xs bg-brand-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-1">
                      <Play className="w-3 h-3" /> Resume
                    </button>
                  )}
                  {c.status === 'Not Started' && (
                    <button onClick={() => showToast(`Starting ${c.name}...`)} className="text-xs border text-gray-600 px-3 py-1.5 rounded-lg hover:bg-white transition">
                      Start
                    </button>
                  )}
                  {c.status === 'Completed' && (
                    <button onClick={() => showToast('Certificate downloaded')} className="text-xs text-brand-green-600 px-3 py-1.5 rounded-lg hover:bg-brand-green-50 transition flex items-center gap-1">
                      <Download className="w-3 h-3" /> Cert
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hours log */}
        <div className="bg-white rounded-xl border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Hours Log</h3>
            <button onClick={() => setShowLogForm(!showLogForm)} className="text-xs bg-brand-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-red-700 transition flex items-center gap-1">
              <Plus className="w-3 h-3" /> Log Hours
            </button>
          </div>
          {showLogForm && (
            <div className="px-5 py-4 bg-white border-b flex flex-col sm:flex-row gap-3 animate-fade-in-up">
              <input type="number" placeholder="Hours" value={logHours} onChange={e => setLogHours(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-brand-red-500" />
              <input type="text" placeholder="Activity description" value={logActivity} onChange={e => setLogActivity(e.target.value)} className="border rounded-lg px-3 py-2 text-sm flex-1 outline-none focus:ring-2 focus:ring-brand-red-500" />
              <button onClick={submitHours} className="bg-brand-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-green-700 transition">Submit</button>
            </div>
          )}
          <div className="divide-y">
            {extraHours.map((h, i) => (
              <div key={`new-${i}`} className="px-5 py-3 flex items-center justify-between bg-brand-green-50">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{h.activity}</div>
                  <div className="text-xs text-gray-500">{h.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{h.hours}h</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Pending</span>
                </div>
              </div>
            ))}
            {HOURS_LOG.map((h, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-white">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{h.activity}</div>
                  <div className="text-xs text-gray-500">{h.date} · {h.supervisor}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{h.hours}h</span>
                  {h.approved ? (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-white rounded-xl border">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">My Credentials</h3>
          </div>
          <div className="divide-y">
            {CERTS.map((c, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-white">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                  <div className="text-xs text-gray-500">Issued {c.issued}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded font-medium">{c.status}</span>
                  <button onClick={() => showToast(`${c.name} downloaded`)} className="text-xs border text-gray-600 px-3 py-1.5 rounded-lg hover:bg-white transition flex items-center gap-1">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoPageShell>
  );
}
