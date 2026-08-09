'use client';

import { useCallback, useEffect, useState } from 'react';

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  purpose: string;
}

interface WebsiteDomain {
  id: string;
  hostname: string;
  status: string;
  mode: string;
  dns_records?: DnsRecord[];
  dnsRecords?: DnsRecord[];
  monitor_status?: string;
  monitorStatus?: string;
  points_to_edge?: boolean;
  pointsToEdge?: boolean;
  domainee_domain_id?: string;
}

interface Props {
  websiteId: string;
  isPublished: boolean;
}

function normalizeDomain(d: WebsiteDomain): WebsiteDomain {
  return {
    ...d,
    dns_records: d.dns_records ?? d.dnsRecords,
    monitor_status: d.monitor_status ?? d.monitorStatus,
    points_to_edge: d.points_to_edge ?? d.pointsToEdge,
  };
}

/**
 * Connect-a-domain panel for the Website Builder.
 * Supports: Connect existing domain (BYO) + Buy a new domain.
 * Polls status while a domain is pending DNS verification.
 */
export function DomainPanel({ websiteId, isPublished }: Props) {
  const [domains, setDomains] = useState<WebsiteDomain[]>([]);
  const [configured, setConfigured] = useState(true);
  const [tab, setTab] = useState<'connect' | 'buy'>('connect');
  const [hostname, setHostname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [polling, setPolling] = useState<string | null>(null);

  const [years, setYears] = useState(1);
  const [regFirst, setRegFirst] = useState('');
  const [regLast, setRegLast] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/website-builder/sites/${websiteId}/domains`);
      const data = await res.json();
      if (res.ok) {
        const list: WebsiteDomain[] = (data.domains ?? []).map(normalizeDomain);
        setDomains(list);
        setConfigured(data.configured ?? true);
        const pending = list.find(
          (d) => d.status === 'pending' || d.status === 'active',
        );
        setPolling(pending?.id ?? null);
      }
    } catch {
      /* ignore load errors */
    }
  }, [websiteId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!polling) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/apps/website-builder/sites/${websiteId}/domains/${polling}`,
        );
        if (res.ok) {
          const data = await res.json();
          const d = normalizeDomain(data.domain as WebsiteDomain);
          setDomains((prev) => prev.map((x) => (x.id === polling ? { ...x, ...d } : x)));
          if (d.status === 'active' || d.status === 'failed' || d.status === 'deleted') {
            setPolling(null);
            if (d.status === 'active') {
              setInfo('Your domain is verified and SSL is active.');
              setError(null);
            }
          }
        }
      } catch {
        /* ignore poll errors */
      }
    }, 8000);
    return () => clearInterval(t);
  }, [polling, websiteId]);

  const handleConnect = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(
        `/api/apps/website-builder/sites/${websiteId}/domains/connect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hostname }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not connect domain');
      setDomains((prev) => [...prev, normalizeDomain(data.domain)]);
      setPolling(data.domain.id);
      setInfo(data.nextStep || 'Add the CNAME record at your DNS provider.');
      setHostname('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect domain');
    } finally {
      setBusy(false);
    }
  };

  const handleBuy = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(
        `/api/apps/website-builder/sites/${websiteId}/domains/buy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostname,
            years,
            registrant: { firstName: regFirst, lastName: regLast, email: regEmail },
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not register domain');
      setDomains((prev) => [...prev, normalizeDomain(data.domain)]);
      setInfo(data.message || 'Domain registered and connected.');
      setHostname('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register domain');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (domainId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/apps/website-builder/sites/${websiteId}/domains/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domainId }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification check failed');
      setDomains((prev) =>
        prev.map((x) => (x.id === domainId ? { ...x, ...normalizeDomain(data.domain) } : x)),
      );
      setInfo(data.message || 'Status refreshed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (domainId: string) => {
    if (!confirm('Disconnect this domain from your site?')) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/apps/website-builder/sites/${websiteId}/domains/${domainId}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Could not remove domain');
      }
      setDomains((prev) => prev.filter((x) => x.id !== domainId));
      setInfo('Domain disconnected.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain');
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-black text-amber-900">Custom domain</h2>
        <p className="mt-2 text-sm text-amber-800">
          Domain service is not yet configured. An admin must set the DOMAINEE_API_KEY secret.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900">Custom domain</h2>
      <p className="mt-1 text-sm text-slate-500">
        {isPublished
          ? 'Connect a domain you own, or register a new one. SSL is automatic.'
          : 'Publish your site first, then connect a custom domain.'}
      </p>

      {(error || info) && (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm font-semibold ${
            error
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {error || info}
        </div>
      )}

      {domains.length > 0 && (
        <div className="mt-5 space-y-3">
          {domains.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{d.hostname}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {d.mode === 'buy' ? 'Registered' : 'Connected'} · {d.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {d.status === 'pending' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleVerify(d.id)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      Check connection
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(d.id)}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
              {d.status === 'active' && (
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  ✓ Verified · SSL active
                </p>
              )}
              {Array.isArray(d.dns_records) && d.dns_records.length > 0 && d.status !== 'active' && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-bold uppercase text-slate-500">
                    DNS record to add at your registrar:
                  </p>
                  {d.dns_records.map((r, i) => (
                    <div key={i} className="font-mono text-xs text-slate-800">
                      <span className="font-bold">{r.type}</span> {r.name} → {r.value}
                      <span className="ml-2 text-slate-400">({r.purpose})</span>
                    </div>
                  ))}
                  <p className="mt-2 text-xs text-amber-700">
                    On Cloudflare? Set this CNAME to DNS-only (grey cloud) until verified.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isPublished && (
        <div className="mt-5">
          <div className="flex gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setTab('connect')}
              className={`px-3 py-2 text-sm font-bold ${
                tab === 'connect'
                  ? 'border-b-2 border-brand-red-600 text-brand-red-600'
                  : 'text-slate-500'
              }`}
            >
              Use a domain I own
            </button>
            <button
              type="button"
              onClick={() => setTab('buy')}
              className={`px-3 py-2 text-sm font-bold ${
                tab === 'buy'
                  ? 'border-b-2 border-brand-red-600 text-brand-red-600'
                  : 'text-slate-500'
              }`}
            >
              Register a new domain
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">Domain</span>
              <input
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="shop.example.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-brand-red-500"
              />
            </label>

            {tab === 'buy' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={regFirst}
                    onChange={(e) => setRegFirst(e.target.value)}
                    placeholder="First name"
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
                  />
                  <input
                    value={regLast}
                    onChange={(e) => setRegLast(e.target.value)}
                    placeholder="Last name"
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
                  />
                </div>
                <input
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Registrant email"
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
                />
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-slate-700">Years</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value) || 1)}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900"
                  />
                </label>
                <p className="text-xs text-slate-500">
                  The customer is the legal registrant. Wholesale + $1 charged to the workspace card.
                </p>
              </>
            )}

            <button
              type="button"
              disabled={busy || !hostname}
              onClick={tab === 'connect' ? handleConnect : handleBuy}
              className="w-full rounded-lg bg-brand-red-600 px-4 py-3 font-bold text-white disabled:opacity-60"
            >
              {busy
                ? 'Working…'
                : tab === 'connect'
                  ? 'Connect my domain'
                  : 'Register & connect'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DomainPanel;
