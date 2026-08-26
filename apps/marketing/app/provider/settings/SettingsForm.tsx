'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type InitialValues = {
  name: string;
  tagline: string;
  supportEmail: string;
  website: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  logoUrl: string;
};

type Props = {
  tenantId: string;
  orgId: string | null;
  initial: InitialValues;
};

export default function SettingsForm({ tenantId, orgId, initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get('name') || '').trim(),
      tagline: String(form.get('tagline') || '').trim() || null,
      support_email: String(form.get('supportEmail') || '').trim() || null,
      website: String(form.get('website') || '').trim() || null,
      phone: String(form.get('phone') || '').trim() || null,
      address: String(form.get('addressLine1') || '').trim() || null,
      city: String(form.get('city') || '').trim() || null,
      state: String(form.get('state') || '').trim().toUpperCase() || null,
      zip: String(form.get('zip') || '').trim() || null,
      logo_url: String(form.get('logoUrl') || '').trim() || null,
    };

    if (!values.name) {
      setError('Organization name is required.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required.');

      let dbError: { message?: string } | null = null;
      if (orgId) {
        const result = await supabase
          .from('organizations')
          .update(values)
          .eq('id', orgId)
          .eq('tenant_id', tenantId);
        dbError = result.error;
      } else {
        const slug = values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
        const result = await supabase.from('organizations').insert({
          ...values,
          tenant_id: tenantId,
          slug: slug || `provider-${tenantId.slice(0, 8)}`,
          status: 'active',
          type: 'training_provider',
        });
        dbError = result.error;
      }
      if (dbError) throw new Error(dbError.message || 'Unable to update organization.');

      setMessage('Organization profile updated.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update organization.');
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950';

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
      <label className="block text-sm font-medium text-slate-800">Organization name<input name="name" defaultValue={initial.name} required maxLength={200} className={fieldClass} /></label>
      <label className="block text-sm font-medium text-slate-800">Tagline<input name="tagline" defaultValue={initial.tagline} maxLength={250} className={fieldClass} /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-800">Support email<input name="supportEmail" type="email" defaultValue={initial.supportEmail} className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-800">Phone<input name="phone" defaultValue={initial.phone} maxLength={40} className={fieldClass} /></label>
      </div>
      <label className="block text-sm font-medium text-slate-800">Website<input name="website" type="url" defaultValue={initial.website} placeholder="https://..." className={fieldClass} /></label>
      <label className="block text-sm font-medium text-slate-800">Logo URL<input name="logoUrl" type="url" defaultValue={initial.logoUrl} placeholder="https://..." className={fieldClass} /></label>
      <label className="block text-sm font-medium text-slate-800">Street address<input name="addressLine1" defaultValue={initial.addressLine1} maxLength={200} className={fieldClass} /></label>
      <div className="grid gap-4 sm:grid-cols-[1fr_90px_120px]">
        <label className="text-sm font-medium text-slate-800">City<input name="city" defaultValue={initial.city} maxLength={100} className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-800">State<input name="state" defaultValue={initial.state} maxLength={2} className={fieldClass} /></label>
        <label className="text-sm font-medium text-slate-800">ZIP<input name="zip" defaultValue={initial.zip} maxLength={10} className={fieldClass} /></label>
      </div>
      {message ? <p role="status" className="text-sm font-medium text-brand-green-700">{message}</p> : null}
      {error ? <p role="alert" className="text-sm font-medium text-red-700">{error}</p> : null}
      <button type="submit" disabled={saving} className="rounded-lg bg-brand-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-800 disabled:opacity-60">
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </form>
  );
}
