'use client';

import React from 'react';
import { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function ProgramHolderSetup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '',
    programName: '',
    programType: '',
    programDuration: '',
    certificationOffered: '',
    targetIndustry: '',
    prerequisitesRequired: '',
    syllabusFile: null as File | null,
    deliveryMethod: '',
    assessmentType: '',
    customInstructions: '',
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, syllabusFile: e.target.files[0] });
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      let syllabusUrl: string | null = null;
      if (formData.syllabusFile) {
        const fd = new FormData();
        fd.append('file', formData.syllabusFile);
        fd.append('bucket', 'documents');
        fd.append('path', `program-holder/syllabus/${Date.now()}-${formData.syllabusFile.name}`);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          syllabusUrl = uploadData.url ?? null;
        }
      }

      const res = await fetch('/api/program-holder/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          programName: formData.programName,
          programType: formData.programType,
          programDuration: formData.programDuration,
          certificationOffered: formData.certificationOffered,
          targetIndustry: formData.targetIndustry,
          prerequisitesRequired: formData.prerequisitesRequired,
          deliveryMethod: formData.deliveryMethod,
          assessmentType: formData.assessmentType,
          customInstructions: formData.customInstructions,
          syllabusUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || 'Submission failed. Please try again.');
        return;
      }

      window.location.href = '/program-holder/verify-identity';
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = ['Organization', 'Program', 'Syllabus', 'Review'];

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Program Holder', href: '/program-holder' }, { label: 'Onboarding' }]} />
      </div>
      <div className="max-w-4xl mx-auto px-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((label, idx) => {
              const s = idx + 1;
              return (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step >= s ? 'bg-brand-green-600 text-white' : 'bg-gray-300 text-black'
                    }`}
                  >
                    {step > s ? '✓' : s}
                  </div>
                  {s < STEPS.length && (
                    <div className={`h-1 w-16 ${step > s ? 'bg-brand-green-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            {STEPS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        {/* Step 1: Organization Info */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Organization Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block font-semibold mb-2">Organization Name *</label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., ABC Training Institute"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Program Name *</label>
                <input
                  type="text"
                  value={formData.programName}
                  onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., Advanced Welding Certification"
                />
                <p className="text-sm text-slate-500 mt-1">
                  This name will appear on certificates: &quot;[Program Name] — Sponsored by Elevate for Humanity Career &amp; Technical Institute&quot;
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.organizationName || !formData.programName}
                className="w-full bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Program Details */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Program Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block font-semibold mb-2">Program Type *</label>
                <select
                  value={formData.programType}
                  onChange={(e) => setFormData({ ...formData, programType: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Select type...</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="skilled-trades">Skilled Trades</option>
                  <option value="technology">Technology/IT</option>
                  <option value="business">Business/Finance</option>
                  <option value="beauty">Beauty/Cosmetology</option>
                  <option value="transportation">Transportation/CDL</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-2">Program Duration *</label>
                <input
                  type="text"
                  value={formData.programDuration}
                  onChange={(e) => setFormData({ ...formData, programDuration: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., 8 weeks, 120 hours, 6 months"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Certification/Credential Offered *</label>
                <input
                  type="text"
                  value={formData.certificationOffered}
                  onChange={(e) => setFormData({ ...formData, certificationOffered: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., AWS Certified Welder, State CNA License"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Delivery Method *</label>
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="">Select method...</option>
                  <option value="online">100% Online</option>
                  <option value="hybrid">Hybrid (Online + In-Person)</option>
                  <option value="in-person">100% In-Person</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-300 text-black py-4 rounded-lg font-bold hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload Syllabus */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Upload Your Syllabus</h2>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-semibold mb-2">Upload Course Syllabus</p>
                <p className="text-slate-500 mb-4">PDF, DOC, or DOCX (Max 10MB)</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="syllabus-upload"
                />
                <label
                  htmlFor="syllabus-upload"
                  className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-brand-blue-700"
                >
                  Choose File
                </label>
                {formData.syllabusFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-brand-green-600">
                    <span>✓</span>
                    <span>{formData.syllabusFile.name}</span>
                  </div>
                )}
              </div>

              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-brand-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-brand-blue-900 mb-2">Our team will use your syllabus to:</p>
                    <ul className="text-sm text-brand-blue-800 space-y-1">
                      <li>• Match your program to compatible course templates</li>
                      <li>• Identify required learning modules</li>
                      <li>• Suggest assessment methods</li>
                      <li>• Create custom certificate templates</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Custom Instructions for Students</label>
                <textarea
                  value={formData.customInstructions}
                  onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Add any special instructions, requirements, or notes for students enrolled in your program..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-300 text-black py-4 rounded-lg font-bold hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Review Your Program</h2>
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6 space-y-4 divide-y divide-slate-200">
                {[
                  { label: 'Organization', value: formData.organizationName },
                  { label: 'Program Name', value: formData.programName },
                  {
                    label: 'Certificate Will Read',
                    value: `${formData.programName} — Sponsored by Elevate for Humanity Career & Technical Institute`,
                    highlight: true,
                  },
                  { label: 'Program Type', value: formData.programType },
                  { label: 'Duration', value: formData.programDuration },
                  { label: 'Delivery Method', value: formData.deliveryMethod },
                  { label: 'Syllabus', value: formData.syllabusFile?.name || 'Not uploaded' },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="pt-4 first:pt-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className={`font-semibold ${highlight ? 'text-brand-green-700' : 'text-slate-900'}`}>{value || '—'}</p>
                  </div>
                ))}
              </div>

              <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6">
                <h3 className="font-bold text-brand-green-900 mb-3">What Happens Next?</h3>
                <ol className="text-sm text-brand-green-800 space-y-2">
                  <li>1. Our team reviews your program details and syllabus</li>
                  <li>2. We match your program to compatible course modules</li>
                  <li>3. Custom certificate templates are created with your program name</li>
                  <li>4. You receive access to enroll students (typically within 24–48 hours)</li>
                  <li>5. Your custom instructions appear in the course for your students</li>
                </ol>
              </div>

              {submitError && (
                <p className="text-red-600 text-sm text-center">{submitError}</p>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(3)}
                  disabled={submitting}
                  className="flex-1 bg-gray-300 text-black py-4 rounded-lg font-bold hover:bg-gray-400 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit Program'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
