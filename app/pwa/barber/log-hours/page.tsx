'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, CheckCircle, Loader2, Scissors, BookOpen, TrendingUp } from 'lucide-react';

export default function LogHoursPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/pwa/barber/log-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, hours: parseFloat(hours), notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to log hours');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        setHours('');
        setNotes('');
      }, 2000);
    } catch (error) {
      console.error('Error logging hours:', error);
      alert('Failed to log hours. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 px-4 pt-12 pb-4 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/barber" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Log Hours</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        {success ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">Hours Logged!</h2>
            <p className="text-green-200">Your training hours have been recorded.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Hours */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Hours Worked</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g., 8"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-slate-500 text-xs mt-2">Enter hours in 0.5 increments (max 12)</p>
            </div>

            {/* Quick Hour Buttons */}
            <div className="flex gap-2 flex-wrap">
              {[4, 6, 8, 10].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHours(h.toString())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    hours === h.toString()
                      ? 'bg-blue-600 text-white'
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
                placeholder="What did you work on today?"
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !hours}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Log {hours || '0'} Hours
                </>
              )}
            </button>
          </form>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-slate-400">
            <Scissors className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/barber/log-hours" className="flex flex-col items-center gap-1 text-blue-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/barber/training" className="flex flex-col items-center gap-1 text-slate-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Learn</span>
          </Link>
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
