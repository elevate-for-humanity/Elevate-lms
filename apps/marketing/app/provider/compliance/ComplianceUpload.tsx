'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ARTIFACT_TYPES = [
  ['mou', 'Memorandum of Understanding'],
  ['insurance', 'Certificate of Insurance'],
  ['w9', 'W-9'],
  ['state_license', 'State License'],
  ['etpl_approval', 'ETPL Approval'],
  ['accreditation', 'Accreditation Certificate'],
  ['other', 'Other Document'],
] as const;

type Props = {
  tenantId: string;
};

export default function ComplianceUpload({ tenantId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const artifactType = String(form.get('artifactType') || '');
    const label = String(form.get('label') || '').trim();
    const externalUrl = String(form.get('externalUrl') || '').trim();
    const issuer = String(form.get('issuer') || '').trim();
    const issuedAt = String(form.get('issuedAt') || '') || null;
    const expiresAt = String(form.get('expiresAt') || '') || null;

    if (!label || !externalUrl) {
      setError('Document name and secure document URL are required.');
      setSaving(false);
      return;
    }

    let url: URL;
    try {
      url = new URL(externalUrl);
      if (url.protocol !== 'https:') throw new Error('HTTPS required');
    } catch {
      setError('Enter a valid HTTPS document URL.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required.');

      const { error: insertError } = await supabase.from('provider_compliance_artifacts').insert({
        tenant_id: tenantId,
        artifact_type: artifactType,
        label,
        external_url: url.toString(),
        issuer: issuer || null,
        issued_at: issuedAt,
        expires_at: expiresAt,
        uploaded_by: user.id,
        verified: false,
      });
      if (insertError) throw insertError;

      event.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save compliance document.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-800">
          Document type
          <select name="artifactType" required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            {ARTIFACT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-800">
          Document name
          <input name="label" required maxLength={200} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-800">
        Secure document URL
        <input name="externalUrl" type="url" required placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
        <span className="mt-1 block text-xs text-slate-500">Use an HTTPS link to the current document. Uploaded evidence remains unverified until staff review.</span>
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-800">Issuer<input name="issuer" maxLength={200} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
        <label className="text-sm font-medium text-slate-800">Issued date<input name="issuedAt" type="date" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
        <label className="text-sm font-medium text-slate-800">Expiration date<input name="expiresAt" type="date" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" /></label>
      </div>

      {error ? <p role="alert" className="text-sm font-medium text-red-700">{error}</p> : null}
      <button disabled={saving} type="submit" className="rounded-lg bg-brand-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-800 disabled:opacity-60">
        {saving ? 'Saving…' : 'Add Compliance Document'}
      </button>
    </form>
  );
}
