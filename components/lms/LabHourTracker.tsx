'use client';

/**
 * Lab Hour Tracker
 *
 * Logs hands-on lab hours per HVAC module to localStorage.
 * The program requires 70 hours of lab training for EPA 608 eligibility
 * and ETPL compliance. Students log each lab session with date, duration,
 * and supervisor initials. Instructors can export the log as a CSV.
 *
 * localStorage key: hvac-lab-hours
 */

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Download, CheckCircle, Clock, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'hvac-lab-hours';
const REQUIRED_HOURS = 70;

// Lab activities defined in the course — pulled from definitions.ts lab lessons
export const LAB_ACTIVITIES: { id: string; moduleId: string; title: string; requiredMinutes: number; description: string }[] = [
  { id: 'hvac-02-04', moduleId: 'hvac-02', title: 'System Components Identification',    requiredMinutes: 60,  description: 'Identify compressor, condenser, evaporator, metering device, and airflow components' },
  { id: 'hvac-03-03', moduleId: 'hvac-03', title: 'Multimeter & Amp Clamp Lab',          requiredMinutes: 90,  description: 'Measure voltage, amperage, resistance, and capacitance on live circuits' },
  { id: 'hvac-04-04', moduleId: 'hvac-04', title: 'Combustion Analysis',                 requiredMinutes: 60,  description: 'CO testing, draft measurement, gas pressure checks, and temperature rise' },
  { id: 'hvac-04-05', moduleId: 'hvac-04', title: 'Furnace Inspection Lab',              requiredMinutes: 90,  description: 'Complete furnace inspection, tune-up, and safety check procedure' },
  { id: 'hvac-05-05', moduleId: 'hvac-05', title: 'Superheat & Subcooling Lab',          requiredMinutes: 90,  description: 'Measure and calculate superheat and subcooling on a live system' },
  { id: 'hvac-08-06', moduleId: 'hvac-08', title: 'Recovery Equipment Lab',              requiredMinutes: 90,  description: 'Hands-on refrigerant recovery from a high-pressure system using certified equipment' },
  { id: 'hvac-11-03', moduleId: 'hvac-11', title: 'Leak Detection Lab',                  requiredMinutes: 60,  description: 'Electronic leak detection, nitrogen pressure test, and standing vacuum test' },
  { id: 'hvac-11-04', moduleId: 'hvac-11', title: 'Recovery & Evacuation Lab',           requiredMinutes: 90,  description: 'Recover refrigerant, pull vacuum to 500 microns, and charge system to spec' },
  { id: 'hvac-12-03', moduleId: 'hvac-12', title: 'Brazing & Soldering Lab',             requiredMinutes: 90,  description: 'Braze copper tubing with nitrogen purge, pressure test joints' },
  { id: 'hvac-12-04', moduleId: 'hvac-12', title: 'Line Set Installation',               requiredMinutes: 60,  description: 'Measure, cut, flare, and connect refrigerant line sets' },
  { id: 'hvac-12-05', moduleId: 'hvac-12', title: 'System Commissioning Lab',            requiredMinutes: 90,  description: 'Vacuum, charge, airflow verification, temperature split, and commissioning checklist' },
  { id: 'hvac-13-04', moduleId: 'hvac-13', title: 'Troubleshooting Scenarios Lab',       requiredMinutes: 120, description: 'Diagnose and repair multiple system faults on training equipment' },
  { id: 'hvac-13-05', moduleId: 'hvac-13', title: 'Customer Communication Simulation',   requiredMinutes: 30,  description: 'Role-play service call: explain findings, present estimate, handle objections' },
  { id: 'hvac-15-03', moduleId: 'hvac-15', title: 'CPR Skills Assessment',               requiredMinutes: 45,  description: 'Hands-on CPR and AED practice — must demonstrate competency' },
  { id: 'hvac-16-04', moduleId: 'hvac-16', title: 'Mock Interview with Employer Partner', requiredMinutes: 30, description: '15-minute mock interview evaluated on professionalism and technical knowledge' },
];

interface LabEntry {
  id: string;           // activity id
  date: string;         // ISO date string
  minutesLogged: number;
  supervisorInitials: string;
  notes: string;
  loggedAt: number;     // timestamp
}

interface Props {
  /** If provided, only show the lab for this specific activity */
  activityId?: string;
  /** Show compact single-activity log form */
  compact?: boolean;
}

function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}m`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}m`;
}

