'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Clock, Save, ArrowLeft } from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface Student {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Cohort {
  id: string;
  name: string;
}

export default function TakeAttendancePage() {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: cohortData } = await supabase
        .from('cohorts')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      setCohorts(cohortData || []);

      const { data: studentData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('role', 'student')
        .order('full_name')
        .limit(100);
      setStudents(studentData || []);
      setLoading(false);
    }
    load();
  }, [router]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    students.forEach(s => { all[s.id] = status; });
    setAttendance(all);
  };

  const handleSave = async (draft = false) => {
    if (!selectedCohort && !draft) {
      setError('Please select a cohort before submitting.');
      return;
    }
    setSaving(true);
    setError(null);

    const records = students.map(s => ({
      user_id: s.id,
      status: attendance[s.id] || 'absent',
      minutes_attended: attendance[s.id] === 'present' ? 390 : attendance[s.id] === 'late' ? 300 : 0,
    }));

    const cohortId = selectedCohort || 'draft';
    const res = await fetch(`/api/admin/cohorts/${cohortId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records, date: new Date().toISOString().split('T')[0], draft }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to save attendance.');
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    if (!draft) setTimeout(() => router.push('/staff-portal/attendance'), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  const statusColors: Record<AttendanceStatus, string> = {
    present: 'bg-green-100 text-green-700 border-green-300',
    absent: 'bg-red-100 text-red-700 border-red-300',
    late: 'bg-amber-100 text-amber-700 border-amber-300',
    excused: 'bg-slate-100 text-slate-600 border-slate-300',
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Staff Portal', href: '/staff-portal' },
            { label: 'Attendance', href: '/staff-portal/attendance' },
            { label: 'Take Attendance' },
          ]} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/staff-portal/attendance" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Take Attendance</h1>
            <p className="text-slate-500 text-sm">{today}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}
        {saved && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            Attendance saved successfully!
          </div>
        )}

        {/* Cohort selector */}
        <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Cohort</label>
          <select
            value={selectedCohort}
            onChange={e => setSelectedCohort(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue-500"
          >
            <option value="">— Select cohort —</option>
            {cohorts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-4">
          <button onClick={() => markAll('present')} className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">
            Mark All Present
          </button>
          <button onClick={() => markAll('absent')} className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">
            Mark All Absent
          </button>
          <span className="ml-auto text-sm text-slate-500 self-center">
            {presentCount} present · {absentCount} absent · {students.length - presentCount - absentCount} unmarked
          </span>
        </div>

        {/* Student list */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
          {students.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No active students found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {students.map(student => (
                <div key={student.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-blue-100 flex items-center justify-center text-brand-blue-700 font-semibold text-sm">
                      {student.full_name?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium text-slate-900">{student.full_name}</span>
                  </div>
                  <div className="flex gap-2">
                    {(['present', 'late', 'excused', 'absent'] as AttendanceStatus[]).map(status => (
                      <button
                        key={status}
                        onClick={() => setStatus(student.id, status)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border capitalize transition-all ${
                          attendance[student.id] === status
                            ? statusColors[status] + ' ring-2 ring-offset-1 ring-current'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !selectedCohort}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Submit Attendance'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
}
