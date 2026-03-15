'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, X, Circle } from 'lucide-react';

interface TrialBannerProps {
  expiresAt: Date;
  licenseId: string;
  tenantId: string;
  completedSteps?: string[];
  dismissible?: boolean;
}

const TRIAL_STEPS = [
  { id: 'oriented', label: 'You\'re in your live workspace', description: 'This is real — nothing is public until you launch' },
  { id: 'add_users', label: 'Add team members', description: 'Invite at least 1 admin and 1 user' },
  { id: 'create_program', label: 'Create a program', description: 'Set up your first training program' },
  { id: 'publish_course', label: 'Publish a course', description: 'Add content and publish' },
  { id: 'enroll_learner', label: 'Enroll a learner', description: 'Assign someone to your course' },
  { id: 'view_progress', label: 'View progress', description: 'Check the reports dashboard' },
];

export function TrialBanner({
  expiresAt,
  licenseId,
  tenantId,
  completedSteps = [],
  dismissible = true,
}: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  if (dismissed) return null;

  const now = new Date();
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 3;
  const isExpired = daysRemaining <= 0;

  const completedCount = completedSteps.length;
  const totalSteps = TRIAL_STEPS.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  // Format expiry date
  const expiryFormatted = expiresAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const bannerColor = isExpired
    ? 'bg-brand-red-50 border-brand-red-200'
    : isExpiringSoon
    ? 'bg-amber-50 border-amber-200'
    : 'bg-brand-blue-50 border-brand-blue-200';

  const textColor = isExpired
    ? 'text-brand-red-900'
    : isExpiringSoon
    ? 'text-amber-900'
    : 'text-brand-blue-900';

  const accentColor = isExpired
    ? 'text-brand-red-600'
    : isExpiringSoon
    ? 'text-amber-600'
    : 'text-brand-blue-600';

  const buttonColor = isExpired
    ? 'bg-brand-red-600 hover:bg-brand-red-700'
    : isExpiringSoon
    ? 'bg-amber-600 hover:bg-amber-700'
    : 'bg-brand-blue-600 hover:bg-brand-blue-700';

  return (
    <div className={`${bannerColor} border-b`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Trial info */}
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${accentColor}`} />
            <div>
              <p className={`font-semibold ${textColor}`}>
                {isExpired ? (
                  'Trial Expired'
                ) : (
                  <>
                    Trial ends {expiryFormatted}
                    <span className={`ml-2 ${accentColor}`}>
                      ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left)
                    </span>
                  </>
                )}
              </p>
              {!isExpired && (
                <button
                  onClick={() => setShowChecklist(!showChecklist)}
                  className={`text-sm ${accentColor} hover:underline`}
                >
                  {completedCount}/{totalSteps} setup steps complete
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={`/store/licenses/managed?reason=${isExpired ? 'expired' : 'upgrade'}&license_id=${licenseId}&tenant_id=${tenantId}`}
              className={`inline-flex items-center gap-2 ${buttonColor} text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors`}
            >
              {isExpired ? 'Subscribe Now' : 'Upgrade'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            {dismissible && !isExpired && (
              <button
                onClick={() => setDismissed(true)}
                className={`${accentColor} hover:opacity-70`}
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable checklist */}
        {showChecklist && !isExpired && (
          <div className="mt-4 pt-4 border-t border-current/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-semibold ${textColor}`}>Get the most from your trial</h4>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${buttonColor} transition-all`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className={`text-sm ${accentColor}`}>{progressPercent}%</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {TRIAL_STEPS.map((step) => {
                const isComplete = completedSteps.includes(step.id);
                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-2 p-2 rounded-lg ${
                      isComplete ? 'bg-brand-green-100/50' : 'bg-white/50'
                    }`}
                  >
                    {isComplete ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${isComplete ? 'text-brand-green-800' : textColor}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-600">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                href="/support/contact?subject=trial-onboarding"
                className={`text-sm ${accentColor} hover:underline`}
              >
                Schedule onboarding call
              </Link>
              <Link
                href="/support"
                className={`text-sm ${accentColor} hover:underline`}
              >
                View documentation
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for sidebar/header
 */
export function TrialBadge({
  expiresAt,
  licenseId,
}: {
  expiresAt: Date;
  licenseId: string;
}) {
  const now = new Date();
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 3;
  const isExpired = daysRemaining <= 0;

  const badgeColor = isExpired
    ? 'bg-brand-red-100 text-brand-red-800 border-brand-red-200'
    : isExpiringSoon
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-200';

  return (
    <Link
      href={`/store/licenses/managed?license_id=${licenseId}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor} hover:opacity-80 transition-opacity`}
    >
      <Clock className="w-3.5 h-3.5" />
      {isExpired ? 'Expired' : `${daysRemaining}d left`}
    </Link>
  );
}
