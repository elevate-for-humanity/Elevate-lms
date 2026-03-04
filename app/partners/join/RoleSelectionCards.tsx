"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, DollarSign, FileText, AlertCircle } from 'lucide-react';

interface RoleSelectionCardsProps {
  rolePackages: any[];
  userId: string;
}

export default function RoleSelectionCards({
  rolePackages,
  userId,
}: RoleSelectionCardsProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSelectRole = async (role: string) => {
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/partners/select-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to select role');
      }

      router.push('/partner/onboarding');
    } catch (err: any) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  // Default role data if not in database yet
  const defaultRoles = [
    {
      role: 'PROGRAM_HOLDER',
      title: 'Program Holder',
      subtitle: 'Full Program Oversight',
      description:
        "You operate the program delivery at a location under Elevate's compliance framework (you're accountable for reporting + outcomes).",
      pay_model_type: 'PERCENTAGE',
      default_rate: 20,
      min_rate: 18,
      max_rate: 22,
      responsibilities: [
        'Maintain program compliance at site',
        'Ensure student documentation completion',
        'Approve/verify progress checkpoints',
        'Ensure attendance reporting is accurate',
        'Coordinate with Site Coordinator and Worksite',
        'Submit monthly outcome updates (completion, placement)',
      ],
      can_do: [
        'View all students in your program',
        'Bulk message students',
        'Schedule emails/texts',
        'Run progress reports',
        'Approve milestone progress',
      ],
      cannot_do: [
        'Change pricing/funding rules',
        'Move students across programs without admin approval',
        'Issue "funding approvals" promises',
      ],
      requirements: [
        'U.S. DOL Registered Apprenticeship Program',
        'Business license',
        'Liability insurance',
        'Background check clearance',
      ],
    },
    {
      role: 'WORKSITE_ONLY',
      title: 'Worksite Only',
      subtitle: 'Hands-On Site / Works Item',
      description:
        'You only host hands-on hours (no enrollment, no funding decisions).',
      pay_model_type: 'PERCENTAGE',
      default_rate: 10,
      min_rate: 8,
      max_rate: 12,
      responsibilities: [
        'Provide supervised hands-on training only',
        'Submit weekly hour logs',
        'Confirm attendance for hands-on sessions',
        'Report concerns (no-shows, behavior, safety)',
        'Allow audits/visits as required',
      ],
      can_do: [
        'See assigned students only',
        'Submit hours + attendance',
        'Send messages to assigned students',
        'Receive no-login/no-show alerts',
      ],
      cannot_do: [
        'Enroll students',
        'Collect tuition',
        'Teach theory unless approved',
        'Alter curriculum',
      ],
      requirements: [
        'Business license',
        'Liability insurance',
        'Licensed supervisor on staff',
        'Background check clearance',
      ],
    },
    {
      role: 'SITE_COORDINATOR',
      title: 'Site Coordinator',
      subtitle: 'Operations + Reporting',
      description:
        'You are the daily operator verifying attendance, check-ins, documents, and student support.',
      pay_model_type: 'FLAT',
      default_rate: 500,
      min_rate: 400,
      max_rate: 750,
      responsibilities: [
        'Verify attendance/check-ins weekly',
        'Track document completion status',
        'Escalate at-risk students (no-login/no-attendance)',
        'Coordinate outreach (email/text/calls)',
        'Maintain monthly compliance checklist',
      ],
      can_do: [
        'See assigned students',
        'Schedule bulk emails/texts',
        'Trigger alerts/escalations',
        'Approve "ready for next step" checkpoints',
      ],
      cannot_do: [
        'Change pay rules',
        'Approve funding',
        'Override admin decisions',
      ],
      requirements: [
        'Background check clearance',
        'FERPA confidentiality training',
        'Reliable internet access',
        'Available during business hours',
      ],
    },
  ];

  const roles = rolePackages.length > 0 ? rolePackages : defaultRoles;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((roleData) => (
          <div
            key={roleData.role}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
              selectedRole === roleData.role
                ? 'border-brand-blue-600 shadow-lg'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-black mb-1">
                {roleData.title}
              </h3>
              <p className="text-sm text-brand-blue-600 font-medium mb-3">
                {roleData.subtitle}
              </p>
              <p className="text-black text-sm">{roleData.description}</p>
            </div>

            {/* Pay Model */}
            <div className="p-6 bg-brand-green-50 border-b border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-brand-green-600" />
                <span className="font-semibold text-black">Pay Model</span>
              </div>
              <p className="text-2xl font-bold text-brand-green-700">
                {roleData.pay_model_type === 'PERCENTAGE'
                  ? `${roleData.min_rate}–${roleData.max_rate}%`
                  : `$${roleData.min_rate}–$${roleData.max_rate}`}
              </p>
              <p className="text-sm text-black mt-1">
                {roleData.pay_model_type === 'PERCENTAGE'
                  ? 'of eligible program tuition disbursement'
                  : 'per cohort/month (flat rate)'}
              </p>
            </div>

            {/* Responsibilities */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-brand-blue-600" />
                <span className="font-semibold text-black">
                  Responsibilities
                </span>
              </div>
              <ul className="space-y-2">
                {roleData.responsibilities.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-black"
                  >
                    <span className="text-brand-blue-600 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What You Can Do */}
            <div className="p-6 border-b border-slate-200">
              <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-brand-green-600" />
                What You Can Do
              </h4>
              <ul className="space-y-2">
                {roleData.can_do.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-black"
                  >
                    <Check className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What You Cannot Do */}
            <div className="p-6 border-b border-slate-200">
              <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                <X className="w-5 h-5 text-brand-orange-600" />
                What You Cannot Do
              </h4>
              <ul className="space-y-2">
                {roleData.cannot_do.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-black"
                  >
                    <X className="w-4 h-4 text-brand-orange-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="p-6 border-b border-slate-200">
              <h4 className="font-semibold text-black mb-3">
                Requirements
              </h4>
              <ul className="space-y-2">
                {roleData.requirements.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-black"
                  >
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Select Button */}
            <div className="p-6">
              <button
                onClick={() => handleSelectRole(roleData.role)}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Processing...' : 'Select This Role'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
