'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

/**
 * Trial Checklist for Organizations (Managed License Buyers)
 * 
 * Focus: Prove control + governance
 * - Domain/tenant isolation works
 * - User limits & roles work
 * - Features match expectations
 */

interface TrialStep {
  id: string;
  phase: 1 | 2 | 3;
  label: string;
  description: string;
  href?: string;
  icon: typeof Users;
  forSchools?: boolean;
  forOrgs?: boolean;
}

const TRIAL_STEPS: TrialStep[] = [
  // Phase 1: Foundation (Day 1)
  {
    id: 'confirm_org',
    phase: 1,
    label: 'Confirm organization details',
    description: 'Verify your organization name and primary contact',
    href: '/admin/settings/organization',
    icon: Settings,
    forSchools: true,
    forOrgs: true,
  },
  {
    id: 'add_admin',
    phase: 1,
    label: 'Add an admin user',
    description: 'Invite at least one additional administrator',
    href: '/admin/users/invite',
    icon: Shield,
    forSchools: true,
    forOrgs: true,
  },
  {
    id: 'add_user',
    phase: 1,
    label: 'Add a test user',
    description: 'Create a learner account to test the experience',
    href: '/admin/users/invite',
    icon: Users,
    forSchools: true,
    forOrgs: true,
  },
  {
    id: 'verify_roles',
    phase: 1,
    label: 'Verify role separation',
    description: 'Confirm admin vs learner permissions work correctly',
    href: '/admin/users',
    icon: Shield,
    forSchools: true,
    forOrgs: true,
  },

  // Phase 2A: Schools - Prove LMS works
  {
    id: 'create_program',
    phase: 2,
    label: 'Create a program',
    description: 'Set up your first training program with title and outcomes',
    href: '/admin/programs/new',
    icon: BookOpen,
    forSchools: true,
    forOrgs: false,
  },
  {
    id: 'add_course',
    phase: 2,
    label: 'Add a course',
    description: 'Create a course with 2-3 lessons (video, text, or files)',
    href: '/admin/courses/new',
    icon: BookOpen,
    forSchools: true,
    forOrgs: false,
  },
  {
    id: 'publish_course',
    phase: 2,
    label: 'Publish your course',
    description: 'Make your course available to learners',
    href: '/admin/courses',
    icon: Sparkles,
    forSchools: true,
    forOrgs: false,
  },
  {
    id: 'enroll_learner',
    phase: 2,
    label: 'Enroll a learner',
    description: 'Assign your test user to the course',
    href: '/admin/enrollments/new',
    icon: GraduationCap,
    forSchools: true,
    forOrgs: false,
  },
  {
    id: 'view_progress',
    phase: 2,
    label: 'View learner progress',
    description: 'Check the reports dashboard after learner activity',
    href: '/admin/reports',
    icon: BarChart3,
    forSchools: true,
    forOrgs: false,
  },

  // Phase 2B: Organizations - Prove control
  {
    id: 'test_roles',
    phase: 2,
    label: 'Test role permissions',
    description: 'Assign admin, instructor, and learner roles',
    href: '/admin/users',
    icon: Shield,
    forSchools: false,
    forOrgs: true,
  },
  {
    id: 'test_limits',
    phase: 2,
    label: 'Test user limits',
    description: 'Add users up to your trial limit to understand capacity',
    href: '/admin/users',
    icon: Users,
    forSchools: false,
    forOrgs: true,
  },
  {
    id: 'verify_branding',
    phase: 2,
    label: 'Verify branding',
    description: 'Check your organization branding and domain settings',
    href: '/admin/settings/branding',
    icon: Settings,
    forSchools: false,
    forOrgs: true,
  },
  {
    id: 'review_features',
    phase: 2,
    label: 'Review feature access',
    description: 'Confirm which features are available vs locked',
    href: '/admin/settings/license',
    icon: Shield,
    forSchools: false,
    forOrgs: true,
  },

  // Phase 3: Stress the edges
  {
    id: 'hit_limit',
    phase: 3,
    label: 'Test a limit',
    description: 'Try to exceed a limit to see the upgrade prompt',
    href: '/admin/users/invite',
    icon: Users,
    forSchools: true,
    forOrgs: true,
  },
  {
    id: 'view_upgrade',
    phase: 3,
    label: 'View upgrade options',
    description: 'Understand exactly what paying unlocks',
    href: '/store/licenses/managed',
    icon: ArrowRight,
    forSchools: true,
    forOrgs: true,
  },
];

