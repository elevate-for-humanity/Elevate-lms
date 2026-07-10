'use client';

import { useEffect, useState } from 'react';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import Link from 'next/link';
import { CheckCircle, Clock, AlertCircle, ArrowRight, FileText, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type ApplicationData = {
  fullName: string;
  email: string;
  programInterest: string | null;
  stage: string;
  stageLabel: string;
  createdAt: string;
  updatedAt: string;
};

type StatusResponse = {
  success: boolean;
  application?: ApplicationData;
  error?: string;
};

const STAGE_HELP: Record<string, { message: string; action?: string; actionUrl?: string }> = {
  submitted: {
    message: 'We received your application. An advisor will review it shortly.',
  },
  advisor_review: {
    message: 'An advisor is reviewing your intake and determining next steps.',
  },
  needs_icc: {
    message: 'You need an Indiana Career Connect account before funding can move forward.',
    action: 'Create your account at IndianaCareerConnect.com',
    actionUrl: 'https://www.indianacareerconnect.com',
  },
  needs_workone: {
    message: 'You need a WorkOne appointment to continue the funding process.',
    action: 'Find your nearest WorkOne center',
    actionUrl: 'https://www.in.gov/dwd/workone/',
  },
  funding_review: {
    message: 'Your funding eligibility is under review. We will contact you with results.',
  },
  approved: {
    message: 'Your application has been approved. Check your email for enrollment instructions.',
  },
  enrolled: {
    message: 'You are enrolled and ready for training.',
    action: 'Go to your learning dashboard',
    actionUrl: '/learner/dashboard',
  },
  closed: {
    message: 'This application is closed. Contact us if you have questions.',
  },
};

const STAGE_ORDER = [
  'submitted',
  'advisor_review',
  'needs_icc',
  'needs_workone',
  'funding_review',
  'approved',
  'enrolled',
];

function StageIcon({ stage }: { stage: string }) {
  if (stage === 'approved' || stage === 'enrolled') {
    return <CheckCircle className="h-5 w-5 text-brand-green-600" />;
  }
  if (stage === 'closed') {
    return <AlertCircle className="h-5 w-5 text-slate-700" />;
  }
  if (stage === 'needs_icc' || stage === 'needs_workone') {
    return <AlertCircle className="h-5 w-5 text-amber-500" />;
  }
  return <Clock className="h-5 w-5 text-brand-blue-600" />;
}

function StatusContent() {
  const params = useSafeSearchParams();
  const token = params.get('token');

  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) {
        setData({
          success: false,
          error: 'Missing status token. Check the link in your confirmation email.',
        });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/intake/status?token=${encodeURIComponent(token)}`);
        const json = (await res.json()) as StatusResponse;
        setData(json);
      } catch {
        setData({ success: false, error: 'Unable to load application status.' });
      }
      setLoading(false);
    }

    void load();
  }, [token]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (!data?.success || !data.application) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Application Status</h1>
        <div className="mt-6 rounded-2xl border border-brand-red-200 bg-brand-red-50 p-5 text-brand-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Unable to find your application</p>
              <p className="mt-1 text-sm">
                {data?.error || 'Please check the link in your confirmation email.'}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Link href="/start" className="font-medium text-brand-blue-600 hover:underline">
            Start a new application &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const app = data.application;
  const stageInfo = STAGE_HELP[app.stage] || { message: 'Your application is being processed.' };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Application Status</h1>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Applicant info */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-slate-700">Applicant</div>
            <div className="text-2xl font-semibold text-slate-900">{app.fullName}</div>
          </div>
          <StageIcon stage={app.stage} />
        </div>

        {/* Current stage */}
        <div className="mt-6 rounded-2xl bg-white p-5">
          <div className="text-sm font-medium text-slate-700">Current stage</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{app.stageLabel}</div>
          <p className="mt-2 text-slate-900">{stageInfo.message}</p>

          {stageInfo.action && stageInfo.actionUrl && (
            <a
              href={stageInfo.actionUrl}
              target={stageInfo.actionUrl.startsWith('http') ? '_blank' : undefined}
              rel={stageInfo.actionUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-blue-700"
            >
              {stageInfo.action} <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Details grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <FileText className="h-4 w-4" /> Program
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {app.programInterest || 'Not specified'}
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="h-4 w-4" /> Submitted
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {new Date(app.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="h-4 w-4" /> Last updated
            </div>
            <div className="mt-1 font-medium text-slate-900">
              {new Date(app.updatedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
            </div>
          </div>
        </div>
      </div>

      {/* Help section */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="font-medium text-slate-900">Questions about your application?</p>
        <p className="mt-1 text-sm text-slate-700">
          Call{' '}
          <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="font-medium text-brand-blue-600 hover:underline">
            {PLATFORM_DEFAULTS.supportPhone}
          </a>{' '}
          or email{' '}
          <a
            href="mailto:info@elevateforhumanity.org"
            className="font-medium text-brand-blue-600 hover:underline"
          >
            info@elevateforhumanity.org
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ApplicationStatusPage() {
  return (
          <StatusContent />
  );
}
