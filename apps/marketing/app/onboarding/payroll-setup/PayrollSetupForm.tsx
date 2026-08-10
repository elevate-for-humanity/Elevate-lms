'use client';

import Link from 'next/link';
import { CheckCircle2, CircleDollarSign, ShieldCheck } from 'lucide-react';

type PayrollSetupFormProps = {
  user: { id: string; email?: string | null };
  profile: { id: string; full_name?: string | null; email?: string | null; role?: string | null };
  rateConfigs: Array<Record<string, unknown>>;
  existingProfile: { status?: string | null } | null;
};

export default function PayrollSetupForm({
  user,
  profile,
  rateConfigs,
  existingProfile,
}: PayrollSetupFormProps) {
  const status = existingProfile?.status ?? 'not_started';
  const hasConfiguredRate = rateConfigs.length > 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <CircleDollarSign className="h-10 w-10 text-emerald-700" />
          <h1 className="mt-4 text-3xl font-black">Payroll setup</h1>
          <p className="mt-2 text-slate-700">
            Payroll setup is tied to the authenticated account for {profile.full_name || profile.email || user.email || 'this user'}.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Role</p>
              <p className="mt-2 font-bold">{profile.role || 'Assigned during onboarding'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">Payroll status</p>
              <p className="mt-2 font-bold">{status.replaceAll('_', ' ')}</p>
            </div>
          </div>

          {status === 'complete' || status === 'verified' ? (
            <div className="mt-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">Payroll setup is complete.</p>
                <p className="mt-1 text-sm">Your verified payroll record is already on file.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">Sensitive payroll details are not collected on this public-facing screen.</p>
                <p className="mt-1 text-sm leading-6">
                  {hasConfiguredRate
                    ? 'Your compensation configuration is available. Continue through the secure onboarding workflow to finish payroll verification.'
                    : 'Your compensation record has not been configured yet. Staff must verify the payroll profile before onboarding is marked complete.'}
                </p>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/onboarding/start" className="rounded-xl bg-slate-950 px-5 py-3 text-center font-black text-white hover:bg-slate-800">
              Return to onboarding
            </Link>
            <Link href="/contact" className="rounded-xl border border-slate-300 px-5 py-3 text-center font-bold text-slate-900 hover:bg-slate-50">
              Contact onboarding staff
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
