'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { recordHandbookAcknowledgment, updateOnboardingProgress } from '@/lib/compliance/enforcement';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Users,
  Shield,
  Scale,
  MessageSquare,
} from 'lucide-react';

interface PolicySection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  keyPoints: string[];
  acknowledgmentField: keyof typeof defaultAcknowledgments;
}

const defaultAcknowledgments = {
  attendancePolicy: false,
  dressCode: false,
  conductPolicy: false,
  safetyPolicy: false,
  grievancePolicy: false,
};

const POLICY_SECTIONS: PolicySection[] = [
  {
    id: 'attendance',
    title: 'Attendance Policy',
    icon: Clock,
    description: 'Requirements for class attendance and punctuality',
    keyPoints: [
      'Students must maintain 80% minimum attendance',
      'Absences must be reported within 24 hours',
      'Three unexcused absences may result in probation',
      'Make-up work must be completed within one week',
      'Chronic tardiness (3+ per month) counts as absence',
    ],
    acknowledgmentField: 'attendancePolicy',
  },
  {
    id: 'dress-code',
    title: 'Dress Code',
    icon: Users,
    description: 'Professional appearance standards for training',
    keyPoints: [
      'Professional attire required during clinical/practical sessions',
      'Closed-toe shoes required in lab environments',
      'Program-specific uniforms must be worn when provided',
      'Personal protective equipment (PPE) required as specified',
      'No offensive or inappropriate clothing or accessories',
    ],
    acknowledgmentField: 'dressCode',
  },
  {
    id: 'conduct',
    title: 'Code of Conduct',
    icon: Shield,
    description: 'Expected behavior and professional standards',
    keyPoints: [
      'Treat all students, staff, and visitors with respect',
      'Academic integrity: no cheating, plagiarism, or fraud',
      'No harassment, discrimination, or bullying',
      'Maintain confidentiality of patient/client information',
      'No alcohol, drugs, or weapons on premises',
      'Follow all instructor directions and safety protocols',
    ],
    acknowledgmentField: 'conductPolicy',
  },
  {
    id: 'safety',
    title: 'Safety Policy',
    icon: Scale,
    description: 'Health and safety requirements',
    keyPoints: [
      'Report all injuries and incidents immediately',
      'Know emergency exit locations and procedures',
      'Follow all equipment safety guidelines',
      'Maintain clean and organized workspaces',
      'Report unsafe conditions to staff immediately',
      'Participate in required safety training',
    ],
    acknowledgmentField: 'safetyPolicy',
  },
  {
    id: 'grievance',
    title: 'Grievance Procedure',
    icon: MessageSquare,
    description: 'How to report concerns and resolve disputes',
    keyPoints: [
      'First attempt informal resolution with instructor',
      'Submit formal grievance in writing within 10 days',
      'Program Director will respond within 5 business days',
      'Appeal to Executive Director if unresolved',
      'No retaliation for good-faith complaints',
      'Confidentiality maintained throughout process',
    ],
    acknowledgmentField: 'grievancePolicy',
  },
];

const HANDBOOK_VERSION = '1.0';

