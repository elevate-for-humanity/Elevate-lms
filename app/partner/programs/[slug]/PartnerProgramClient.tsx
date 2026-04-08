'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Clock, Plus, ArrowLeft, Calendar,
  Loader2, AlertCircle, ClipboardList, CheckCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface Apprentice {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  start_date: string;
  total_hours: number;
}

interface ProgressEntry {
  id: string;
  apprentice_id: string;
  week_ending: string;
  hours_worked: number;
  notes: string | null;
  status: string;
  submitted_at: string;
  apprentice_name?: string;
}

interface Props {
  slug: string;
  programName: string;
  orgId: string | null;
}

function getNextFriday(): string {
  const today = new Date();
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntilFriday);
  return next.toISOString().split('T')[0];
}

export default function PartnerProgramClient({ slug, programName }: Props) {
  const [apprentices, setApprentices] = useState<Apprentice[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  const [entryForm, setEntryForm] = useState({
    apprenticeId: '',
    weekEnding: getNextFriday(),
    hoursWorked: '',
    notes: '',
  });

  useEffect(() => { fetchData(); }, [slug]);

  async function fetchData() {
    setLoading(true);
    try {
      const onboardingRes = await fetch('/api/partner/onboarding-status');
      const onboardingData = await onboardingRes.json();
      setOnboarded(onboardingData.completed ?? false);
      if (!onboardingData.completed) { setLoading(false); return; }

      const [apprenticesRes, progressRes] = await Promise.all([
        fetch(`/api/partner/apprentices?program=${encodeURIComponent(slug)}`),
        fetch(`/api/partner/progress?program=${encodeURIComponent(slug)}`),
      ]);
      const apprenticesData = await apprenticesRes.json();
      const progressData = await progressRes.json();
      setApprentices(apprenticesData.apprentices || []);
      setProgressEntries(progressData.entries || []);
    } catch {
      setError('Failed to load program data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitProgress(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/partner/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apprenticeId: entryForm.apprenticeId,
          programId: slug,
          weekEnding: entryForm.weekEnding,
          hoursWorked: parseFloat(entryForm.hoursWorked),
          notes: entryForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit progress');
      setSuccess('Progress entry submitted successfully!');
      setShowEntryForm(false);
      setEntryForm({ apprenticeId: '', weekEnding: getNextFriday(), hoursWorked: '', notes: '' });
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit progress');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  if (onboarded === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Onboarding Required</h2>
          <p className="text-gray-600 mb-4">Complete your partner onboarding before managing apprentices.</p>
          <Link href="/partner/onboarding" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
            Complete Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Partner', href: '/partner-portal' },
            { label: 'Programs', href: '/partner/programs' },
            { label: programName },
          ]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/partner/dashboard" className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{programName}</h1>
              <p className="text-gray-500 text-sm">{apprentices.length} active apprentice{apprentices.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => setShowEntryForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            <Plus className="w-4 h-4" /> Log Hours
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg flex items-center gap-3 text-brand-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" /> {success}
          </div>
        )}

        {/* Log Hours Form */}
        {showEntryForm && (
          <div className="mb-6 bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Log Training Hours</h2>
            <form onSubmit={handleSubmitProgress} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apprentice</label>
                  <select
                    value={entryForm.apprenticeId}
                    onChange={(e) => setEntryForm({ ...entryForm, apprenticeId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  >
                    <option value="">Select apprentice…</option>
                    {apprentices.map((a) => (
                      <option key={a.id} value={a.id}>{a.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Week Ending</label>
                  <input
                    type="date"
                    value={entryForm.weekEnding}
                    onChange={(e) => setEntryForm({ ...entryForm, weekEnding: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    step="0.5"
                    value={entryForm.hoursWorked}
                    onChange={(e) => setEntryForm({ ...entryForm, hoursWorked: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
                <button type="button" onClick={() => setShowEntryForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Apprentices */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-blue-600" /> Apprentices
            </h2>
            {apprentices.length > 0 ? (
              <div className="space-y-3">
                {apprentices.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{a.full_name}</p>
                      <p className="text-xs text-gray-500">{a.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{a.total_hours}h</p>
                      <p className="text-xs text-gray-500">total hours</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm">No apprentices enrolled yet</p>
            )}
          </div>

          {/* Recent Progress */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand-blue-600" /> Recent Hours Logged
            </h2>
            {progressEntries.length > 0 ? (
              <div className="space-y-3">
                {progressEntries.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{entry.apprentice_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Week ending {new Date(entry.week_ending).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {entry.hours_worked}h
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        entry.status === 'approved'
                          ? 'bg-brand-green-100 text-brand-green-700'
                          : entry.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm">No hours logged yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
