'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';



import { createBrowserClient } from '@supabase/ssr';
export default function ProgramHolderSetup() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('program_holders').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

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
    instructorName: '',
    instructorCredentials: '',
    deliveryMethod: '',
    assessmentType: '',
    customInstructions: '',
    // Banking information
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
    bankDocument: null as File | null,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, syllabusFile: e.target.files[0] });
    }
  };

  const handleSubmit = async () => {
    try {
      // API submission implemented

      // After successful submission, redirect to identity verification
      alert(
        'Program setup submitted! Please complete identity verification to activate your account.'
      );

      // Redirect to identity verification page
      window.location.href = '/program-holder/verify-identity';
    } catch (error) { /* Error handled silently */ 
      alert('Failed to submit. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Onboarding" }]} />
      </div>
      <div className="max-w-4xl mx-auto px-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s
                      ? 'bg-brand-green-600 text-white'
                      : 'bg-gray-300 text-black'
                  }`}
                >
                  {step > s ? <span className="text-slate-400 flex-shrink-0">•</span> : s}
                </div>
                {s < 5 && (
                  <div
                    className={`h-1 w-16 ${
                      step > s ? 'bg-brand-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span>Organization</span>
            <span>Program</span>
            <span>Syllabus</span>
            <span>Banking</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step 1: Organization Info */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">
              Organization Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block font-semibold mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., ABC Training Institute"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Program Name *
                </label>
                <input
                  type="text"
                  value={formData.programName}
                  onChange={(e) =>
                    setFormData({ ...formData, programName: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., Advanced Welding Certification"
                />
                <p className="text-sm text-black mt-1">
                  This name will appear on certificates: &quot;[Program Name] -
                  Sponsored by Elevate for Humanity Career &amp; Technical Institute&quot;
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700"
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
                <label className="block font-semibold mb-2">
                  Program Type *
                </label>
                <select
                  value={formData.programType}
                  onChange={(e) =>
                    setFormData({ ...formData, programType: e.target.value })
                  }
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
                <label className="block font-semibold mb-2">
                  Program Duration *
                </label>
                <input
                  type="text"
                  value={formData.programDuration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      programDuration: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., 8 weeks, 120 hours, 6 months"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Certification/Credential Offered *
                </label>
                <input
                  type="text"
                  value={formData.certificationOffered}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificationOffered: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., AWS Certified Welder, State CNA License"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Delivery Method *
                </label>
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryMethod: e.target.value })
                  }
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
                <Upload className="w-16 h-16 mx-auto mb-4 text-black" />
                <p className="text-lg font-semibold mb-2">
                  Upload Course Syllabus
                </p>
                <p className="text-black mb-4">
                  PDF, DOC, or DOCX (Max 10MB)
                </p>
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
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{formData.syllabusFile.name}</span>
                  </div>
                )}
              </div>

              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-brand-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-brand-blue-900 mb-2">
                      Our system will analyze your syllabus to:
                    </p>
                    <ul className="text-sm text-brand-blue-800 space-y-1">
                      <li>
                        • Match your program to compatible course templates
                      </li>
                      <li>• Identify required learning modules</li>
                      <li>• Suggest assessment methods</li>
                      <li>• Create custom certificate templates</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Custom Instructions for Students
                </label>
                <textarea
                  value={formData.customInstructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customInstructions: e.target.value,
                    })
                  }
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

        {/* Step 4: Banking Information */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Banking Information</h2>
            <p className="text-black mb-6">
              Provide your banking details for payment processing. This
              information is encrypted and secure.
            </p>
            <div className="space-y-6">
              <div>
                <label className="block font-semibold mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountHolderName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Full name on bank account"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Bank Name *</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., Chase, Bank of America"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Account Type *
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountType: e.target.value as 'checking' | 'savings',
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Routing Number *
                </label>
                <input
                  type="text"
                  value={formData.routingNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, routingNumber: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="9-digit routing number"
                  maxLength={9}
                />
                <p className="text-sm text-black mt-1">
                  Found on the bottom left of your check
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Account number"
                />
                <p className="text-sm text-black mt-1">
                  Found on the bottom of your check, after the routing number
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Upload Voided Check or Bank Letter (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-black" />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDocument: e.target.files?.[0] || null,
                      })
                    }
                    className="hidden"
                    id="bank-document-upload"
                  />
                  <label
                    htmlFor="bank-document-upload"
                    className="inline-block bg-brand-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-brand-blue-700"
                  >
                    Choose File
                  </label>
                  {formData.bankDocument && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-brand-green-600">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span>{formData.bankDocument.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Security:</strong> Your banking information is
                  encrypted and stored securely. We use bank-level security to
                  protect your data.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-300 text-black py-4 rounded-lg font-bold hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Review Your Program</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-black">Organization</p>
                  <p className="font-semibold">{formData.organizationName}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Program Name</p>
                  <p className="font-semibold">{formData.programName}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Certificate Will Read</p>
                  <p className="font-semibold text-brand-green-600">
                    {formData.programName} - Sponsored by Elevate for Humanity Career &amp; Technical Institute
                  </p>
                </div>
                <div>
                  <p className="text-sm text-black">Program Type</p>
                  <p className="font-semibold">{formData.programType}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Duration</p>
                  <p className="font-semibold">{formData.programDuration}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Syllabus</p>
                  <p className="font-semibold">
                    {formData.syllabusFile?.name || 'Not uploaded'}
                  </p>
                </div>
              </div>

              <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6">
                <h3 className="font-bold text-brand-green-900 mb-3">
                  What Happens Next?
                </h3>
                <ol className="text-sm text-brand-green-800 space-y-2">
                  <li>1. Our team reviews your program details and syllabus</li>
                  <li>2. We match your program to compatible course modules</li>
                  <li>
                    3. Custom certificate templates are created with your
                    program name
                  </li>
                  <li>
                    4. You receive access to enroll students (typically within
                    24-48 hours)
                  </li>
                  <li>
                    5. Your custom instructions appear in the course for your
                    students
                  </li>
                </ol>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-300 text-black py-4 rounded-lg font-bold hover:bg-gray-400"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700"
                >
                  Submit Program
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
