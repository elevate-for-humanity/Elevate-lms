'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface DnsRecord { type: string; name: string; value: string; purpose: string }
interface WebsiteDomain {
  id: string;
  hostname: string;
  status: string;
  mode: string;
  dns_records?: DnsRecord[];
  dnsRecords?: DnsRecord[];
}
interface Props { websiteId: string; isPublished: boolean }

function normalizeDomain(domain: WebsiteDomain): WebsiteDomain {
  return { ...domain, dns_records: domain.dns_records ?? domain.dnsRecords };
}

export function DomainPanel({ websiteId, isPublished }: Props) {
  const [domains, setDomains] = useState<WebsiteDomain[]>([]);
  const [configured, setConfigured] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [tab, setTab] = useState<'connect' | 'buy'>('connect');
  const [hostname, setHostname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [polling, setPolling] = useState<string | null>(null);
  const [registrant, setRegistrant] = useState({
    firstName: '', lastName: '', email: '', phone: '', address1: '', city: '', state: '', postalCode: '', country: 'US',
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/website-builder/sites/${websiteId}/domains`);
      const data = await res.json();
      if (!res.ok) return;
      const list: WebsiteDomain[] = (data.domains ?? []).map(normalizeDomain);
      setDomains(list);
      setConfigured(data.configured ?? true);
      setAllowed(data.customDomainAllowed ?? false);
      setPlan(data.plan ?? null);
      const pending = list.find((domain) => domain.status === 'pending' || domain.status === 'processing');
      setPolling(pending?.id ?? null);
    } catch {
      // Keep the editor usable when domain status is temporarily unavailable.
    }
  }, [websiteId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/apps/website-builder/sites/${websiteId}/domains/${polling}`);
        if (!res.ok) return;
        const data = await res.json();
        const domain = normalizeDomain(data.domain as WebsiteDomain);
        setDomains((current) => current.map((item) => item.id === polling ? { ...item, ...domain } : item));
        if (['active', 'failed', 'deleted'].includes(domain.status)) {
          setPolling(null);
          if (domain.status === 'active') setInfo('Your domain is live and SSL is active.');
        }
      } catch {
        // Poll again on the next interval.
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [polling, websiteId]);

  async function connectOwnedDomain() {
    setBusy(true); setError(null); setInfo(null);
    try {
      const res = await fetch(`/api/apps/website-builder/sites/${websiteId}/domains/connect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hostname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not connect domain');
      setDomains((current) => [normalizeDomain(data.domain), ...current]);
      setPolling(data.domain.id);
      setInfo(data.nextStep || 'Add the CNAME at your DNS provider.');
      setHostname('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not connect domain'); }
    finally { setBusy(false); }
  }

  async function getQuote() {
    if (!hostname) return;
    setBusy(true); setError(null); setQuote(null);
    try {
      const res = await fetch(`/api/apps/website-builder/sites/${websiteId}/domains/quote?hostname=${encodeURIComponent(hostname)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not price domain');
      if (!data.available) throw new Error('That domain is not available.');
      setQuote(data.retailFormatted);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not price domain'); }
    finally { setBusy(false); }
  }

  async function startDomainCheckout() {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/apps/website-builder/sites/${websiteId}/domains/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname, years: 1, registrant }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start domain checkout');
      if (!data.checkoutUrl) throw new Error('Checkout URL was not returned.');
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start domain checkout');
      setBusy(false);
    }
  }

  async function verify(domainId: string) {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/apps/website-builder/sites/${websiteId}/domains/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domainId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      await load();
      setInfo(data.message || 'Connection status refreshed.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Verification failed'); }
    finally { setBusy(false); }
  }

  async function disconnect(domainId: string) {
    if (!confirm('Disconnect this domain from your website?')) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/apps/website-builder/sites/${websiteId}/domains/${domainId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not disconnect domain');
      setDomains((current) => current.filter((domain) => domain.id !== domainId));
      setInfo('Domain disconnected.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not disconnect domain'); }
    finally { setBusy(false); }
  }

  if (!configured) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="text-lg font-black text-amber-950">Custom domain</h2><p className="mt-2 text-sm text-amber-800">Domain services are temporarily unavailable.</p></div>;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">Custom domain</h2>
          <p className="mt-1 text-sm text-slate-600">Use a domain you already own or buy one without leaving Elevate. SSL setup is automatic.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600">{plan || 'Starter'}</span>
      </div>

      {(error || info) && <div className={`mt-4 rounded-xl border p-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || info}</div>}

      {domains.length > 0 && <div className="mt-5 space-y-3">{domains.map((domain) => (
        <div key={domain.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-black text-slate-950">{domain.hostname}</p><p className="text-xs font-bold uppercase text-slate-500">{domain.mode === 'buy' ? 'Purchased through Elevate' : 'Customer-owned'} · {domain.status.replaceAll('_', ' ')}</p></div>
            <div className="flex gap-2">
              {domain.status === 'pending' && <button type="button" disabled={busy} onClick={() => void verify(domain.id)} className="rounded-lg border px-3 py-2 text-xs font-bold">Check connection</button>}
              {!['awaiting_payment', 'processing'].includes(domain.status) && <button type="button" disabled={busy} onClick={() => void disconnect(domain.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Disconnect</button>}
            </div>
          </div>
          {domain.status === 'active' && <p className="mt-2 text-sm font-bold text-emerald-700">✓ Live · SSL active</p>}
          {domain.dns_records?.length ? <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs"><p className="font-bold text-slate-600">Add this DNS record:</p>{domain.dns_records.map((record, index) => <p key={`${record.name}-${index}`} className="mt-1 font-mono">{record.type} {record.name} → {record.value}</p>)}<p className="mt-2 text-amber-700">Cloudflare: keep the CNAME DNS-only (grey cloud) until verification completes.</p></div> : null}
        </div>
      ))}</div>}

      {!allowed ? (
        <div className="mt-5 rounded-2xl border border-brand-red-200 bg-brand-red-50 p-5">
          <p className="font-black text-slate-950">Unlock your own domain</p>
          <p className="mt-2 text-sm text-slate-700">Custom domains are included with Website Builder Professional and Enterprise. Your Elevate subdomain remains available on Starter.</p>
          <Link href="/store/apps/website-builder" className="mt-4 inline-flex rounded-xl bg-brand-red-600 px-4 py-3 text-sm font-black text-white">Upgrade Website Builder</Link>
        </div>
      ) : !isPublished ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">Publish your website first. Domain controls will unlock immediately afterward.</div>
      ) : (
        <div className="mt-5">
          <div className="flex gap-2 border-b">
            <button type="button" onClick={() => { setTab('connect'); setQuote(null); }} className={`px-3 py-2 text-sm font-black ${tab === 'connect' ? 'border-b-2 border-brand-red-600 text-brand-red-600' : 'text-slate-500'}`}>I own a domain</button>
            <button type="button" onClick={() => { setTab('buy'); setQuote(null); }} className={`px-3 py-2 text-sm font-black ${tab === 'buy' ? 'border-b-2 border-brand-red-600 text-brand-red-600' : 'text-slate-500'}`}>Buy a domain</button>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block"><span className="mb-1 block text-sm font-bold">Domain</span><input value={hostname} onChange={(e) => { setHostname(e.target.value); setQuote(null); }} placeholder="yourbusiness.com" className="w-full rounded-xl border px-3 py-3" /></label>
            {tab === 'connect' ? (
              <button type="button" disabled={busy || !hostname} onClick={() => void connectOwnedDomain()} className="w-full rounded-xl bg-brand-red-600 px-4 py-3 font-black text-white disabled:opacity-50">{busy ? 'Connecting…' : 'Connect my domain'}</button>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={registrant.firstName} onChange={(e) => setRegistrant({ ...registrant, firstName: e.target.value })} placeholder="First name" className="rounded-xl border px-3 py-3" />
                  <input value={registrant.lastName} onChange={(e) => setRegistrant({ ...registrant, lastName: e.target.value })} placeholder="Last name" className="rounded-xl border px-3 py-3" />
                  <input type="email" value={registrant.email} onChange={(e) => setRegistrant({ ...registrant, email: e.target.value })} placeholder="Email" className="rounded-xl border px-3 py-3" />
                  <input value={registrant.phone} onChange={(e) => setRegistrant({ ...registrant, phone: e.target.value })} placeholder="Phone" className="rounded-xl border px-3 py-3" />
                  <input value={registrant.address1} onChange={(e) => setRegistrant({ ...registrant, address1: e.target.value })} placeholder="Street address" className="rounded-xl border px-3 py-3 sm:col-span-2" />
                  <input value={registrant.city} onChange={(e) => setRegistrant({ ...registrant, city: e.target.value })} placeholder="City" className="rounded-xl border px-3 py-3" />
                  <input value={registrant.state} onChange={(e) => setRegistrant({ ...registrant, state: e.target.value })} placeholder="State" className="rounded-xl border px-3 py-3" />
                  <input value={registrant.postalCode} onChange={(e) => setRegistrant({ ...registrant, postalCode: e.target.value })} placeholder="ZIP / postal code" className="rounded-xl border px-3 py-3" />
                  <input value={registrant.country} onChange={(e) => setRegistrant({ ...registrant, country: e.target.value.toUpperCase() })} placeholder="Country code" maxLength={2} className="rounded-xl border px-3 py-3" />
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-800">You remain the legal owner of the domain. Elevate handles registration, connection, and SSL for you.</p>
                  {quote ? <p className="mt-2 text-2xl font-black text-slate-950">{quote} <span className="text-sm font-semibold text-slate-500">for 1 year</span></p> : null}
                </div>
                {!quote ? <button type="button" disabled={busy || !hostname} onClick={() => void getQuote()} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-black">{busy ? 'Checking…' : 'Check availability & price'}</button> : <button type="button" disabled={busy} onClick={() => void startDomainCheckout()} className="w-full rounded-xl bg-brand-red-600 px-4 py-3 font-black text-white">{busy ? 'Opening secure checkout…' : `Buy ${hostname} for ${quote}`}</button>}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default DomainPanel;
