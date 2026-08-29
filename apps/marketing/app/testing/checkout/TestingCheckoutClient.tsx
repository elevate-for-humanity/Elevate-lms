'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, CreditCard, Loader2, Sparkles, Tag } from 'lucide-react';

type Provider = {
  key: string;
  name: string;
  exams: Array<{
    name: string;
    description: string;
    durationMinutes: number | null;
    amountCents: number | null;
  }>;
  addOn: null | {
    label: string;
    description: string;
    amountCents: number;
    includes: string[];
  };
};

type TestingSlot = {
  id: string;
  startTime: string;
  endTime: string;
  location: string | null;
  spotsRemaining: number;
};

function money(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export default function TestingCheckoutClient({
  providers,
  initialProvider,
  initialExam,
}: {
  providers: Provider[];
  initialProvider: string;
  initialExam: string;
}) {
  const defaultProvider = providers.find((p) => p.key === initialProvider) ?? providers[0] ?? null;
  const [providerKey, setProviderKey] = useState(defaultProvider?.key ?? '');
  const [examName, setExamName] = useState(() => {
    const match = defaultProvider?.exams.find((exam) => exam.name.toLowerCase() === initialExam.toLowerCase());
    return match?.name ?? defaultProvider?.exams[0]?.name ?? '';
  });
  const [addOn, setAddOn] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState<TestingSlot[]>([]);
  const [slotId, setSlotId] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  const provider = useMemo(() => providers.find((p) => p.key === providerKey) ?? null, [providers, providerKey]);
  const exam = useMemo(
    () => provider?.exams.find((entry) => entry.name === examName) ?? null,
    [provider, examName],
  );

  function changeProvider(key: string) {
    const next = providers.find((p) => p.key === key) ?? null;
    setProviderKey(key);
    setExamName(next?.exams[0]?.name ?? '');
    setAddOn(false);
    setSlotId('');
  }

  useEffect(() => {
    if (!providerKey) return;
    const controller = new AbortController();
    setSlotsLoading(true);
    setSlots([]);
    setSlotId('');
    fetch(`/api/testing/slots/public?examType=${encodeURIComponent(providerKey)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Appointments are unavailable.');
        const available = Array.isArray(data.slots) ? data.slots : [];
        setSlots(available);
        if (available.length === 1) setSlotId(available[0].id);
      })
      .catch((fetchError) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') return;
        setError(fetchError instanceof Error ? fetchError.message : 'Appointments are unavailable.');
      })
      .finally(() => setSlotsLoading(false));
    return () => controller.abort();
  }, [providerKey]);

  const examSubtotal = (exam?.amountCents ?? 0) * quantity;
  const addOnAmount = addOn && provider?.addOn ? provider.addOn.amountCents : 0;
  const total = examSubtotal + addOnAmount;
  const checkoutReady = Boolean(provider && exam && exam.amountCents && exam.amountCents > 0 && slotId);

  async function checkout() {
    if (!provider || !exam || !checkoutReady || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/testing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType: provider.key,
          examName: exam.name,
          bookingType: quantity > 1 ? 'organization' : 'individual',
          participantCount: quantity,
          addOn,
          slotId,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Unable to start checkout.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout.');
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-2xl font-black text-slate-950">1. Select provider and exam</h2>

        <label className="mt-5 block text-base font-bold text-slate-800">Testing provider</label>
        <select
          value={providerKey}
          onChange={(event) => changeProvider(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base"
        >
          {providers.map((entry) => <option key={entry.key} value={entry.key}>{entry.name}</option>)}
        </select>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {provider?.exams.map((entry) => {
            const selected = entry.name === examName;
            return (
              <button
                type="button"
                key={entry.name}
                onClick={() => { setExamName(entry.name); setAddOn(false); }}
                className={`rounded-xl border-2 p-4 text-left transition ${selected ? 'border-brand-red-600 bg-brand-red-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-extrabold leading-snug text-slate-950">{entry.name}</span>
                  <span className="shrink-0 font-black text-brand-red-700">
                    {entry.amountCents ? money(entry.amountCents) : 'Quote'}
                  </span>
                </div>
                {entry.description ? <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{entry.description}</p> : null}
                {entry.durationMinutes ? <p className="mt-2 text-sm font-semibold text-slate-500">Approx. {entry.durationMinutes} minutes</p> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-7">
          <label className="block text-base font-bold text-slate-800">Number of test takers</label>
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(100, Number(event.target.value) || 1)))}
            className="mt-2 w-32 rounded-xl border border-slate-300 px-4 py-3 text-base"
          />
          <p className="mt-2 text-sm text-slate-500">For employer or cohort groups, checkout multiplies the exact exam fee by the participant count.</p>
        </div>

        <div className="mt-7">
          <label htmlFor="testing-slot" className="flex items-center gap-2 text-base font-bold text-slate-800">
            <CalendarDays className="h-5 w-5" /> Appointment
          </label>
          <select
            id="testing-slot"
            value={slotId}
            onChange={(event) => setSlotId(event.target.value)}
            disabled={slotsLoading || slots.length === 0}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base disabled:bg-slate-100"
          >
            <option value="">{slotsLoading ? 'Loading appointments…' : slots.length ? 'Select an appointment' : 'No appointments currently available'}</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {new Date(slot.startTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                {slot.location ? ` — ${slot.location}` : ''} ({slot.spotsRemaining} open)
              </option>
            ))}
          </select>
          {!slotsLoading && !slots.length ? <p className="mt-2 text-sm font-semibold text-amber-700">No eligible appointment is published for this provider. Contact the testing center before paying.</p> : null}
        </div>

        {provider?.addOn ? (
          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-amber-700" />
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-950">Optional: {provider.addOn.label}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{provider.addOn.description}</p>
                  </div>
                  <span className="font-black text-slate-950">+{money(provider.addOn.amountCents)}</span>
                </div>
                {provider.addOn.includes.length ? (
                  <ul className="mt-3 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                    {provider.addOn.includes.map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{item}</li>)}
                  </ul>
                ) : null}
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 font-bold text-slate-900">
                  <input type="checkbox" checked={addOn} onChange={(event) => setAddOn(event.target.checked)} className="h-5 w-5" /> Add this to my checkout
                </label>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-xl font-black text-slate-950">Order summary</h2>
        <div className="mt-5 space-y-3 text-base">
          <div className="flex justify-between gap-3"><span className="text-slate-600">Exam</span><span className="text-right font-bold text-slate-950">{exam?.name || 'Select exam'}</span></div>
          {exam?.amountCents ? <div className="flex justify-between gap-3"><span className="text-slate-600">{quantity} × {money(exam.amountCents)}</span><span className="font-bold">{money(examSubtotal)}</span></div> : null}
          {addOn && provider?.addOn ? <div className="flex justify-between gap-3"><span className="text-slate-600">{provider.addOn.label}</span><span className="font-bold">{money(addOnAmount)}</span></div> : null}
        </div>
        <div className="my-5 border-t border-slate-200" />
        <div className="flex items-end justify-between gap-3"><span className="text-lg font-bold text-slate-800">Total</span><span className="text-3xl font-black text-slate-950">{checkoutReady ? money(total) : '—'}</span></div>

        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-2"><Tag className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" /><p className="text-sm leading-relaxed text-blue-900"><strong>Promotion code:</strong> enter any active Elevate code in the Stripe Checkout coupon box.</p></div>
        </div>

        <button
          type="button"
          onClick={checkout}
          disabled={!checkoutReady || loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-4 text-lg font-extrabold text-white hover:bg-brand-red-700 disabled:bg-slate-400"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
          {loading ? 'Opening Checkout…' : 'Continue to Secure Checkout'}
        </button>
        {!checkoutReady ? <p className="mt-3 text-sm text-amber-700">Select a priced exam and an available appointment before checkout.</p> : null}
        {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <p className="mt-4 text-sm leading-relaxed text-slate-500">Eligible installment options are displayed by Stripe at checkout when available for the purchase amount and customer. Approval and terms are determined by the payment provider.</p>
      </aside>
    </div>
  );
}