function downloadCSV(entries: LabEntry[]) {
  const header = 'Activity,Date,Hours,Supervisor,Notes\n';
  const rows = entries.map(e => {
    const activity = LAB_ACTIVITIES.find(a => a.id === e.id)?.title ?? e.id;
    const hours = (e.minutesLogged / 60).toFixed(2);
    return `"${activity}","${e.date}","${hours}","${e.supervisorInitials}","${e.notes.replace(/"/g, '""')}"`;
  });
  const csv = header + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hvac-lab-hours-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LabHourTracker({ activityId, compact = false }: Props) {
  const [entries, setEntries] = useState<LabEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form state
  const [formActivity, setFormActivity] = useState(activityId ?? LAB_ACTIVITIES[0].id);
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formMinutes, setFormMinutes] = useState('');
  const [formSupervisor, setFormSupervisor] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setEntries(stored);
    } catch { /* ignore */ }
  }, []);

  const save = (updated: LabEntry[]) => {
    setEntries(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const submitEntry = () => {
    setFormError('');
    const mins = parseInt(formMinutes, 10);
    if (!formMinutes || isNaN(mins) || mins < 1 || mins > 480) {
      setFormError('Enter a valid duration (1–480 minutes).');
      return;
    }
    if (!formSupervisor.trim()) {
      setFormError('Supervisor initials are required.');
      return;
    }
    const entry: LabEntry = {
      id: formActivity,
      date: formDate,
      minutesLogged: mins,
      supervisorInitials: formSupervisor.trim().toUpperCase(),
      notes: formNotes.trim(),
      loggedAt: Date.now(),
    };
    save([...entries, entry]);
    setFormMinutes('');
    setFormSupervisor('');
    setFormNotes('');
    setShowForm(false);
  };

  const deleteEntry = (loggedAt: number) => {
    save(entries.filter(e => e.loggedAt !== loggedAt));
  };

  // Totals
  const totalMinutes = entries.reduce((sum, e) => sum + e.minutesLogged, 0);
  const totalHours = totalMinutes / 60;
  const pct = Math.min(100, Math.round((totalHours / REQUIRED_HOURS) * 100));
  const reached = totalHours >= REQUIRED_HOURS;

  // Per-activity totals
  const activityTotals: Record<string, number> = {};
  for (const e of entries) {
    activityTotals[e.id] = (activityTotals[e.id] ?? 0) + e.minutesLogged;
  }

  const displayActivities = activityId
    ? LAB_ACTIVITIES.filter(a => a.id === activityId)
    : LAB_ACTIVITIES;

  // ── Compact single-activity mode ──────────────────────────────────────
  if (compact && activityId) {
    const activity = LAB_ACTIVITIES.find(a => a.id === activityId);
    if (!activity) return null;
    const logged = activityTotals[activityId] ?? 0;
    const done = logged >= activity.requiredMinutes;
    const actEntries = entries.filter(e => e.id === activityId);

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className={`w-4 h-4 ${done ? 'text-brand-green-600' : 'text-slate-400'}`} />
            <span className="text-sm font-bold text-slate-900">Lab Hours</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${done ? 'bg-brand-green-100 text-brand-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {formatMinutes(logged)} / {formatMinutes(activity.requiredMinutes)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${done ? 'bg-brand-green-500' : 'bg-brand-blue-500'}`}
            style={{ width: `${Math.min(100, Math.round((logged / activity.requiredMinutes) * 100))}%` }}
          />
        </div>

        {/* Past entries */}
        {actEntries.length > 0 && (
          <div className="space-y-1">
            {actEntries.map(e => (
              <div key={e.loggedAt} className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-1.5">
                <span>{e.date} · {formatMinutes(e.minutesLogged)} · {e.supervisorInitials}</span>
                <button onClick={() => deleteEntry(e.loggedAt)} className="text-slate-300 hover:text-red-500 transition">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Log form */}
        {showForm ? (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Date</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-blue-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Minutes</label>
                <input type="number" min="1" max="480" placeholder="e.g. 90" value={formMinutes}
                  onChange={e => setFormMinutes(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-blue-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Supervisor Initials</label>
              <input type="text" maxLength={4} placeholder="e.g. MJ" value={formSupervisor}
                onChange={e => setFormSupervisor(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Notes (optional)</label>
              <input type="text" placeholder="Equipment used, observations..." value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-blue-400" />
            </div>
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <button onClick={submitEntry}
                className="flex-1 py-2 bg-brand-blue-600 text-white text-sm font-bold rounded-lg hover:bg-brand-blue-700 transition">
                Save
              </button>
              <button onClick={() => { setShowForm(false); setFormError(''); }}
                className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-brand-blue-300 text-brand-blue-600 text-sm font-semibold rounded-lg hover:bg-brand-blue-50 transition">
            <Plus className="w-4 h-4" /> Log Lab Session
          </button>
        )}
      </div>
    );
  }

  // ── Full tracker ───────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${reached ? 'bg-brand-green-100' : 'bg-brand-blue-100'}`}>
            <ClipboardCheck className={`w-5 h-5 ${reached ? 'text-brand-green-600' : 'text-brand-blue-600'}`} />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Lab Hour Log</p>
            <p className="text-xs text-slate-500">Required: {REQUIRED_HOURS} hours for EPA 608 eligibility</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black ${reached ? 'text-brand-green-700' : 'text-slate-900'}`}>
            {totalHours.toFixed(1)}h
          </p>
          <p className="text-xs text-slate-500">of {REQUIRED_HOURS}h</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="px-5 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>{pct}% complete</span>
          {reached
            ? <span className="text-brand-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Requirement met</span>
            : <span>{formatMinutes((REQUIRED_HOURS * 60) - totalMinutes)} remaining</span>}
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${reached ? 'bg-brand-green-500' : 'bg-brand-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Activity list */}
      <div className="divide-y divide-slate-100">
        {displayActivities.map(activity => {
          const logged = activityTotals[activity.id] ?? 0;
          const done = logged >= activity.requiredMinutes;
          const actEntries = entries.filter(e => e.id === activity.id);
          const isExpanded = expanded === activity.id;

          return (
            <div key={activity.id}>
              <button
                onClick={() => setExpanded(isExpanded ? null : activity.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition"
              >
                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${done ? 'bg-brand-green-100' : 'bg-slate-100'}`}>
                  {done
                    ? <CheckCircle className="w-3.5 h-3.5 text-brand-green-600" />
                    : <Clock className="w-3.5 h-3.5 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-24">
                      <div
                        className={`h-1.5 rounded-full ${done ? 'bg-brand-green-500' : 'bg-brand-blue-400'}`}
                        style={{ width: `${Math.min(100, Math.round((logged / activity.requiredMinutes) * 100))}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{formatMinutes(logged)}/{formatMinutes(activity.requiredMinutes)}</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 space-y-3 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs text-slate-600 pt-3">{activity.description}</p>

                  {/* Past entries */}
                  {actEntries.length > 0 && (
                    <div className="space-y-1">
                      {actEntries.map(e => (
                        <div key={e.loggedAt} className="flex items-center justify-between text-xs text-slate-600 bg-white rounded-lg px-3 py-2 border border-slate-100">
                          <span>{e.date} · <strong>{formatMinutes(e.minutesLogged)}</strong> · Supervisor: {e.supervisorInitials}</span>
                          {e.notes && <span className="text-slate-400 ml-2 truncate max-w-32">{e.notes}</span>}
                          <button onClick={() => deleteEntry(e.loggedAt)} className="text-slate-300 hover:text-red-500 transition ml-2 flex-shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Log form inline */}
                  {showForm && expanded === activity.id ? (
                    <div className="space-y-2 bg-white rounded-xl p-3 border border-slate-200">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Date</label>
                          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-blue-400" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Minutes</label>
                          <input type="number" min="1" max="480" placeholder="e.g. 90" value={formMinutes}
                            onChange={e => setFormMinutes(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-blue-400" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Supervisor Initials</label>
                          <input type="text" maxLength={4} placeholder="e.g. MJ" value={formSupervisor}
                            onChange={e => setFormSupervisor(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-blue-400" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 block mb-1">Notes</label>
                          <input type="text" placeholder="Optional" value={formNotes}
                            onChange={e => setFormNotes(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-blue-400" />
                        </div>
                      </div>
                      {formError && <p className="text-xs text-red-600">{formError}</p>}
                      <div className="flex gap-2">
                        <button onClick={submitEntry}
                          className="flex-1 py-2 bg-brand-blue-600 text-white text-sm font-bold rounded-lg hover:bg-brand-blue-700 transition">
                          Save Session
                        </button>
                        <button onClick={() => { setShowForm(false); setFormError(''); }}
                          className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setFormActivity(activity.id); setShowForm(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-brand-blue-300 text-brand-blue-600 text-sm font-semibold rounded-lg hover:bg-brand-blue-50 transition"
                    >
                      <Plus className="w-4 h-4" /> Log Session
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer — export */}
      {entries.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">{entries.length} session{entries.length > 1 ? 's' : ''} logged</p>
          <button
            onClick={() => downloadCSV(entries)}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