export default function HandbookAcknowledgePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyAcknowledged, setAlreadyAcknowledged] = useState(false);

  const [acknowledgments, setAcknowledgments] = useState(defaultAcknowledgments);
  const [expandedSection, setExpandedSection] = useState<string | null>('attendance');

  useEffect(() => {
    const supabase = createClient();

    supabase?.auth.getUser().then(async ({ data, error }) => {
      if (error || !data?.user) {
        router.push('/login?next=/student-portal/handbook/acknowledge');
        return;
      }

      setUser(data.user);

      // Check if already acknowledged
      const { data: existing } = await supabase
        .from('handbook_acknowledgments')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      if (existing) {
        setAlreadyAcknowledged(true);
      }

      setLoading(false);
    });
  }, [router]);

  const allAcknowledged = Object.values(acknowledgments).every(Boolean);

  const handleAcknowledge = (field: keyof typeof acknowledgments) => {
    setAcknowledgments((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async () => {
    if (!allAcknowledged || !user) {
      setError('Please acknowledge all policy sections');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await recordHandbookAcknowledgment({
        userId: user.id,
        handbookVersion: HANDBOOK_VERSION,
        acknowledgments,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to record acknowledgment');
      }

      // Update onboarding progress
      await updateOnboardingProgress(user.id, 'handbook', true);

      setSuccess(true);

      // Redirect after delay
      setTimeout(() => {
        router.push('/student-portal/onboarding');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading handbook...</p>
        </div>
      </div>
    );
  }

  if (alreadyAcknowledged) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Handbook Already Acknowledged
            </h1>
            <p className="text-slate-600 mb-6">
              You have already acknowledged the student handbook.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/student-portal/handbook"
                className="text-blue-600 hover:underline"
              >
                View Handbook
              </Link>
              <Link
                href="/student-portal/onboarding"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue Onboarding
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Handbook Acknowledged
            </h1>
            <p className="text-slate-600 mb-4">
              Thank you for acknowledging the student handbook policies.
            </p>
            <p className="text-sm text-slate-500">Redirecting to onboarding...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/student-portal/onboarding"
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Onboarding
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Student Handbook Acknowledgment
              </h1>
              <p className="text-slate-600 mt-1">
                Please review each policy section and confirm your understanding.
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Version {HANDBOOK_VERSION} • Effective January 1, 2026
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Acknowledgment Progress
            </span>
            <span className="text-sm text-slate-500">
              {Object.values(acknowledgments).filter(Boolean).length} of{' '}
              {POLICY_SECTIONS.length} sections
            </span>
          </div>
          <div className="flex gap-2">
            {POLICY_SECTIONS.map((section) => (
              <div
                key={section.id}
                className={`flex-1 h-2 rounded-full ${
                  acknowledgments[section.acknowledgmentField]
                    ? 'bg-green-500'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Policy Sections */}
        <div className="space-y-4 mb-8">
          {POLICY_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;
            const isAcknowledged = acknowledgments[section.acknowledgmentField];

            return (
              <div
                key={section.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 transition-colors ${
                  isAcknowledged ? 'border-green-500' : 'border-transparent'
                }`}
              >
                {/* Section Header */}
                <button
                  onClick={() =>
                    setExpandedSection(isExpanded ? null : section.id)
                  }
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isAcknowledged ? 'bg-green-100' : 'bg-slate-100'
                    }`}
                  >
                    {isAcknowledged ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Icon className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">
                      {section.title}
                    </h3>
                    <p className="text-sm text-slate-500">{section.description}</p>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <div className="pt-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">
                        Key Points:
                      </h4>
                      <ul className="space-y-2 mb-4">
                        {section.keyPoints.map((point, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-slate-600"
                          >
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>

                      {/* Acknowledgment Checkbox */}
                      <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={isAcknowledged}
                          onChange={() =>
                            handleAcknowledge(section.acknowledgmentField)
                          }
                          className="mt-1 w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-slate-700">
                          I have read and understand the{' '}
                          <strong>{section.title}</strong>. I agree to comply with
                          these requirements.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final Acknowledgment */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Final Acknowledgment
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            By submitting this acknowledgment, I confirm that I have read and
            understand all sections of the Student Handbook. I agree to abide by
            all policies and procedures outlined therein. I understand that
            violation of these policies may result in disciplinary action, up to
            and including dismissal from the program.
          </p>
          <p className="text-xs text-slate-500">
            This acknowledgment will be recorded with your user ID, timestamp, and
            IP address for compliance purposes.
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!allAcknowledged || submitting}
          className={`w-full py-4 px-6 rounded-xl font-medium text-lg transition-colors ${
            allAcknowledged && !submitting
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </span>
          ) : allAcknowledged ? (
            'Submit Handbook Acknowledgment'
          ) : (
            `Acknowledge All ${POLICY_SECTIONS.length} Sections to Continue`
          )}
        </button>
      </div>
    </div>
  );
}
