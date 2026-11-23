'use client';
import { useId } from 'react';
import { cleaningQuote, money, parseHourlyRate } from '@/lib/cleaning/pricing';

/** Compares prices, never invents bookings, demand, rankings or earnings. */
export function TenantProviderRate({ value, onChange, required = false }: {
  value: string; onChange: (value: string) => void; required?: boolean;
}) {
  const id = useId();
  const cents = parseHourlyRate(value);
  const quote = cents === null ? null : cleaningQuote({ providerHourlyCents: cents, cleanerHours: 3, member: false });
  return <fieldset className="rounded-2xl border border-slate-300 bg-slate-50 p-5 sm:col-span-2">
    <legend className="px-2 text-lg font-bold">Choose your hourly pay</legend>
    <label htmlFor={id} className="block font-bold">Your requested rate per cleaner-hour{required ? ' *' : ''}</label>
    <input id={id} type="number" inputMode="decimal" min="15" max="200" step="0.01" required={required}
      value={value} onChange={e => onChange(e.target.value)} aria-describedby={`${id}-help ${id}-estimate`}
      className="mt-2 w-full rounded-xl border border-slate-400 bg-white p-3 text-slate-950" />
    <p id={`${id}-help`} className="mt-3 leading-7 text-slate-700">Enter what your business wants to receive for one cleaner working one hour. Two cleaners working three hours is six cleaner-hours. These are business payments before your own expenses and taxes.</p>
    <div id={`${id}-estimate`} aria-live="polite" className="mt-4 space-y-2 leading-7">
      {quote ? <><p>For three cleaner-hours, your business receives <strong>{money(quote.providerPayCents)}</strong>.</p>
        <p>Customer cleaning price: <strong>{money(quote.basePriceCents)}</strong>. 2Exclusive’s share: {money(quote.platformGrossCents)} before expenses. Applicable tax and separately agreed extras are excluded.</p>
        <p>Membership savings come from 2Exclusive’s share; your agreed payment stays the same.</p></> : value ? <p>Enter a rate from $15 to $200, with up to two decimal places.</p> : <p>Enter your rate to see the customer price and your payment.</p>}
    </div>
    <p className="mt-4 leading-7 text-slate-700">A lower rate reduces the customer price. Booking also depends on location, availability, service fit and reviews. We do not yet have enough verified bookings to show how often providers at each rate get booked.</p>
  </fieldset>;
}
