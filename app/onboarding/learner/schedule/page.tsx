'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ArrowRight, CheckCircle, Calendar, Sun, Moon } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type SchedulePreference = 'day' | 'evening' | 'weekend' | 'flexible';

interface CohortOption {
  id: string;
  label: string;
  startDate: string;
  spotsLeft: number;
  scheduleType: SchedulePreference;
  days: string;
  time: string;
}

// Cohort options — these are representative; actual availability is managed by admissions.
const COHORT_OPTIONS: CohortOption[] = [
  {
    id: 'cohort-day-next',
    label: 'Next Day Cohort',
    startDate: 'Rolling — contact admissions for next start date',
    spotsLeft: 5,
    scheduleType: 'day',
    days: 'Monday – Friday',
    time: '8:00 AM – 4:00 PM',
  },
  {
    id: 'cohort-evening-next',
    label: 'Next Evening Cohort',
    startDate: 'Rolling — contact admissions for next start date',
    spotsLeft: 8,
    scheduleType: 'evening',
    days: 'Monday – Thursday',
    time: '5:00 PM – 9:00 PM',
  },
  {
    id: 'cohort-weekend',
    label: 'Weekend Cohort',
    startDate: 'Rolling — contact admissions for next start date',
    spotsLeft: 6,
    scheduleType: 'weekend',
    days: 'Saturday & Sunday',
    time: '9:00 AM – 5:00 PM',
  },
];

const SCHEDULE_ICONS: Record<SchedulePreference, React.ElementType> = {
  day: Sun,
  evening: Moon,
  weekend: Calendar,
  flexible: Calendar,
};

export default function SchedulePage() {
  const router = useRouter();
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [preference, setPreference] = useState<SchedulePreference | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [alreadySelected, setAlreadySelected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login?redirect=/onboarding/learner/schedule'); return; }
      supabase
        .from('profiles')
        .select('schedule_selected, schedule_preference')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.schedule_selected) {
            setAlreadySelected(true);
            if (data.schedule_preference) {
              setPreference(data.schedule_preference as SchedulePreference);
            }
          }
        });
    });
  }, [router]);

  const handleConfirm = async () => {
    if (!selectedCohort || !preference) {
      setError('Please select a schedule option.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const cohort = COHORT_OPTIONS.find((c) => c.id === selectedCohort);
      const res = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'schedule',
          data: {
            schedule_preference: preference,
            cohort_id: selectedCohort,
            cohort_label: cohort?.label,
            cohort_days: cohort?.days,
            cohort_time: cohort?.time,
          },
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Failed to save');
      }
      router.push('/onboarding/learner?step=schedule');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Onboarding', href: '/onboarding/learner' },
          { label: 'Select Your Schedule' },
        ]}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/onboarding/learner"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>

        <div className="mb-8">
          <p className="text-brand-blue-600 text-sm font-semibold uppercase tracking-wider mb-1">
            Step 4 of 7
          </p>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Select Your Schedule</h1>
          <p className="text-slate-500">
            Choose the cohort that fits your availability. Our admissions team will confirm your
            spot and send you a start date.
          </p>
        </div>

        {alreadySelected && (
          <div className="flex items-center gap-2 bg-brand-green-50 border border-brand-green-200 rounded-xl px-4 py-3 mb-6 text-brand-green-800 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Schedule preference already saved. You can update it below.
          </div>
        )}

        <div className="space-y-3 mb-8">
          {COHORT_OPTIONS.map((cohort) => {
            const Icon = SCHEDULE_ICONS[cohort.scheduleType];
            const isSelected = selectedCohort === cohort.id;
            return (
              <button
                key={cohort.id}
                onClick={() => {
                  setSelectedCohort(cohort.id);
                  setPreference(cohort.scheduleType);
                  setError('');
                }}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-brand-blue-600 bg-brand-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${isSelected ? 'bg-brand-blue-100' : 'bg-slate-100'}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-blue-600' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold text-sm ${isSelected ? 'text-brand-blue-700' : 'text-slate-800'}`}>
                        {cohort.label}
                      </span>
                      <span className="text-xs text-slate-400">{cohort.spotsLeft} spots left</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{cohort.days} · {cohort.time}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cohort.startDate}</p>
                  </div>
                  <div className={`mt-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    isSelected ? 'border-brand-blue-600 bg-brand-blue-600' : 'border-slate-300'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
          <strong>Note:</strong> Selecting a schedule here is a preference — not a confirmed
          enrollment. Our admissions team will contact you within 1 business day to confirm your
          spot and provide your official start date.
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={saving || !selectedCohort}
            className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition"
          >
            {saving ? 'Saving…' : 'Confirm Schedule Preference'}
            {!saving && <ArrowRight className="w-4 h-4" />}
          </button>
          <Link href="/onboarding/learner" className="text-sm text-slate-500 hover:text-slate-700">
            Skip for now
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Need a custom schedule?{' '}
          <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="underline">Call {PLATFORM_DEFAULTS.supportPhone}</a> to discuss options.
        </p>
      </div>
    </div>
  );
}
