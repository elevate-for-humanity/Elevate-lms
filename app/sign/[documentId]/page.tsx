
'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';

interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
}

export default function SignDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    async function fetchDocument() {
      const supabase = createClient();
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/sign/${documentId}`);
        return;
      }

      // Fetch document
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !data) {
        setError('Document not found or you do not have access.');
        setLoading(false);
        return;
      }

      // Check if already signed
      const { data: existingSignature } = await supabase
        .from('document_signatures')
        .select('id')
        .eq('document_id', documentId)
        .eq('user_id', user.id)
        .single();

      if (existingSignature) {
        setSigned(true);
      }

      setDocument(data);
      setLoading(false);
    }

    fetchDocument();
  }, [documentId, router]);

  const handleSign = async () => {
    if (!signature.trim() || !agreed) return;

    setSigning(true);
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Please log in to sign this document.');
      setSigning(false);
      return;
    }

    const { error } = await supabase
      .from('document_signatures')
      .insert({
        document_id: documentId,
        user_id: user.id,
        signature_text: signature,
        signed_at: new Date().toISOString(),
        ip_address: '', // Would be captured server-side
      });

    if (error) {
      setError('Failed to sign document. Please try again.');
      setSigning(false);
      return;
    }

    setSigned(true);
    setSigning(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-md p-8">
          <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-md p-8">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Document Signed</h1>
          <p className="text-gray-600 mb-6">
            You have successfully signed this document. A copy has been saved to your records.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Sign", href: "/sign" }, { label: "[Documentid]" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{document?.title || 'Document'}</h1>
              <p className="text-gray-500 mt-1">
                Please review and sign this document
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Pending Signature
              </span>
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="prose max-w-none">
            {document?.content ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(document.content) }} />
            ) : (
              <p className="text-gray-500 italic">Document content will appear here.</p>
            )}
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sign Document</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type your full legal name as your signature
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              placeholder="Your full legal name"
            />
          </div>

          <div className="mb-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500"
              />
              <span className="text-sm text-gray-600">
                I have read and agree to the terms of this document. I understand that by typing my name above, 
                I am providing my electronic signature which is legally binding.
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSign}
              disabled={!signature.trim() || !agreed || signing}
              className="flex-1 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {signing ? 'Signing...' : 'Sign Document'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            By signing, you agree that your electronic signature is the legal equivalent of your manual signature.
          </p>
        </div>
      </div>
    </div>
  );
}
