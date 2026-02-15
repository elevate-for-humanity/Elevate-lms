"use client";

import React from 'react';

import { useState } from 'react';
import { CheckCircle2, Circle, Lock, FileText, DollarSign } from 'lucide-react';

interface OnboardingFlowProps {
  user: any;
  profile: any;
  packet: any;
  documents: any[];
  signedDocumentIds: Set<string>;
  payrollStatus: string | null;
}

export default function OnboardingFlow({
  user,
  profile,
  packet,
  documents,
  signedDocumentIds,
  payrollStatus,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Calculate progress
  const totalSteps = documents.length + 1; // documents + payroll setup
  const completedDocs = documents.filter((d) =>
    signedDocumentIds.has(d.id)
  ).length;
  const payrollComplete =
    payrollStatus === 'ACTIVE' || payrollStatus === 'PENDING';
  const completedSteps = completedDocs + (payrollComplete ? 1 : 0);
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  const roleNames: Record<string, string> = {
    PROGRAM_HOLDER: 'Program Holder',
    WORKSITE_ONLY: 'Worksite Only Partner',
    SITE_COORDINATOR: 'Site Coordinator',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">
                {roleNames[profile.role]} Onboarding
              </h1>
              <p className="text-black mt-1">
                Complete all steps to access your dashboard
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-blue-600">
                {progressPercent}%
              </div>
              <div className="text-sm text-black">
                {completedSteps} of {totalSteps} complete
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-blue-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Checklist */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-black mb-4">
                Onboarding Checklist
              </h2>
              <div className="space-y-3">
                {documents.map((doc, index) => {
                  const isComplete = signedDocumentIds.has(doc.id);
                  const isCurrent = index === currentStep;

                  return (
                    <button
                      key={doc.id}
                      onClick={() => setCurrentStep(index)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? 'bg-brand-blue-50 border-2 border-brand-blue-600'
                          : isComplete
                            ? 'bg-green-50 border border-green-200 hover:bg-brand-green-100'
                            : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      ) : isCurrent ? (
                        <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium ${
                            isComplete
                              ? 'text-green-900'
                              : isCurrent
                                ? 'text-brand-blue-900'
                                : 'text-black'
                          }`}
                        >
                          {doc.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {doc.document_type}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Payroll Setup Step */}
                <button
                  onClick={() => setCurrentStep(documents.length)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                    currentStep === documents.length
                      ? 'bg-brand-blue-50 border-2 border-brand-blue-600'
                      : payrollComplete
                        ? 'bg-green-50 border border-green-200 hover:bg-brand-green-100'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {payrollComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  ) : currentStep === documents.length ? (
                    <Circle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium ${
                        payrollComplete
                          ? 'text-green-900'
                          : currentStep === documents.length
                            ? 'text-brand-blue-900'
                            : 'text-black'
                      }`}
                    >
                      Payroll Setup
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {payrollStatus || 'Not Started'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {currentStep < documents.length ? (
              <DocumentStep
                document={documents[currentStep]}
                isComplete={signedDocumentIds.has(documents[currentStep].id)}
                userId={user.id}
                userRole={profile.role}
                userName={profile.full_name}
                onComplete={() => {
                  if (currentStep < totalSteps - 1) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
              />
            ) : (
              <PayrollSetupStep
                userId={user.id}
                userRole={profile.role}
                currentStatus={payrollStatus}
                onComplete={() => {
                  // Refresh page to check completion
                  window.location.reload();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Document Step Component
function DocumentStep({
  document,
  isComplete,
  userId,
  userRole,
  userName,
  onComplete,
}: any) {
  const [signature, setSignature] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (
      document.requires_signature &&
      signature.trim().toLowerCase() !== userName.toLowerCase()
    ) {
      setError('Signature must match your full name exactly');
      return;
    }

    if (!acknowledged) {
      setError(
        'You must acknowledge that you have read and understood this document'
      );
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/sign-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          signature: signature.trim(),
          signatureType: 'TYPED',
          role: userRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sign document');
      }

      onComplete();
    } catch (err: any) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-brand-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">
            {document.title}
          </h2>
          <p className="text-black mb-6">
            You completed this step on {new Date().toLocaleDateString()}
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700"
          >
            Continue to Next Step
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Document Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-brand-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-black">
              {document.title}
            </h2>
            <p className="text-black mt-1">{document.document_type}</p>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="p-6">
        <div className="prose prose-slate max-w-none">
          <div
            className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{
              __html: document.content.replace(/\n/g, '<br />'),
            }}
          />
        </div>

        {/* Signature Section */}
        {document.requires_signature && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Digital Signature
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
              <p className="text-sm text-black mt-1">
                Must match: <strong>{userName}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Acknowledgment Checkbox */}
        <div className="mt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-5 h-5 text-brand-blue-600 border-slate-300 rounded focus:ring-brand-blue-500"
            />
            <span className="text-sm text-black">
              I have read and understood this document. I acknowledge that this
              digital signature has the same legal effect as a handwritten
              signature.
            </span>
          </label>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !acknowledged ||
              (document.requires_signature && !signature)
            }
            className="w-full px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Sign and Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Payroll Setup Step Component
function PayrollSetupStep({
  userId,
  userRole,
  currentStatus,
  onComplete,
}: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-brand-green-100 rounded-lg">
          <DollarSign className="w-6 h-6 text-brand-green-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-black">Payroll Setup</h2>
          <p className="text-black mt-1">
            Configure your payment method and tax information
          </p>
        </div>
      </div>

      {currentStatus === 'PENDING' || currentStatus === 'ACTIVE' ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-brand-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-black mb-2">
            Payroll Setup Complete
          </h3>
          <p className="text-black mb-6">
            Status: <strong>{currentStatus}</strong>
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700"
          >
            Finish Onboarding
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-black">
            Set up your payroll profile to receive payments. You'll need:
          </p>
          <ul className="list-disc list-inside space-y-2 text-black">
            <li>W-9 tax form</li>
            <li>Bank account information (for ACH) or Stripe Connect</li>
            <li>Payment rate configuration</li>
          </ul>
          <a
            href="/onboarding/payroll-setup"
            className="inline-block w-full text-center px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 mt-6"
          >
            Set Up Payroll
          </a>
        </div>
      )}
    </div>
  );
}
