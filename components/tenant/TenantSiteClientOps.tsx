'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

function sessionKey() {
  if (typeof window === 'undefined') return '';
  const key = 'efh_tenant_session';
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, created);
  return created;
}

export function TenantAnalytics({ pathname }: { pathname: string }) {
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/tenant-sites/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'page_view',
        path: pathname || window.location.pathname,
        referrer: document.referrer,
        sessionKey: sessionKey(),
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [pathname]);
  return null;
}

export function TenantTrackedLink({
  href,
  eventName,
  children,
  className,
  style,
  external = false,
}: {
  href: string;
  eventName: 'cta_click' | 'booking_click' | 'product_click';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  external?: boolean;
}) {
  function track() {
    void fetch('/api/tenant-sites/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        path: window.location.pathname,
        sessionKey: sessionKey(),
        metadata: { href },
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <a
      href={href}
      onClick={track}
      className={className}
      style={style}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

export function TenantLeadForm({ accent }: { accent: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const canSubmit = useMemo(() => Boolean(name.trim() && email.trim() && message.trim()), [name, email, message]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setStatus('idle');
    setError('');
    try {
      const response = await fetch('/api/tenant-sites/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message, path: window.location.pathname }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send your message');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not send your message');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm sm:col-span-2">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">Send a message</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-700">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={160} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-950" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-700">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={240} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-950" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-bold text-slate-700">Phone <span className="font-normal text-slate-400">optional</span></span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={80} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-950" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-bold text-slate-700">How can we help?</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={4000} rows={5} className="w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-950" />
        </label>
      </div>
      {status === 'success' ? <p className="mt-4 text-sm font-bold text-emerald-700">Thank you. Your message was sent.</p> : null}
      {status === 'error' ? <p className="mt-4 text-sm font-bold text-red-700">{error}</p> : null}
      <button type="submit" disabled={!canSubmit || busy} className="mt-5 rounded-full px-7 py-3.5 font-black text-white disabled:opacity-50" style={{ backgroundColor: accent }}>
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
