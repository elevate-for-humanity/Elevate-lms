'use client';

import { useState } from 'react';
import { testingAppointmentLabel, TESTING_TIME_ZONE } from '@/lib/testing/booking-calendar';

export type TestingAppointment = {
  id: string;
  startTime: string;
  endTime: string;
  location: string | null;
  spotsRemaining: number;
};

export function testingDateKey(start: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TESTING_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(start));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export default function TestingAppointmentPicker({ slots, quantity, value, onChange, loading }: {
  slots: TestingAppointment[];
  quantity: number;
  value: string;
  onChange: (id: string) => void;
  loading: boolean;
}) {
  const eligible = slots.filter((slot) => slot.spotsRemaining >= quantity);
  const dates = [...new Set(eligible.map((slot) => testingDateKey(slot.startTime)))].sort();
  const months = [...new Set(dates.map((date) => date.slice(0, 7)))];
  const [viewMonth, setViewMonth] = useState('');
  const [chosenDate, setChosenDate] = useState('');
  const selectedSlot = slots.find((slot) => slot.id === value);
  const selectedDate = selectedSlot ? testingDateKey(selectedSlot.startTime) : chosenDate;
  const month = months.includes(viewMonth) ? viewMonth : months[0] || testingDateKey(new Date().toISOString()).slice(0, 7);
  const [year, monthNumber] = month.split('-').map(Number);
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const index = months.indexOf(month);

  return (
    <fieldset className="mt-7 min-w-0">
      <legend className="text-lg font-bold text-slate-800">2. Choose a date and time</legend>
      <p className="mt-2 text-sm text-slate-600">Appointments are shown in Eastern Time. Available dates are highlighted.</p>
      <div className="mt-3 max-w-md rounded-xl border border-slate-300 p-4" aria-busy={loading}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button type="button" aria-label="Previous available month" disabled={index <= 0 || loading} onClick={() => setViewMonth(months[index - 1])} className="min-h-11 rounded-lg px-3 font-bold disabled:opacity-30">←</button>
          <h3 aria-live="polite" className="font-bold">{monthLabel}</h3>
          <button type="button" aria-label="Next available month" disabled={index < 0 || index >= months.length - 1 || loading} onClick={() => setViewMonth(months[index + 1])} className="min-h-11 rounded-lg px-3 font-bold disabled:opacity-30">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-2 text-xs font-bold text-slate-500">{day}</span>)}
          {Array.from({ length: firstWeekday }, (_, i) => <span key={`pad-${i}`} aria-hidden="true" />)}
          {Array.from({ length: dayCount }, (_, i) => {
            const day = i + 1;
            const key = `${month}-${String(day).padStart(2, '0')}`;
            const available = dates.includes(key);
            return <button key={key} type="button" aria-label={`${monthLabel} ${day}${available ? ', available' : ', unavailable'}`} aria-pressed={selectedDate === key} disabled={loading || !available} onClick={() => { setChosenDate(key); onChange(''); }} className={`min-h-11 rounded-lg text-sm font-bold ${selectedDate === key ? 'bg-brand-red-600 text-white' : available ? 'bg-blue-50 text-blue-800 hover:bg-blue-100' : 'text-slate-400'}`}>{day}</button>;
          })}
        </div>
      </div>
      {loading ? <p role="status" className="mt-3 text-sm">Loading available appointments…</p> : !dates.length ? <p role="status" className="mt-3 text-sm font-semibold text-amber-800">No published appointments have space for {quantity === 1 ? 'this exam' : `all ${quantity} test takers`}. Contact the testing center before paying.</p> : null}
      {dates.includes(selectedDate) ? <div className="mt-4">
        <label htmlFor="testing-slot" className="block font-bold text-slate-800">Appointment time</label>
        <select id="testing-slot" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base">
          <option value="">Select an appointment time</option>
          {eligible.filter((slot) => testingDateKey(slot.startTime) === selectedDate).map((slot) => <option key={slot.id} value={slot.id}>{testingAppointmentLabel(slot.startTime)}{slot.location ? ` — ${slot.location}` : ''} ({slot.spotsRemaining} open)</option>)}
        </select>
      </div> : dates.length > 0 ? <p className="mt-3 text-sm text-slate-600">Choose a highlighted date to see appointment times.</p> : null}
    </fieldset>
  );
}
