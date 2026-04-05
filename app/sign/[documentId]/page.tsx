'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';

interface SignatureDocument {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
}

export default function SignDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [doc, setDoc] = useState<SignatureDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/sign/${documentId}`);
        return;
      }

      // Fetch from signature_documents — the table admin creates docs in
      const { data, error: fetchError } = await supabase
        .from('signature_documents')
        .select('id, title, body, type, created_at')
        .eq('id', documentId)
        .single();

      if (fetchError || !data) {
        setError('Document not found or you do not have access.');
        setLoading(false);
        return;
      }

      // Check if already signed (by email since signatures table uses signer_email)
      const { data: existing } = await supabase
        .from('signatures')
        .select('id')
        .eq('document_id', documentId)
        .eq('signer_email', user.email)
        .maybeSingle();

      if (existing) setSigned(true);

      setDoc(data);
      setLoading(false);
    }

    load();
  }, [documentId, router]);

  const handleSign = async () => {
    if (!signature.trim() || !agreed) return;

    setSigning(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Please log in to sign this document.');
      setSigning(false);
      return;
    }

    const res = await fetch(`/api/signature/documents/${documentId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signerName: signature.trim(),
        signerEmail: user.email,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Failed to sign document. Please try again.');
      setSigning(false);
      return;
    }

    setSigned(true);
    setSigning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Document Not Found</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link href="/learner/dashboard" className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Document Signed</h1>
          <p className="text-slate-500 mb-6">
            Your signature has been recorded. A copy has been saved to your account.
          </p>
          <Link href="/learner/dashboard" className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Sign Document', href: '/sign' }, { label: doc?.title || 'Document' }]} />
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{doc?.title || 'Document'}</h1>
              <p className="text-slate-500 mt-1">Please review and sign this document</p>
            </div>
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              Pending Signature
            </span>
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
          <div className="prose max-w-none">
            {doc?.body ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(doc.body) }} />
            ) : (
              <p className="text-slate-400 italic">Document content will appear here.</p>
            )}
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Sign Document</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type your full legal name as your signature
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              placeholder="Your full legal name"
            />
          </div>

          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-blue-600 border-slate-300 rounded focus:ring-brand-blue-500"
              />
              <span className="text-sm text-slate-600">
                I have read and agree to the terms of this document. I understand that by typing my name above,
                I am providing my electronic signature which is legally binding under the E-SIGN Act.
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSign}
              disabled={!signature.trim() || !agreed || signing}
              className="flex-1 px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-semibold hover:bg-brand-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {signing ? 'Signing...' : 'Sign Document'}
            </button>
            <Link
              href="/learner/dashboard"
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-400 text-center">
            Your signature, IP address, and timestamp are recorded for audit purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
