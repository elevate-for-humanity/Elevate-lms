'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Save, Loader2, Video, MapPin } from 'lucide-react';

export default function NewMentorSessionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    mentee_email: '', topic: '', scheduled_at: '',
    duration_minutes: '60', location_type: 'video', location_detail: '', notes: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/mentor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to schedule session');
      router.push('/mentor/sessions');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Calendar className="w-7 h-7 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">Schedule Session</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-slate-200 rounded-2xl p-6">
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mentee Email *</label>
          <input type="email" required value={form.mentee_email} onChange={e => set('mentee_email', e.target.value)}
            placeholder="mentee@email.com"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Topic *</label>
          <input required value={form.topic} onChange={e => set('topic', e.target.value)}
            placeholder="e.g. Career planning, resume review, skill development"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time *</label>
            <input type="datetime-local" required value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
            <select value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Location Type</label>
          <div className="flex gap-3">
            {[
              { value: 'video', label: 'Video Call', icon: Video },
              { value: 'in_person', label: 'In Person', icon: MapPin },
            ].map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => set('location_type', value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  form.location_type === value
                    ? 'bg-brand-blue-600 text-white border-brand-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {form.location_type === 'video' ? 'Video Link' : 'Address / Location'}
          </label>
          <input value={form.location_detail} onChange={e => set('location_detail', e.target.value)}
            placeholder={form.location_type === 'video' ? 'https://meet.google.com/...' : '8888 Keystone Crossing, Indianapolis IN'}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            placeholder="Agenda, preparation notes, or anything the mentee should know"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Scheduling…' : 'Schedule Session'}
          </button>
          <a href="/mentor/sessions" className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium">Cancel</a>
        </div>
      </form>
    </div>
  );
}

