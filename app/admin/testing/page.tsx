'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const VENDORS = [
  { value: 'act_workkeys', label: 'ACT WorkKeys' },
  { value: 'certiport', label: 'Certiport' },
  { value: 'hsi', label: 'HSI' },
  { value: 'epa_hvac', label: 'EPA/HVAC' },
  { value: 'hiset_hse', label: 'HiSET/HSE' },
  { value: 'other', label: 'Other' },
];

export default function TestingPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ student_name: '', vendor: 'certiport', exam_name: '', scheduled_at: '', notes: '' });
  const [filter, setFilter] = useState('upcoming');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase.from('testing_sessions').select('*').order('scheduled_at', { ascending: false });
      if (filter === 'upcoming') query = query.gte('scheduled_at', new Date().toISOString());
      else if (filter === 'past') query = query.lt('scheduled_at', new Date().toISOString());
      const { data } = await query;
      setSessions(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function createSession() {
    if (!form.student_name || !form.exam_name || !form.scheduled_at) return;
    try {
      const supabase = createClient();
      await supabase.from('testing_sessions').insert({ ...form, status: 'scheduled' });
      setShowCreate(false);
      setForm({ student_name: '', vendor: 'certiport', exam_name: '', scheduled_at: '', notes: '' });
      fetchSessions();
    } catch (err) { alert('Failed to create session'); }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const supabase = createClient();
      await supabase.from('testing_sessions').update({ status }).eq('id', id);
      fetchSessions();
    } catch (err) { alert('Failed to update'); }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold">Testing Center</h1><p className="text-gray-600">{sessions.length} sessions</p></div>
        <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">+ Schedule Test</button>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => { setFilter('upcoming'); fetchSessions(); }} className={`px-4 py-2 rounded-lg ${filter === 'upcoming' ? 'bg-blue-600 text-white' : 'border'}`}>Upcoming</button>
        <button onClick={() => { setFilter('past'); fetchSessions(); }} className={`px-4 py-2 rounded-lg ${filter === 'past' ? 'bg-blue-600 text-white' : 'border'}`}>Past</button>
        <button onClick={() => { setFilter('all'); fetchSessions(); }} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'border'}`}>All</button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
      : sessions.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-600">No testing sessions</p></div>
      : (
        <div className="grid gap-4">
          {sessions.map(session => (
            <div key={session.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{session.student_name}</div>
                <div className="text-sm text-gray-600">{session.exam_name}</div>
                <div className="text-sm text-gray-500">{VENDORS.find(v => v.value === session.vendor)?.label}</div>
                <div className="text-sm text-gray-500">{new Date(session.scheduled_at).toLocaleDateString()} {new Date(session.scheduled_at).toLocaleTimeString()}</div>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-1 rounded text-sm ${session.status === 'completed' ? 'bg-green-100 text-green-700' : session.status === 'failed' ? 'bg-red-100 text-red-700' : session.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>{session.status}</span>
                {session.score && <span className="text-sm font-medium">{session.score}%</span>}
                <select onChange={(e) => updateStatus(session.id, e.target.value)} value={session.status} className="border rounded px-2 py-1 text-sm">
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Schedule Test</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Student Name</label><input type="text" value={form.student_name} onChange={(e) => setForm({...form, student_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Vendor</label><select value={form.vendor} onChange={(e) => setForm({...form, vendor: e.target.value})} className="w-full border rounded-lg px-3 py-2">{VENDORS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Exam Name</label><input type="text" value={form.exam_name} onChange={(e) => setForm({...form, exam_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="e.g., CompTIA A+ Core 1" /></div>
              <div><label className="block text-sm font-medium mb-1">Date & Time</label><input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({...form, scheduled_at: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={createSession} disabled={!form.student_name || !form.exam_name || !form.scheduled_at} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
