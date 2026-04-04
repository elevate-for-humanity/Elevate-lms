'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, User, Loader2, AlertCircle, Building2, Users, FileText } from 'lucide-react';

interface Apprentice {
  id: string;
  name: string;
}

export default function ShopLogHoursPage() {
  const router = useRouter();
  const [apprentices, setApprentices] = useState<Apprentice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApprentice, setSelectedApprentice] = useState('');
  const [weekEnding, setWeekEnding] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [attestation, setAttestation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate next Friday for default week ending
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    setWeekEnding(nextFriday.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    async function fetchApprentices() {
      try {
        const response = await fetch('/api/pwa/shop-owner/dashboard');
        const data = await response.json();

        if (response.status === 401) {
          router.push('/login?redirect=/pwa/shop-owner/log-hours');
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load apprentices');
        }

        setApprentices(data.apprentices || []);
      } catch (err) {
        console.error('Failed to fetch apprentices:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchApprentices();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attestation) {
      setError('Please confirm the attestation');
      return;
    }
    
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/pwa/shop-owner/log-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apprenticeId: selectedApprentice,
          weekEnding,
          hours: parseFloat(hours),
          notes,
          attestation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log hours');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedApprentice('');
        setHours('');
        setNotes('');
        setAttestation(false);
      }, 2000);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-800 px-4 pt-12 pb-4 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/shop-owner" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-slate-900 font-bold text-xl">Log Apprentice Hours</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        {success ? (
          <div className="bg-white/20 border border-brand-green-500/30 rounded-xl p-6 text-center">
            <span className="text-slate-500 flex-shrink-0">•</span>
            <h2 className="text-slate-900 font-bold text-xl mb-2">Hours Logged!</h2>
            <p className="text-white">Training hours have been recorded and submitted.</p>
          </div>
        ) : apprentices.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-slate-900 font-medium mb-2">No Apprentices</p>
            <p className="text-slate-500 text-sm">You don't have any apprentices assigned yet.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-white/20 border border-brand-red-500/30 rounded-xl p-4 text-white text-sm">
                {error}
              </div>
            )}

            {/* Apprentice Selection */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Select Apprentice</label>
              <div className="space-y-2">
                {apprentices.map((apprentice) => (
                  <button
                    key={apprentice.id}
                    type="button"
                    onClick={() => setSelectedApprentice(apprentice.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      selectedApprentice === apprentice.id
                        ? 'bg-brand-blue-600 border-2 border-brand-blue-400'
                        : 'bg-slate-800 border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedApprentice === apprentice.id ? 'bg-white/20' : 'bg-slate-700'
                    }`}>
                      <User className={`w-5 h-5 ${selectedApprentice === apprentice.id ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className={`font-medium ${selectedApprentice === apprentice.id ? 'text-white' : 'text-slate-300'}`}>
                      {apprentice.name}
                    </span>
                    {selectedApprentice === apprentice.id && (
                      <span className="text-slate-500 flex-shrink-0">•</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Week Ending Date */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Week Ending (Friday)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="date"
                  value={weekEnding}
                  onChange={(e) => setWeekEnding(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Hours */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Hours Worked This Week</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="60"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g., 40"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Quick Hour Buttons */}
            <div className="flex gap-2 flex-wrap">
              {[20, 30, 40, 45].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHours(h.toString())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    hours === h.toString()
                      ? 'bg-brand-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {h} hrs
                </button>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this week's training..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Attestation */}
            <label className="flex items-start gap-3 bg-slate-800 rounded-xl p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={attestation}
                onChange={(e) => setAttestation(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-700 text-brand-blue-600 focus:ring-brand-blue-500"
              />
              <span className="text-slate-600 text-sm">
                I attest that the hours reported above are accurate and that the apprentice was under proper supervision during all training activities.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !selectedApprentice || !hours || !attestation}
              className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  Submit Hours
                </>
              )}
            </button>
          </form>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/shop-owner" className="flex flex-col items-center gap-1 text-slate-400">
            <Building2 className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/shop-owner/log-hours" className="flex flex-col items-center gap-1 text-brand-blue-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/shop-owner/apprentices" className="flex flex-col items-center gap-1 text-slate-400">
            <Users className="w-6 h-6" />
            <span className="text-xs">Team</span>
          </Link>
          <Link href="/pwa/shop-owner/reports" className="flex flex-col items-center gap-1 text-slate-400">
            <FileText className="w-6 h-6" />
            <span className="text-xs">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
