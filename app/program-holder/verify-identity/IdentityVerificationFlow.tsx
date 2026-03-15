"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Shield,
  Upload,
  Clock,
  AlertCircle,
  FileText,
  Camera,
CheckCircle, } from 'lucide-react';

interface IdentityVerificationFlowProps {
  userId: string;
  email: string;
  programHolder: any;
  verification: any;
  documents: any[];
}

export default function IdentityVerificationFlow({
  userId,
  email,
  programHolder,
  verification,
  documents,
}: IdentityVerificationFlowProps) {
  const router = useRouter();
  const [verificationMethod, setVerificationMethod] = useState<
    'stripe' | 'manual' | null
  >(null);
  const [uploadedDocs, setUploadedDocs] = useState<{
    id?: File;
    ssn?: File;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if documents already uploaded
  const hasIdDoc = documents.some((d) => d.document_type === 'id');
  const hasSsnDoc = documents.some((d) => d.document_type === 'ssn');

  const handleStripeVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call API to create Stripe Identity session
      const response = await fetch('/api/program-holder/create-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create verification session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Identity
      window.location.href = url;
    } catch (err: any) {
      setError((err as Error).message || 'Failed to start verification');
      setLoading(false);
    }
  };

  const handleManualUpload = async () => {
    if (!uploadedDocs.id || !uploadedDocs.ssn) {
      setError('Please upload both ID and Social Security Card');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Upload ID document
      const idExt = uploadedDocs.id.name.split('.').pop();
      const idPath = `${userId}/id_${Date.now()}.${idExt}`;
      const { error: idUploadError } = await supabase.storage
        .from('program-holder-documents')
        .upload(idPath, uploadedDocs.id);

      if (idUploadError) throw idUploadError;

      // Upload SSN document
      const ssnExt = uploadedDocs.ssn.name.split('.').pop();
      const ssnPath = `${userId}/ssn_${Date.now()}.${ssnExt}`;
      const { error: ssnUploadError } = await supabase.storage
        .from('program-holder-documents')
        .upload(ssnPath, uploadedDocs.ssn);

      if (ssnUploadError) throw ssnUploadError;

      // Create document records
      await supabase.from('program_holder_documents').insert([
        {
          program_holder_id: userId,
          document_type: 'id',
          file_path: idPath,
          file_name: uploadedDocs.id.name,
          uploaded_at: new Date().toISOString(),
        },
        {
          program_holder_id: userId,
          document_type: 'ssn',
          file_path: ssnPath,
          file_name: uploadedDocs.ssn.name,
          uploaded_at: new Date().toISOString(),
        },
      ]);

      // Create verification record
      await supabase.from('program_holder_verification').insert({
        program_holder_id: userId,
        verification_type: 'manual',
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      // Update program holder status
      await supabase
        .from('program_holders')
        .update({
          verification_status: 'pending',
        })
        .eq('user_id', userId);

      router.push('/program-holder/verification-pending');
      router.refresh();
    } catch (err: any) {
      setError((err as Error).message || 'Failed to upload documents');
      setLoading(false);
    }
  };

  // If verification is pending
  if (verification?.status === 'pending' || hasIdDoc || hasSsnDoc) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-brand-orange-600" />
          <h1 className="text-2xl font-bold text-black mb-4">
            Verification Pending
          </h1>
          <p className="text-black mb-6">
            Your documents have been submitted and are under review. Our team
            will verify your identity within 24-48 hours.
          </p>
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-brand-blue-800">
              You'll receive an email at <strong>{email}</strong> once your
              verification is complete.
            </p>
          </div>
          <button
            onClick={() => router.push('/program-holder/dashboard')}
            className="w-full px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If verification failed
  if (verification?.status === 'failed') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-brand-red-600" />
          <h1 className="text-2xl font-bold text-black mb-4">
            Verification Failed
          </h1>
          <p className="text-black mb-6">
            We were unable to verify your identity. Please try again or contact
            support for assistance.
          </p>
          {verification.notes && (
            <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-brand-red-800">
                <strong>Reason:</strong> {verification.notes}
              </p>
            </div>
          )}
          <button
            onClick={() => setVerificationMethod(null)}
            className="w-full px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Choose verification method
  if (!verificationMethod) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 mx-auto mb-4 text-brand-blue-600" />
            <h1 className="text-3xl font-bold text-black mb-4">
              Identity Verification
            </h1>
            <p className="text-black">
              To activate your program holder account, we need to verify your
              identity. Choose your preferred verification method:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stripe Identity - Instant */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-brand-blue-500">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-8 h-8 text-brand-blue-600" />
                <div>
                  <h3 className="text-lg font-bold text-black">
                    Instant Verification
                  </h3>
                  <span className="text-xs text-brand-green-600 font-medium">
                    RECOMMENDED
                  </span>
                </div>
              </div>
              <p className="text-sm text-black mb-4">
                Take a selfie and photo of your ID. Verification completes in
                minutes.
              </p>
              <ul className="text-sm text-black space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  Instant results
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  Secure \u0026 encrypted
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  No document upload needed
                </li>
              </ul>
              <button
                onClick={() => setVerificationMethod('stripe')}
                className="w-full px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700"
              >
                Start Instant Verification
              </button>
            </div>

            {/* Manual Upload */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-8 h-8 text-black" />
                <div>
                  <h3 className="text-lg font-bold text-black">
                    Manual Upload
                  </h3>
                  <span className="text-xs text-black font-medium">
                    24-48 HOURS
                  </span>
                </div>
              </div>
              <p className="text-sm text-black mb-4">
                Upload photos of your ID and Social Security Card for manual
                review.
              </p>
              <ul className="text-sm text-black space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-orange-600" />
                  24-48 hour review
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-black" />
                  Upload documents
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-black" />
                  Secure storage
                </li>
              </ul>
              <button
                onClick={() => setVerificationMethod('manual')}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
              >
                Upload Documents
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-black">
              Your information is encrypted and secure. We comply with all
              privacy regulations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Stripe Identity Flow
  if (verificationMethod === 'stripe') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <Camera className="w-16 h-16 mx-auto mb-4 text-brand-blue-600" />
          <h1 className="text-2xl font-bold text-black mb-4 text-center">
            Instant Identity Verification
          </h1>
          <p className="text-black mb-6 text-center">
            You'll be redirected to our secure verification partner to complete
            identity verification.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-brand-blue-900 mb-2">
              What you'll need:
            </h3>
            <ul className="text-sm text-brand-blue-800 space-y-1">
              <li>• Government-issued photo ID</li>
              <li>• Camera or smartphone</li>
              <li>• 2-3 minutes</li>
            </ul>
          </div>

          <button
            onClick={handleStripeVerification}
            disabled={loading}
            className="w-full px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {loading ? 'Starting verification...' : 'Continue to Verification'}
          </button>

          <button
            onClick={() => setVerificationMethod(null)}
            className="w-full px-4 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Manual Upload Flow
  if (verificationMethod === 'manual') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <Upload className="w-16 h-16 mx-auto mb-4 text-black" />
          <h1 className="text-2xl font-bold text-black mb-4 text-center">
            Upload Verification Documents
          </h1>
          <p className="text-black mb-6 text-center">
            Upload clear photos of your ID and Social Security Card. Our team
            will review within 24-48 hours.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6 mb-6">
            {/* Photo ID */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Photo ID (Driver's License, Passport, State ID) *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-black" />
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setUploadedDocs({
                      ...uploadedDocs,
                      id: e.target.files?.[0],
                    })
                  }
                  className="hidden"
                  id="id-upload"
                />
                <label
                  htmlFor="id-upload"
                  className="inline-block bg-brand-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-brand-blue-700"
                >
                  Choose File
                </label>
                {uploadedDocs.id && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-brand-green-600">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-sm">{uploadedDocs.id.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Security Card */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Social Security Card *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-black" />
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setUploadedDocs({
                      ...uploadedDocs,
                      ssn: e.target.files?.[0],
                    })
                  }
                  className="hidden"
                  id="ssn-upload"
                />
                <label
                  htmlFor="ssn-upload"
                  className="inline-block bg-brand-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-brand-blue-700"
                >
                  Choose File
                </label>
                {uploadedDocs.ssn && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-brand-green-600">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-sm">{uploadedDocs.ssn.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Security:</strong> Your documents are encrypted and stored
              securely. Only authorized administrators can access them for
              verification purposes.
            </p>
          </div>

          <button
            onClick={handleManualUpload}
            disabled={loading || !uploadedDocs.id || !uploadedDocs.ssn}
            className="w-full px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {loading ? 'Uploading...' : 'Submit for Review'}
          </button>

          <button
            onClick={() => setVerificationMethod(null)}
            className="w-full px-4 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
