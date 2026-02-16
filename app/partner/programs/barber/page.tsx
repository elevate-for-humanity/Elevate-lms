'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Scissors, 
  Users, 
  Clock, 
  Plus, 
  ArrowLeft,
  Calendar,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  ClipboardList,
CheckCircle, } from 'lucide-react';
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

interface OnboardingStatus {
  completed: boolean;
  step?: string;
  shopName?: string;
}

export default function BarberPartnerPage() {
  const router = useRouter();
  const [apprentices, setApprentices] = useState<Apprentice[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  
  const [entryForm, setEntryForm] = useState({
    apprenticeId: '',
    weekEnding: getNextFriday(),
    hoursWorked: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  function getNextFriday(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toISOString().split('T')[0];
  }

  async function fetchData() {
    setLoading(true);
    try {
      // First check onboarding status
      const onboardingRes = await fetch('/api/partner/onboarding-status');
      const onboardingData = await onboardingRes.json();
      setOnboardingStatus(onboardingData);
      
      // If not onboarded, don't fetch other data
      if (!onboardingData.completed) {
        setLoading(false);
        return;
      }
      
      const [apprenticesRes, progressRes] = await Promise.all([
        fetch('/api/partner/apprentices?program=barber'),
        fetch('/api/partner/progress?program=barber'),
      ]);
      
      const apprenticesData = await apprenticesRes.json();
      const progressData = await progressRes.json();
      
      setApprentices(apprenticesData.apprentices || []);
      setProgressEntries(progressData.entries || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
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
          programId: 'barber',
          weekEnding: entryForm.weekEnding,
          hoursWorked: parseFloat(entryForm.hoursWorked),
          notes: entryForm.notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit progress');
      }

      setSuccess('Progress entry submitted successfully!');
      setShowEntryForm(false);
      setEntryForm({
        apprenticeId: '',
        weekEnding: getNextFriday(),
        hoursWorked: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  // Show onboarding required screen if not completed
  if (onboardingStatus && !onboardingStatus.completed) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Complete Onboarding First
            </h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Before you can manage apprentices and submit progress reports, you need to complete the partner onboarding process. This includes providing your business information, license details, and signing the partnership agreement.
            </p>
            <div className="space-y-4">
              <Link
                href="/partner/onboarding"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-brand-blue-600 text-white font-semibold rounded-xl hover:bg-brand-blue-700 transition-colors"
              >
                <ClipboardList className="w-5 h-5" />
                Start Onboarding
              </Link>
              <Link
                href="/partner/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
            </div>
            <div className="mt-8 p-4 bg-brand-blue-50 rounded-xl">
              <h3 className="font-semibold text-brand-blue-900 mb-2">What you&apos;ll need:</h3>
              <ul className="text-sm text-brand-blue-800 text-left space-y-1">
                <li>• Business name and EIN</li>
                <li>• Barber/Cosmetology license number</li>
                <li>• Business address and contact info</li>
                <li>• Capacity for apprentices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Programs', href: '/partner/programs' }, { label: 'Barber' }]} />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/partner/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-blue-600 rounded-xl flex items-center justify-center">
                <Scissors className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Barber Apprenticeship</h1>
                <p className="text-slate-500">{apprentices.length} active apprentice{apprentices.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={() => setShowEntryForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Enter Weekly Progress
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
            <span className="text-slate-400 flex-shrink-0">•</span>
            {success}
          </div>
        )}

        {/* Apprentices Section */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Assigned Apprentices</h2>
          {apprentices.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No apprentices assigned yet</p>
              <p className="text-sm text-slate-400 mt-1">Apprentices will appear here once they are assigned to your shop</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apprentices.map((apprentice) => (
                <div key={apprentice.id} className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      {apprentice.avatar_url ? (
                        <img src={apprentice.avatar_url} alt={apprentice.full_name || 'Apprentice'} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-brand-blue-600">
                          {apprentice.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{apprentice.full_name}</h3>
                      <p className="text-sm text-slate-500">{apprentice.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4" />
                      Started {new Date(apprentice.start_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-brand-blue-600 font-medium">
                      <Clock className="w-4 h-4" />
                      {apprentice.total_hours} hrs
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Progress History */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Progress History</h2>
            <button className="flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {progressEntries.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No progress entries yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Apprentice</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Week Ending</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Hours</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Notes</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {progressEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">{entry.apprentice_name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(entry.week_ending).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{entry.hours_worked}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{entry.notes || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          entry.status === 'verified' ? 'bg-green-100 text-green-700' :
                          entry.status === 'submitted' ? 'bg-brand-blue-100 text-brand-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(entry.submitted_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Enter Weekly Progress</h3>
            <form onSubmit={handleSubmitProgress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apprentice *</label>
                <select
                  value={entryForm.apprenticeId}
                  onChange={(e) => setEntryForm({ ...entryForm, apprenticeId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  required
                >
                  <option value="">Select apprentice...</option>
                  {apprentices.map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Week Ending (Friday) *</label>
                <input
                  type="date"
                  value={entryForm.weekEnding}
                  onChange={(e) => setEntryForm({ ...entryForm, weekEnding: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hours Worked *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="80"
                  value={entryForm.hoursWorked}
                  onChange={(e) => setEntryForm({ ...entryForm, hoursWorked: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="e.g., 40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                <textarea
                  value={entryForm.notes}
                  onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  rows={3}
                  placeholder="Any notes about this week..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEntryForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
