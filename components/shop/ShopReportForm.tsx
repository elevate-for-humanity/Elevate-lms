
"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

interface Placement {
  id: string;
  profiles: {
    id: string;
    full_name: string;
  };
}

export function ShopReportForm({ placements: initialPlacements }: { placements: Placement[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [placements, setPlacements] = useState<Placement[]>(initialPlacements || []);
  const [placementId, setPlacementId] = useState(initialPlacements?.[0]?.id || '');
  const [previousReports, setPreviousReports] = useState<any[]>([]);

  // Load placements and previous reports from DB
  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load active placements for this shop
      const { data: placementData } = await supabase
        .from('apprentice_placements')
        .select('id, profiles:apprentice_id (id, full_name)')
        .eq('shop_user_id', user.id)
        .eq('status', 'active');
      
      if (placementData && placementData.length > 0) {
        setPlacements(placementData as any);
        setPlacementId(placementData[0].id);
      }

      // Load previous reports for reference
      const { data: reports } = await supabase
        .from('shop_weekly_reports')
        .select('id, week_start, week_end, hours_total, submitted_at')
        .eq('submitted_by', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5);
      
      if (reports) setPreviousReports(reports);
    }
    loadData();
  }, [supabase]);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [hoursOjt, setHoursOjt] = useState('0');
  const [hoursRelated, setHoursRelated] = useState('0');
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [competenciesNotes, setCompetenciesNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const total = (Number(hoursOjt) || 0) + (Number(hoursRelated) || 0);

    try {
      const res = await fetch('/api/shop/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId,
          weekStart,
          weekEnd,
          hoursTotal: total,
          hoursOjt: Number(hoursOjt) || 0,
          hoursRelated: Number(hoursRelated) || 0,
          attendanceNotes,
          competenciesNotes,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Report submitted successfully!' });
        // Reset form
        setWeekStart('');
        setWeekEnd('');
        setHoursOjt('0');
        setHoursRelated('0');
        setAttendanceNotes('');
        setCompetenciesNotes('');
        setTimeout(() => router.push('/shop/dashboard'), 2000);
      } else {
        const error = await res.json();
        setMessage({
          type: 'error',
          text: error.error || 'Could not submit report',
        });
      }
    } catch (error) { /* Error handled silently */ 
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  if (!placements || placements.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-brand-orange-50 border border-brand-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-brand-orange-600 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-black">
                No Active Apprentices
              </h2>
              <p className="mt-1 text-sm text-black">
                You don't have any active apprentices assigned yet. Contact your
                program sponsor to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">
          Submit Weekly Apprentice Report
        </h1>
        <p className="mt-2 text-black">
          Indiana weekly hours & attendance reporting for RAPIDS compliance
        </p>
      </div>

      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-6"
      >
        {/* Apprentice Selection */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Apprentice *
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            value={placementId}
            onChange={(e) => setPlacementId(e.target.value)}
            required
          >
            {placements.map((p) => (
              <option key={p.id} value={p.id}>
                {p.profiles?.full_name || 'Student'}
              </option>
            ))}
          </select>
        </div>

        {/* Week Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Week Start *
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Week End *
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              On-the-Job Training Hours *
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="168"
              className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              value={hoursOjt}
              onChange={(e) => setHoursOjt(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-black">
              Hours worked at the shop
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Related Instruction Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="168"
              className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              value={hoursRelated}
              onChange={(e) => setHoursRelated(e.target.value)}
            />
            <p className="mt-1 text-xs text-black">
              Elevate LMS coursework hours
            </p>
          </div>
        </div>

        {/* Total Hours Display */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-black">
            Total Hours This Week
          </div>
          <div className="text-2xl font-bold text-brand-blue-600">
            {(Number(hoursOjt) || 0) + (Number(hoursRelated) || 0)} hours
          </div>
        </div>

        {/* Attendance Notes */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Attendance / Progress Notes
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            rows={4}
            value={attendanceNotes}
            onChange={(e) => setAttendanceNotes(e.target.value)}
            placeholder="Note any absences, tardiness, or general progress observations..."
          />
        </div>

        {/* Competencies Notes */}
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Skills / Competencies Progress
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            rows={4}
            value={competenciesNotes}
            onChange={(e) => setCompetenciesNotes(e.target.value)}
            placeholder="Note specific skills practiced, competencies demonstrated, or areas needing improvement..."
          />
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`rounded-lg p-4 flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-brand-green-50 border border-brand-green-200'
                : 'bg-brand-red-50 border border-brand-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <span className="text-slate-500 flex-shrink-0">•</span>
            ) : (
              <AlertCircle className="w-5 h-5 text-brand-orange-600 mt-0.5" />
            )}
            <div
              className={`text-sm ${
                message.type === 'success' ? 'text-brand-green-800' : 'text-brand-red-800'
              }`}
            >
              {message.text}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Submitting...' : 'Submit Report'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/shop/dashboard')}
            className="px-6 py-3 border border-slate-300 text-black font-semibold rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
