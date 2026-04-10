'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  FileText, CheckCircle2, Circle, AlertCircle, ArrowRight,
  Download, Shield, Clock, BookOpen,
} from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

interface FormItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'legal' | 'compliance' | 'insurance' | 'training';
  action: 'sign' | 'upload' | 'complete' | 'download';
  href: string;
  downloadHref?: string;
}

const REQUIRED_FORMS: FormItem[] = [
  {
    id: 'mou',
    name: 'Memorandum of Understanding (MOU)',
    description: 'Partnership agreement between your salon and Elevate for Humanity. Must be signed before hosting apprentices.',
    required: true,
    category: 'legal',
    action: 'sign',
    href: '/partners/cosmetology-apprenticeship/sign-mou',
  },
  {
    id: 'handbook-ack',
    name: 'Partner Handbook Acknowledgment',
    description: 'Confirm you have read and understand the Partner Handbook, including responsibilities, policies, and prohibited practices.',
    required: true,
    category: 'compliance',
    action: 'sign',
    href: '/partners/cosmetology-apprenticeship/policy-acknowledgment',
  },
  {
    id: 'w9',
    name: 'W-9 Form (Tax Identification)',
    description: 'IRS Form W-9 for tax reporting purposes. Required for all worksite partners.',
    required: true,
    category: 'legal',
    action: 'upload',
    href: '/partners/cosmetology-apprenticeship/documents',
    downloadHref: 'https://www.irs.gov/pub/irs-pdf/fw9.pdf',
  },
  {
    id: 'salon-license',
    name: 'Indiana Salon License',
    description: 'Copy of your current, valid Indiana salon license.',
    required: true,
    category: 'compliance',
    action: 'upload',
    href: '/partners/cosmetology-apprenticeship/documents',
  },
  {
    id: 'workers-comp',
    name: "Workers' Compensation Certificate",
    description: "Proof of current workers' compensation insurance coverage.",
    required: true,
    category: 'insurance',
    action: 'upload',
    href: '/partners/cosmetology-apprenticeship/documents',
  },
  {
    id: 'liability-insurance',
    name: 'General Liability Insurance',
    description: 'Certificate of general liability insurance for your salon.',
    required: true,
    category: 'insurance',
    action: 'upload',
    href: '/partners/cosmetology-apprenticeship/documents',
  },
  {
    id: 'supervisor-license',
    name: 'Supervising Cosmetologist License',
    description: "Copy of the licensed cosmetologist's Indiana IPLA license who will directly supervise the apprentice. Must have 2+ years experience.",
    required: true,
    category: 'compliance',
    action: 'upload',
    href: '/partners/cosmetology-apprenticeship/documents',
  },
  {
    id: 'safety-checklist',
    name: 'Workplace Safety Self-Assessment',
    description: 'Complete the workplace safety checklist confirming your salon meets health and safety standards.',
    required: true,
    category: 'training',
    action: 'complete',
    href: '/partners/cosmetology-apprenticeship/policy-acknowledgment',
  },
  {
    id: 'compensation-agreement',
    name: 'Apprentice Compensation Agreement',
    description: 'Document the agreed compensation model (hourly, commission, or hybrid) and rate for the apprentice.',
    required: true,
    category: 'legal',
    action: 'sign',
    href: '/partners/cosmetology-apprenticeship/sign-mou',
  },
  {
    id: 'anti-discrimination',
    name: 'Anti-Discrimination & Equal Opportunity Policy',
    description: "Acknowledge compliance with federal and state anti-discrimination laws and Elevate's equal opportunity policy.",
    required: true,
    category: 'compliance',
    action: 'sign',
    href: '/partners/cosmetology-apprenticeship/policy-acknowledgment',
  },
];

const categoryLabels: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  legal: { label: 'Legal & Agreements', icon: FileText, color: 'text-purple-600 bg-purple-50' },
  compliance: { label: 'Compliance & Licensing', icon: Shield, color: 'text-indigo-600 bg-indigo-50' },
  insurance: { label: 'Insurance', icon: Shield, color: 'text-emerald-600 bg-emerald-50' },
  training: { label: 'Training & Safety', icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
};

const actionLabels: Record<string, string> = {
  sign: 'Sign Digitally',
  upload: 'Upload Document',
  complete: 'Complete Form',
  download: 'Download',
};

