'use client';

import { useState } from 'react';
import { DemoPageShell } from '@/components/demo/DemoPageShell';
import Link from 'next/link';
import { BookOpen, Clock, Trophy, ChevronRight, ArrowRight, Play, Download, Plus, CheckCircle, Calendar } from 'lucide-react';

const COURSES = [
  { id: 1, name: 'CDL Pre-Trip Inspection', progress: 100, status: 'Completed', grade: 'A' },
  { id: 2, name: 'CDL Road Skills', progress: 72, status: 'In Progress', grade: 'B+', nextLesson: 'Highway merging techniques' },
  { id: 3, name: 'HAZMAT Safety', progress: 45, status: 'In Progress', grade: 'B', nextLesson: 'Placarding requirements' },
  { id: 4, name: 'DOT Regulations', progress: 0, status: 'Not Started', grade: '—', nextLesson: 'Hours of service rules' },
];

const HOURS_LOG = [
  { date: 'Feb 14', hours: 8, activity: 'Behind-the-wheel training', supervisor: 'Tom Richards', approved: true },
  { date: 'Feb 13', hours: 6, activity: 'Yard maneuvers practice', supervisor: 'Tom Richards', approved: true },
  { date: 'Feb 12', hours: 4, activity: 'Classroom — DOT regulations', supervisor: 'Instructor Davis', approved: true },
  { date: 'Feb 11', hours: 8, activity: 'Highway driving — I-65 route', supervisor: 'Tom Richards', approved: false },
  { date: 'Feb 10', hours: 6, activity: 'Pre-trip inspection practice', supervisor: 'Tom Richards', approved: true },
];

const CERTS = [
  { name: 'CDL Learner Permit', issued: 'Dec 2025', status: 'Active' },
  { name: 'HAZMAT Awareness', issued: 'Jan 2026', status: 'Active' },
];

export default function DemoLearnerPage() {
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
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-fade-in-up">{toast}</div>
      )}

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in-up">
          <div className="bg-white rounded-xl border p-4">
            <BookOpen className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">4</div>
            <div className="text-xs text-gray-500">Courses</div>
            <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '54%' }} />
            </div>
            <div className="text-[10px] text-gray-400 mt-1">54% overall completion</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <Clock className="w-5 h-5 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalHours}</div>
            <div className="text-xs text-gray-500">of 2,000 Hours</div>
            <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${(totalHours / 2000) * 100}%` }} />
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{((totalHours / 2000) * 100).toFixed(0)}% complete</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <Trophy className="w-5 h-5 text-amber-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{CERTS.length}</div>
            <div className="text-xs text-gray-500">Credentials</div>
            <div className="mt-2 text-[10px] text-green-600 font-medium">All current</div>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-white rounded-xl border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">My Courses</h3>
          </div>
          <div className="divide-y">
            {COURSES.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{c.name}</span>
                    {c.status === 'Completed' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.status === 'Completed' ? `Grade: ${c.grade}` : c.nextLesson ? `Next: ${c.nextLesson}` : 'Ready to start'}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.progress === 100 ? 'bg-green-500' : c.progress > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{c.progress}%</span>
                  </div>
                  {c.status === 'In Progress' && (
                    <button onClick={() => showToast(`Resuming ${c.name}...`)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1">
                      <Play className="w-3 h-3" /> Resume
                    </button>
                  )}
                  {c.status === 'Not Started' && (
                    <button onClick={() => showToast(`Starting ${c.name}...`)} className="text-xs border text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                      Start
                    </button>
                  )}
                  {c.status === 'Completed' && (
                    <button onClick={() => showToast('Certificate downloaded')} className="text-xs text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-50 transition flex items-center gap-1">
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
            <button onClick={() => setShowLogForm(!showLogForm)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition flex items-center gap-1">
              <Plus className="w-3 h-3" /> Log Hours
            </button>
          </div>
          {showLogForm && (
            <div className="px-5 py-4 bg-gray-50 border-b flex flex-col sm:flex-row gap-3 animate-fade-in-up">
              <input type="number" placeholder="Hours" value={logHours} onChange={e => setLogHours(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-red-500" />
              <input type="text" placeholder="Activity description" value={logActivity} onChange={e => setLogActivity(e.target.value)} className="border rounded-lg px-3 py-2 text-sm flex-1 outline-none focus:ring-2 focus:ring-red-500" />
              <button onClick={submitHours} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition">Submit</button>
            </div>
          )}
          <div className="divide-y">
            {extraHours.map((h, i) => (
              <div key={`new-${i}`} className="px-5 py-3 flex items-center justify-between bg-green-50">
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
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{h.activity}</div>
                  <div className="text-xs text-gray-500">{h.date} · {h.supervisor}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{h.hours}h</span>
                  {h.approved ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
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
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                  <div className="text-xs text-gray-500">Issued {c.issued}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">{c.status}</span>
                  <button onClick={() => showToast(`${c.name} downloaded`)} className="text-xs border text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
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
