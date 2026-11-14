'use client';
import { useCallback, useEffect, useState } from 'react';

export function GoogleCalendarConnection({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [connection, setConnection] = useState<{ configured: boolean; connected: boolean } | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [returnTo, setReturnTo] = useState('/');
  const load = useCallback(async () => {
    const response = await fetch('/api/calendar/google', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Calendar connection could not be loaded.');
    setConnection(body);
  }, []);
  useEffect(() => {
    setReturnTo(window.location.pathname);
    if (new URLSearchParams(window.location.search).get('calendarConnection') === 'failed') setError('Google Calendar was not connected. Try again and approve calendar access in Google.');
    void load().catch(cause => setError(cause.message));
  }, [load]);
  async function refresh() { setPending(true); setError(''); try { await load(); await onRefresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Calendar could not be refreshed.'); } finally { setPending(false); } }
  return <section aria-label="Google Calendar connection" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-slate-950">Google Calendar</h3><p className="mt-1 text-sm text-slate-700">{connection?.connected ? 'Connected. Busy times from your primary and selected Google calendars appear here. Availability is checked again when scheduling a meeting.' : 'Connect your Google account to show busy times here and check availability before scheduling.'}</p></div>
    <div className="flex flex-wrap gap-2">{connection?.configured ? <a href={`/api/calendar/google/connect?returnTo=${encodeURIComponent(returnTo)}`} className="inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white">{connection.connected ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}</a> : connection ? <div><button type="button" disabled className="min-h-11 rounded-lg bg-slate-200 px-4 text-sm font-bold text-slate-600">Connect Google Calendar</button><p className="mt-1 text-sm font-bold text-amber-900">Google connection needs administrator setup.</p></div> : <p className="text-sm">Checking connection…</p>}
    <button type="button" disabled={pending} onClick={() => void refresh()} className="min-h-11 rounded-lg border border-slate-400 bg-white px-4 text-sm font-bold disabled:opacity-50">{pending ? 'Refreshing…' : 'Refresh calendar'}</button>
    {connection?.connected ? <button type="button" disabled={pending} onClick={async () => { setPending(true); setError(''); try { const response = await fetch('/api/calendar/google', { method: 'POST' }); if (!response.ok) throw new Error('Calendar could not be disconnected.'); await load(); await onRefresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Calendar could not be disconnected.'); } finally { setPending(false); } }} className="min-h-11 rounded-lg border px-4 text-sm font-bold">Disconnect</button> : null}</div></div>
    <p className="mt-3 text-xs leading-5 text-slate-600">Google events are shown as Busy to keep event details private. This connection reads availability; it does not edit your Google events. Updates appear when you open or refresh this calendar.</p>
    <details className="mt-3 text-sm"><summary className="cursor-pointer font-bold">How to connect Google Calendar</summary><ol className="mt-2 list-decimal space-y-2 pl-5"><li>Select Connect Google Calendar.</li><li>Sign in to the Google account whose calendar you use for appointments.</li><li>Review and approve read-only calendar access in Google.</li><li>Return here and check that the connection says Connected. Busy blocks appear on their dates.</li><li>Select Refresh calendar after changes. Scheduling checks busy times again before saving.</li></ol></details>
    {error ? <p role="alert" className="mt-3 text-sm font-bold text-red-800">{error}</p> : null}
  </section>;
}
