'use client';

import { useMemo, useState } from 'react';

export default function WageReimbursementEstimator() {
  const [apprentices, setApprentices] = useState(1);
  const [hourlyWage, setHourlyWage] = useState(15);
  const [weeklyHours, setWeeklyHours] = useState(30);
  const [weeks, setWeeks] = useState(12);

  const wages = useMemo(
    () => apprentices * hourlyWage * weeklyHours * weeks,
    [apprentices, hourlyWage, weeklyHours, weeks],
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="wage-estimator-title">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Planning tool</p>
      <h2 id="wage-estimator-title" className="mt-2 text-3xl font-black">Estimate wages that may be eligible for reimbursement</h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-700">This estimates gross training wages and a 50% planning scenario. It is not an award or eligibility decision. WorkOne must approve the employer, participant, training plan, rate, hours, and start date in writing before covered training begins.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Apprentices" value={apprentices} min={1} max={10} onChange={setApprentices} />
        <NumberField label="Hourly wage" value={hourlyWage} min={7.25} max={75} step={0.25} onChange={setHourlyWage} />
        <NumberField label="Hours per week" value={weeklyHours} min={1} max={40} onChange={setWeeklyHours} />
        <NumberField label="Training weeks" value={weeks} min={1} max={52} onChange={setWeeks} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Result label="Estimated gross training wages" value={wages} />
        <Result label="50% planning scenario" value={wages * 0.5} emphasized />
      </div>
    </section>
  );
}

function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label className="text-sm font-bold text-slate-900">{label}<input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base" /></label>;
}

function Result({ label, value, emphasized = false }: { label: string; value: number; emphasized?: boolean }) {
  return <div className={`rounded-2xl border p-5 ${emphasized ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}><p className="text-sm font-bold text-slate-700">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p></div>;
}
