'use client';
import { useState } from 'react';
import Link from 'next/link';

type Compatibility = { connected: boolean; instance: string; apiVersion: string; checkedAt: string;
  objects: Record<string, { createable: boolean; updateable: boolean; fields: string[] }> };
const errors: Record<string, string> = {
  SALESFORCE_INSTANCE_URL_INVALID: 'Configure your Salesforce My Domain instance URL in secure environment settings.',
  SALESFORCE_CREDENTIALS_REQUIRED: 'Configure a Salesforce access token or a client ID and client secret with the client credentials flow enabled for your integration user.',
  SALESFORCE_AUTH_REJECTED: 'Salesforce rejected the configured credentials. Check the integration user and connected app settings.',
  SALESFORCE_PERMISSION_DENIED: 'The integration user needs Salesforce API access and permissions for the listed objects.',
};
export default function SalesforceClient() {
  const [result, setResult] = useState<Compatibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function check() {
    setLoading(true); setError(null); setResult(null);
    try {
      const response = await fetch('/api/admin/integrations/salesforce', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || data.connected !== true) {
        setError(errors[data.error] || 'Salesforce compatibility could not be verified. Check the integration settings and try again.');
        return;
      }
      setResult(data);
    } catch { setError('Salesforce compatibility could not be verified. Try again.'); }
    finally { setLoading(false); }
  }
  return <main className="min-h-screen bg-white p-4 text-lg leading-relaxed text-slate-900 sm:p-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/integrations" className="text-blue-700 underline">Back to integrations</Link>
      <h1 className="text-3xl font-semibold">Salesforce</h1>
      <p>Check your organization’s authenticated API access, object permissions, and writable fields before connecting a workflow.</p>
      <section className="space-y-4 rounded-2xl border border-slate-200 p-5" aria-label="Salesforce connection">
        <h2 className="text-xl font-semibold">Connection and compatibility</h2>
        <p>This check reads metadata only. It does not transfer learner records.</p>
        <button type="button" disabled={loading} onClick={() => void check()} className="min-h-11 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Checking Salesforce…' : 'Check Salesforce connection'}</button>
        {loading && <p role="status">Authenticating and checking Contact, Account, Opportunity and Lead permissions…</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {result && <div className="space-y-4">
          <p role="status" className="font-semibold text-green-800">Authenticated: {result.instance} · API {result.apiVersion}</p>
          <p>Checked {new Date(result.checkedAt).toLocaleString()}. Record delivery remains unverified until a specific workflow completes and its Salesforce records are read back.</p>
          <div className="overflow-x-auto"><table className="w-full text-left"><caption className="sr-only">Salesforce object access</caption><thead><tr><th className="p-2">Object</th><th className="p-2">Create</th><th className="p-2">Update</th></tr></thead><tbody>{Object.entries(result.objects).map(([name, object]) => <tr key={name} className="border-t"><th className="p-2">{name}</th><td className="p-2">{object.createable ? 'Allowed' : 'Unavailable'}</td><td className="p-2">{object.updateable ? 'Allowed' : 'Unavailable'}</td></tr>)}</tbody></table></div>
        </div>}
      </section>
      <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-semibold">Secure configuration</h2>
        <p>Set SALESFORCE_INSTANCE_URL to your My Domain URL. Configure SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET for a server integration user, or SALESFORCE_API_KEY for an existing access token.</p>
        <Link href="/integrations/env-manager" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 font-semibold text-blue-800">Open secure environment settings</Link>
        <p>Production services must receive these values through their configured secret authority before the connection check can pass.</p>
      </section>
      <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-semibold">Workflow field mapping</h2>
        <p>Contact names use FirstName and LastName. Email and phone use Contact.Email and Contact.Phone. Opportunities use StageName, with a stage from your organization’s allowed values and a CloseDate.</p>
        <p>Enrollment, program and course mappings require your organization’s chosen Salesforce objects and fields. They are not automatically synchronized by this connection check.</p>
      </section>
    </div>
  </main>;
}
