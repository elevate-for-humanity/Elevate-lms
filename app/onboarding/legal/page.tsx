
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Circle, FileText, Shield, AlertCircle } from 'lucide-react';
import { SignatureInput } from '@/components/onboarding/SignatureInput';

interface Agreement {
  type: string;
  title: string;
  description: string;
  documentUrl: string;
  version: string;
  signed: boolean;
}

const REQUIRED_AGREEMENTS: Agreement[] = [
  {
    type: 'terms_of_service',
    title: 'Terms of Service',
    description: 'Platform usage terms and conditions',
    documentUrl: '/terms-of-service',
    version: '2024.1',
    signed: false,
  },
  {
    type: 'privacy_policy',
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your data',
    documentUrl: '/privacy-policy',
    version: '2024.1',
    signed: false,
  },
  {
    type: 'handbook',
    title: 'Student Handbook',
    description: 'Program policies, expectations, and procedures',
    documentUrl: '/student-handbook',
    version: '2024.1',
    signed: false,
  },
];

export default function LegalOnboardingPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<Agreement[]>(REQUIRED_AGREEMENTS);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkExistingAgreements();
  }, []);

  async function checkExistingAgreements() {
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Check which agreements are already signed
      const { data: signedAgreements } = await supabase
        .from('license_agreement_acceptances')
        .select('agreement_type, document_version')
        .eq('user_id', currentUser.id);

      if (signedAgreements) {
        setAgreements(prev => prev.map(agreement => ({
          ...agreement,
          signed: signedAgreements.some(
            s => s.agreement_type === agreement.type && s.document_version === agreement.version
          ),
        })));
      }
    } catch (err) {
      console.error('Error checking agreements:', err);
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

      // Get user's role from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Insert agreement acceptance via API to bypass RLS
      const res = await fetch('/api/onboarding/accept-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreement_type: agreement.type,
          document_version: agreement.version,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to accept agreement');
      }
      const insertError = null;

      if (insertError) throw insertError;

      // Update local state
      setAgreements(prev => prev.map(a => 
        a.type === agreement.type ? { ...a, signed: true } : a
      ));

    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setSigning(false);
    }
  }

  async function completeOnboarding() {
    if (!user) return;
    
    setSigning(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      // Redirect to LMS
      router.push('/lms/dashboard');

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSigning(false);
    }
  }

  const allSigned = agreements.every(a => a.signed);
  const signedCount = agreements.filter(a => a.signed).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-brand-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Review & Accept Agreements
          </h1>
          <p className="text-slate-600">
            Please review and accept the following agreements to continue.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Progress</span>
            <span className="text-sm text-slate-500">{signedCount} of {agreements.length}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-brand-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(signedCount / agreements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-brand-red-700">{error}</p>
          </div>
        )}

        {/* Agreements */}
        <div className="space-y-4 mb-8">
          {agreements.map((agreement) => (
            <div 
              key={agreement.type}
              className={`bg-white rounded-xl p-6 shadow-sm border ${
                agreement.signed ? 'border-brand-green-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    agreement.signed ? 'bg-brand-green-100' : 'bg-slate-100'
                  }`}>
                    {agreement.signed ? (
                      <Circle className="w-5 h-5 text-brand-green-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{agreement.title}</h3>
                    <p className="text-sm text-slate-500 mb-2">{agreement.description}</p>
                    <Link 
                      href={agreement.documentUrl}
                      target="_blank"
                      className="text-sm text-brand-blue-600 hover:underline"
                    >
                      Read full document →
                    </Link>
                  </div>
                </div>
                
                {!agreement.signed && (
                  <button
                    onClick={() => signAgreement(agreement)}
                    disabled={signing}
                    className="px-4 py-2 bg-brand-blue-600 text-white text-sm font-medium rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signing ? 'Signing...' : 'I Accept'}
                  </button>
                )}
                
                {agreement.signed && (
                  <span className="px-3 py-1 bg-brand-green-100 text-brand-green-700 text-sm font-medium rounded-full">
                    Signed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Signature Section */}
        {allSigned && user && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Digital Signature</h3>
            <SignatureInput
              userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'}
              documentType="onboarding_agreements"
              onSignatureChange={() => {}}
              onSignatureSaved={() => {}}
              autoSave={false}
            />
          </div>
        )}

        {/* Complete Button */}
        {allSigned && (
          <button
            onClick={completeOnboarding}
            disabled={signing}
            className="w-full py-4 bg-brand-green-600 text-white font-bold rounded-xl hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {signing ? 'Completing...' : 'Continue to Dashboard'}
          </button>
        )}

        {!allSigned && (
          <p className="text-center text-slate-500 text-sm">
            Please accept all agreements to continue.
          </p>
        )}
      </div>
    </div>
  );
}
