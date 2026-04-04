'use client';

/**
 * ApprenticeHoursLogger
 *
 * Shared hours-logging UI for cosmetology, nail tech, and esthetician
 * apprentices. Mirrors the barber log-hours flow.
 *
 * Props:
 *   discipline  — 'cosmetology' | 'nail-tech' | 'esthetician'
 *   apiPath     — API route to POST hours to, e.g. '/api/pwa/cosmetology/log-hours'
 *   backHref    — where the back arrow goes
 *   accentColor — Tailwind bg class for the header, e.g. 'bg-purple-800'
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Loader2, CheckCircle2, Scissors, BookOpen, Sparkles, Hand, Flower2 } from 'lucide-react';

type HourCategory = 'practical' | 'theory' | 'sanitation' | 'customer_service';

const CATEGORIES: { value: HourCategory; label: string; description: string }[] = [
  { value: 'practical',         label: 'Practical Training',  description: 'Hands-on skills at the worksite' },
  { value: 'theory',            label: 'Theory / Classroom',  description: 'Elevate LMS curriculum, state board prep' },
  { value: 'sanitation',        label: 'Sanitation',          description: 'Cleaning, sterilization, safety' },
  { value: 'customer_service',  label: 'Customer Service',    description: 'Client interaction, consultation' },
];

const DISCIPLINE_ICONS: Record<string, React.ReactNode> = {
  cosmetology:  <Sparkles className="w-5 h-5 text-white" />,
  'nail-tech':  <Hand className="w-5 h-5 text-white" />,
  esthetician:  <Flower2 className="w-5 h-5 text-white" />,
};

interface Props {
  discipline: string;
  apiPath: string;
  backHref: string;
  accentColor?: string;
}

export default function ApprenticeHoursLogger({ discipline, apiPath, backHref, accentColor = 'bg-slate-800' }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('0');
  const [category, setCategory] = useState<HourCategory>('practical');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) { setError('Enter a valid number of hours.'); return; }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          hours: parseFloat(hours),
          minutes: parseInt(minutes),
          category,
          notes,
          discipline,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to log hours. Please try again.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setHours('');
      setMinutes('0');
      setNotes('');
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className={`${accentColor} px-4 pt-12 pb-4`}>
        <div className="flex items-center gap-4">
          <Link href={backHref} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex items-center gap-2">
            {DISCIPLINE_ICONS[discipline]}
            <h1 className="text-white font-bold text-xl">Log Hours</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {success ? (
          <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-emerald-300 font-bold">Hours logged successfully!</p>
            <p className="text-emerald-400 text-sm">Your supervisor will review and approve.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Date */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-3">
                <Calendar className="w-4 h-4" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Hours + Minutes */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-3">
                <Clock className="w-4 h-4" /> Time Worked
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="16"
                    step="1"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Minutes</label>
                  <select
                    value={minutes}
                    onChange={e => setMinutes(e.target.value)}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="0">0 min</option>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <label className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-3">
                <BookOpen className="w-4 h-4" /> Category
              </label>
              <div className="space-y-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                      category === cat.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="font-semibold">{cat.label}</span>
                    <span className="text-xs opacity-70 ml-2">{cat.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <label className="text-slate-300 text-sm font-medium mb-3 block">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="What did you work on today?"
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : <><Clock className="w-5 h-5" /> Log These Hours</>}
            </button>

          </form>
        )}
      </main>
    </div>
  );
}
