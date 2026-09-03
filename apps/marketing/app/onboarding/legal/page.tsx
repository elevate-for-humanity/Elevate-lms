'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Circle, FileText, Shield, AlertCircle } from 'lucide-react';
import { SignatureInput } from '@/components/onboarding/SignatureInput';
import { logger } from '@/lib/logger';

interface Agreement {
  type: string;
  title: string;
  description: string;
  documentUrl: string;
  version: string;
  signed: boolean;
}

const REQUIRED_AGREEMENTS: Agreement[] = [
  { type: 'terms_of_service', title: 'Terms of Service', description: 'Platform usage terms and conditions', documentUrl: '/legal', version: '2024.1', signed: false },
  { type: 'privacy_policy', title: 'Privacy Policy', description: 'How we collect, use, and protect your data', documentUrl: '/legal/privacy', version: '2024.1', signed: false },
  { type: 'handbook', title: 'Student Handbook', description: 'Program policies, expectations, and procedures', documentUrl: '/student-handbook', version: '2024.1', signed: false },
];

export default function LegalOnboardingPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<Agreement[]>(REQUIRED_AGREEMENTS);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    void checkExistingAgreements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkExistingAgreements() {
    try {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }
      setUser(currentUser);

      const { data: signedAgreements } = await supabase
        .from('license_agreement_acceptances')
        .select('agreement_type, document_version')
        .eq('user_id', currentUser.id);

      if (signedAgreements) {
        setAgreements((previous) => previous.map((agreement) => ({
          ...agreement,
          signed: signedAgreements.some(
            (signed) => signed.agreement_type === agreement.type && signed.document_version === agreement.version,
          ),
        })));
      }
    } catch (caught) {
      logger.error('Error checking agreements:', caught);
    } finally {
      setLoading(false);
    }
  }

  async function signAgreement(agreement: Agreement) {
    if (!user) return;
    setSigning(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      const { error: insertError } = await supabase.from('license_agreement_acceptances').insert({
        user_id: user.id,
        agreement_type: agreement.type,
        document_version: agreement.version,
        document_url: agreement.documentUrl,
        role_at_signing: profile?.role || 'student',
        email_at_signing: user.email,
      });
      if (insertError) throw insertError;
      setAgreements((previous) => previous.map((item) => item.type === agreement.type ? { ...item, signed: true } : item));
    } catch {
      setError('The agreement could not be saved. Please try again.');
    } finally {
      setSigning(false);
    }
  }

  async function completeOnboarding() {
    if (!user) return;
    setSigning(true);
    setError(null);

    try {
      const supabase = createClient();
      const now = new Date().toISOString();
      const { error: profileError } = await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_completed_at: now,
      }).eq('id', user.id);
      if (profileError) throw profileError;

      try {
        await supabase.from('user_onboarding_status').upsert({
          user_id: user.id,
          status: 'complete',
          agreements_signed: true,
          completed_at: now,
        }, { onConflict: 'user_id' });
      } catch (auditError) {
        logger.warn('Supplemental onboarding status write failed', { auditError });
      }

      router.push('https://app.elevateforhumanity.org/lms/dashboard');
    } catch {
      setError('Failed to complete onboarding. Please try again or contact support.');
    } finally {
      setSigning(false);
    }
  }

  const allSigned = agreements.every((agreement) => agreement.signed);
  const signedCount = agreements.filter((agreement) => agreement.signed).length;

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-blue-600" /></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue-100"><Shield className="h-8 w-8 text-brand-blue-600" /></div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Review & Accept Agreements</h1>
          <p className="text-slate-600">Review and accept the required agreements to continue.</p>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-slate-700">Progress</span><span className="text-sm text-slate-500">{signedCount} of {agreements.length}</span></div>
          <div className="h-2 w-full rounded-full bg-slate-200"><div className="h-2 rounded-full bg-brand-blue-600 transition-all" style={{ width: `${(signedCount / agreements.length) * 100}%` }} /></div>
        </div>

        {error ? <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" /><p className="text-red-700">{error}</p></div> : null}

        <div className="mb-8 space-y-4">
          {agreements.map((agreement) => (
            <section key={agreement.type} className={`rounded-xl border bg-white p-6 shadow-sm ${agreement.signed ? 'border-green-200' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${agreement.signed ? 'bg-green-100' : 'bg-slate-100'}`}>
                    {agreement.signed ? <Circle className="h-5 w-5 text-green-600" /> : <FileText className="h-5 w-5 text-slate-500" />}
                  </div>
                  <div><h2 className="font-semibold text-slate-900">{agreement.title}</h2><p className="mb-2 text-sm text-slate-500">{agreement.description}</p><Link href={agreement.documentUrl} target="_blank" className="text-sm font-bold text-brand-blue-700 hover:underline">Read full document →</Link></div>
                </div>
                {agreement.signed ? <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Signed</span> : <button type="button" onClick={() => void signAgreement(agreement)} disabled={signing} className="rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">I Accept</button>}
              </div>
            </section>
          ))}
        </div>

        {allSigned && user ? <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-4 font-semibold text-slate-900">Digital Signature</h2><SignatureInput userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'} documentType="onboarding_agreements" onSignatureChange={() => {}} onSignatureSaved={() => {}} autoSave={false} /></section> : null}

        {allSigned ? <button type="button" onClick={() => void completeOnboarding()} disabled={signing} className="w-full rounded-xl bg-green-600 py-4 font-bold text-white disabled:opacity-50">{signing ? 'Completing…' : 'Continue to Dashboard'}</button> : <p className="text-center text-sm text-slate-500">Please accept all agreements to continue.</p>}
      </div>
    </main>
  );
}
