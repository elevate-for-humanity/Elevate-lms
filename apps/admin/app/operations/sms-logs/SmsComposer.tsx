'use client';

import { useActionState } from 'react';
import { sendAdminSms, type SendSmsState } from './actions';

const initialState: SendSmsState = { ok: false, message: '' };

export function SmsComposer({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(sendAdminSms, initialState);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="sms-compose-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="sms-compose-title" className="text-lg font-semibold text-gray-950">Send a text message</h2>
          <p className="mt-1 text-sm text-gray-600">Send an operational message through the configured Twilio number.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {enabled ? 'Twilio connected' : 'Twilio not configured'}
        </span>
      </div>

      <form action={action} className="mt-5 grid gap-4 lg:grid-cols-[18rem_1fr_auto] lg:items-end">
        <label className="block text-sm font-medium text-gray-800">
          Phone number
          <input name="to" type="tel" inputMode="tel" autoComplete="tel" required disabled={!enabled || pending}
            placeholder="(317) 555-0123" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 disabled:bg-gray-100" />
        </label>
        <label className="block text-sm font-medium text-gray-800">
          Message
          <textarea name="message" required maxLength={1600} rows={3} disabled={!enabled || pending}
            placeholder="Type the message to send…" className="mt-1 block w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-950 disabled:bg-gray-100" />
        </label>
        <button type="submit" disabled={!enabled || pending}
          className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400">
          {pending ? 'Sending…' : 'Send SMS'}
        </button>
      </form>
      {state.message && <p role="status" className={`mt-3 text-sm font-medium ${state.ok ? 'text-green-700' : 'text-red-700'}`}>{state.message}</p>}
      {!enabled && <p className="mt-3 text-sm text-red-700">Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable sending.</p>}
    </section>
  );
}