export default function CosmetologyRequiredFormsPage() {
  const [completedForms, setCompletedForms] = useState<Set<string>>(new Set());

  const totalRequired = REQUIRED_FORMS.filter(f => f.required).length;
  const completedCount = REQUIRED_FORMS.filter(f => completedForms.has(f.id)).length;
  const progress = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;

  const categories = ['legal', 'compliance', 'insurance', 'training'];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners/cosmetology-apprenticeship' },
          { label: 'Required Forms' },
        ]} />
      </div>

      <section className="py-6 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <InstitutionalHeader
            documentType="Required Forms"
            title="Host Salon Forms & Documents"
            subtitle="Complete all required forms before hosting apprentices. Track your progress below."
            noDivider
          />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Completion Progress</h2>
            <span className="text-sm font-medium text-black">{completedCount} of {totalRequired} complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 ? (
            <p className="text-sm text-brand-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> All forms complete — you are ready to host apprentices.
            </p>
          ) : (
            <p className="text-sm text-black flex items-center gap-1">
              <Clock className="w-4 h-4" /> Complete all required forms to begin hosting apprentices.
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/partners/cosmetology-apprenticeship/sign-mou"
            className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all group"
          >
            <div className="bg-purple-600 h-2" />
            <div className="p-4">
              <p className="font-semibold text-gray-900">Sign MOU</p>
              <p className="text-sm text-black">Digital signature required</p>
            </div>
          </Link>
          <Link
            href="/partners/cosmetology-apprenticeship/handbook"
            className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all group"
          >
            <div className="bg-purple-600 h-2" />
            <div className="p-4">
              <p className="font-semibold text-gray-900">Partner Handbook</p>
              <p className="text-sm text-black">Policies & responsibilities</p>
            </div>
          </Link>
          <Link
            href="/partners/cosmetology-apprenticeship/policy-acknowledgment"
            className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all group"
          >
            <div className="bg-purple-600 h-2" />
            <div className="p-4">
              <p className="font-semibold text-gray-900">Policy Forms</p>
              <p className="text-sm text-black">6 acknowledgments required</p>
            </div>
          </Link>
        </div>

        {/* Forms by Category */}
        {categories.map((cat) => {
          const catInfo = categoryLabels[cat];
          const catForms = REQUIRED_FORMS.filter(f => f.category === cat);
          if (catForms.length === 0) return null;

          return (
            <div key={cat} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${catInfo.color}`}>
                  <catInfo.icon className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{catInfo.label}</h3>
              </div>
              <div className="space-y-3">
                {catForms.map((form) => {
                  const isComplete = completedForms.has(form.id);
                  return (
                    <div
                      key={form.id}
                      className={`bg-white rounded-lg border p-4 flex items-start gap-4 ${isComplete ? 'border-brand-green-200 bg-brand-green-50/30' : ''}`}
                    >
                      <button
                        onClick={() => {
                          const next = new Set(completedForms);
                          if (next.has(form.id)) next.delete(form.id);
                          else next.add(form.id);
                          setCompletedForms(next);
                        }}
                        className="mt-0.5 flex-shrink-0"
                        aria-label={isComplete ? `Mark ${form.name} incomplete` : `Mark ${form.name} complete`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-6 h-6 text-brand-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-300" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold ${isComplete ? 'text-black line-through' : 'text-gray-900'}`}>
                            {form.name}
                          </h4>
                          {form.required && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Required</span>
                          )}
                        </div>
                        <p className="text-sm text-black mb-3">{form.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={form.href}
                            className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
                          >
                            {actionLabels[form.action]}
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          {form.downloadHref && (
                            <Link
                              href={form.downloadHref}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-sm font-medium text-black hover:text-gray-700"
                            >
                              <Download className="w-3 h-3" />
                              Preview
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Help */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 mb-1">Need Help?</h3>
              <p className="text-sm text-amber-800">
                If you have questions about any form or need assistance, contact our partnerships team
                at <a href="mailto:apprenticeships@elevateforhumanity.org" className="underline font-medium">apprenticeships@elevateforhumanity.org</a> or
                call <a href="tel:+13173143757" className="underline font-medium">(317) 314-3757</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Next Step */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">All forms ready?</h3>
            <p className="text-sm text-black">Sign the MOU to finalize your partnership.</p>
          </div>
          <Link
            href="/partners/cosmetology-apprenticeship/sign-mou"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 whitespace-nowrap"
          >
            Sign MOU <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
