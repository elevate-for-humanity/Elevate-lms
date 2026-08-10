'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';

type Props = {
  userId: string;
  firstName: string;
  alreadySigned: boolean;
  signedAt: string | null;
};

export default function InstructorAgreementClient({ userId, firstName, alreadySigned, signedAt }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (alreadySigned) {
    return (
      <div className="border-t border-slate-200 bg-emerald-50 px-8 py-6">
        <div className="flex items-start gap-3 text-emerald-900">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Agreement signed</p>
            <p className="mt-1 text-sm">{signedAt ? `Accepted ${new Date(signedAt).toLocaleString()}` : 'Your acceptance is on file.'}</p>
          </div>
        </div>
      </div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const signerName = String(form.get('signerName') || '').trim();
    const acknowledged = form.get('acknowledged') === 'on';
    if (!signerName || !acknowledged) {
      setError('Enter your legal name and confirm the agreement.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) throw new Error('Authentication could not be verified.');

      const { error: insertError } = await supabase.from('license_agreement_acceptances').insert({
        user_id: user.id,
        agreement_type: 'instructor_services',
        document_version: '1.0',
        document_url: '/onboarding/instructor/agreement',
        signer_name: signerName,
        signer_email: user.email || '',
        auth_email: user.email || '',
        signature_method: 'typed',
        signature_typed: signerName,
        acceptance_context: 'instructor_onboarding',
        role_at_signing: 'instructor',
        legal_acknowledgment: true,
        is_immutable: true,
      });
      if (insertError) throw insertError;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record agreement acceptance.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-slate-200 bg-slate-50 px-8 py-6">
      <label className="block text-sm font-semibold text-slate-900">
        Type your legal name
        <input name="signerName" defaultValue={firstName} required maxLength={200} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
      </label>
      <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-700">
        <input name="acknowledged" type="checkbox" required className="mt-1 h-4 w-4" />
        <span>I have read this Instructor Services Agreement and agree to its terms. I understand this electronic acceptance is recorded with my authenticated account.</span>
      </label>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      <button disabled={saving} type="submit" className="mt-5 rounded-lg bg-brand-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-brand-blue-800 disabled:opacity-60">
        {saving ? 'Recording…' : 'Accept & Sign Agreement'}
      </button>
    </form>
  );
}
