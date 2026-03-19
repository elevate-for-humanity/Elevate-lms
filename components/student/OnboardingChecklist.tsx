import { Clock } from 'lucide-react';
import Link from 'next/link';

interface OnboardingData {
  handbook_reviewed: boolean;
  milady_orientation_completed: boolean;
  ai_instructor_met: boolean;
  shop_placed: boolean;
  handbook_reviewed_at?: string;
  milady_orientation_completed_at?: string;
  ai_instructor_met_at?: string;
  shop_placed_at?: string;
}

interface OnboardingChecklistProps {
  onboarding: OnboardingData;
}

function OnboardingItem({
  done,
  label,
  action,
  href,
}: {
  done: boolean;
  label: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        {done ? (
          <span className="text-slate-400 flex-shrink-0">•</span>
        ) : (
          <Clock className="w-5 h-5 text-slate-400" />
        )}
        <span
          className={done ? 'text-black font-medium' : 'text-black'}
        >
          {label}
        </span>
      </div>
      {!done && action && href && (
        <Link
          href={href}
          className="px-3 py-2 text-sm font-semibold text-brand-orange-600 hover:text-brand-orange-700 hover:bg-brand-orange-50 rounded-lg transition"
        >
          {action}
        </Link>
      )}
      {done && (
        <span className="text-xs text-brand-green-600 font-semibold">Complete</span>
      )}
    </div>
  );
}

export function OnboardingChecklist({ onboarding }: OnboardingChecklistProps) {
  const allComplete =
    onboarding.handbook_reviewed &&
    onboarding.milady_orientation_completed &&
    onboarding.ai_instructor_met &&
    onboarding.shop_placed;

  const completedCount = [
    onboarding.handbook_reviewed,
    onboarding.milady_orientation_completed,
    onboarding.ai_instructor_met,
    onboarding.shop_placed,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-black mb-1">
              Program Onboarding
            </h2>
            <p className="text-sm text-black">
              Complete these steps to begin your apprenticeship
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-brand-blue-600">
              {completedCount}/4
            </div>
            <div className="text-xs text-black">Steps Complete</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {allComplete ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              Onboarding Complete!
            </h3>
            <p className="text-black">
              You're ready to begin your apprenticeship training.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            <OnboardingItem
              done={onboarding.handbook_reviewed}
              label="Review Student Handbook"
              action="Review"
              href="/student/handbook"
            />
            <OnboardingItem
              done={onboarding.milady_orientation_completed}
              label="Complete Milady Orientation"
              action="Start"
              href="/lms/dashboard"
            />
            <OnboardingItem
              done={onboarding.ai_instructor_met}
              label="Meet with AI Instructor"
              action="Chat"
              href="/student/chat"
            />
            <OnboardingItem
              done={onboarding.shop_placed}
              label="Get Shop Placement"
              action={undefined}
              href={undefined}
            />
          </div>
        )}
      </div>

      {!allComplete && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-black">
            <strong>Note:</strong> Shop placement will be assigned by your
            program coordinator once you complete the first three steps.
          </p>
        </div>
      )}
    </div>
  );
}