const PHASE_LABELS = {
  1: { title: 'Foundation', subtitle: 'Day 1: Make it yours' },
  2: { title: 'Core Workflow', subtitle: 'Days 2-4: Prove the value' },
  3: { title: 'Ready to Commit', subtitle: 'Day 5+: Know what you\'re paying for' },
};

interface TrialChecklistProps {
  completedSteps: string[];
  orgType: 'school' | 'organization';
  onStepComplete?: (stepId: string) => void;
  collapsed?: boolean;
}

export function TrialChecklist({
  completedSteps,
  orgType,
  onStepComplete,
  collapsed: initialCollapsed = false,
}: TrialChecklistProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);

  // Filter steps by org type
  const relevantSteps = TRIAL_STEPS.filter((step) =>
    orgType === 'school' ? step.forSchools : step.forOrgs
  );

  const completedCount = relevantSteps.filter((s) => completedSteps.includes(s.id)).length;
  const totalSteps = relevantSteps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  // Group by phase
  const stepsByPhase = relevantSteps.reduce((acc, step) => {
    if (!acc[step.phase]) acc[step.phase] = [];
    acc[step.phase].push(step);
    return acc;
  }, {} as Record<number, TrialStep[]>);

  if (collapsed) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <button
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Trial Setup Progress</p>
              <p className="text-sm text-slate-600">
                {completedCount}/{totalSteps} steps complete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-blue-600 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-600">{progressPercent}%</span>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {orgType === 'school' ? 'School Setup Checklist' : 'Organization Setup Checklist'}
            </h3>
            <p className="text-brand-blue-100 text-sm mt-1">
              Complete these steps to get the most from your trial
            </p>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="text-brand-blue-200 hover:text-white"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-brand-blue-500/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-white font-semibold">{progressPercent}%</span>
        </div>
      </div>

      {/* Phases */}
      <div className="divide-y divide-slate-100">
        {([1, 2, 3] as const).map((phase) => {
          const phaseSteps = stepsByPhase[phase] || [];
          const phaseCompleted = phaseSteps.filter((s) => completedSteps.includes(s.id)).length;
          const phaseTotal = phaseSteps.length;
          const isExpanded = expandedPhase === phase;
          const phaseInfo = PHASE_LABELS[phase];

          return (
            <div key={phase}>
              <button
                onClick={() => setExpandedPhase(isExpanded ? null : phase)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      phaseCompleted === phaseTotal
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {phaseCompleted === phaseTotal ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      phase
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{phaseInfo.title}</p>
                    <p className="text-sm text-slate-500">{phaseInfo.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    {phaseCompleted}/{phaseTotal}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-4 space-y-2">
                  {phaseSteps.map((step) => {
                    const isComplete = completedSteps.includes(step.id);
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isComplete ? 'bg-green-50' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isComplete ? 'bg-green-200' : 'bg-white border border-slate-200'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-green-700" />
                          ) : (
                            <Icon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              isComplete ? 'text-green-800' : 'text-slate-900'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-sm text-slate-500">{step.description}</p>
                        </div>
                        {step.href && !isComplete && (
                          <Link
                            href={step.href}
                            className="flex-shrink-0 text-brand-blue-600 hover:text-brand-blue-800 text-sm font-medium"
                          >
                            Start →
                          </Link>
                        )}
                        {!isComplete && onStepComplete && (
                          <button
                            onClick={() => onStepComplete(step.id)}
                            className="flex-shrink-0 text-slate-400 hover:text-green-600 text-sm"
                            title="Mark as complete"
                          >
                            <Circle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <Link
            href="/support/contact?subject=trial-onboarding"
            className="text-sm text-brand-blue-600 hover:text-brand-blue-800 font-medium"
          >
            Need help? Schedule an onboarding call
          </Link>
          <Link
            href="/store/licenses/managed"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors"
          >
            View Upgrade Options
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
