'use client';

type PayrollSetupFormProps = {
  user: { id: string; email?: string | null };
  profile: { id: string; full_name?: string | null; email?: string | null; role?: string | null };
  rateConfigs: unknown[];
  existingProfile: unknown | null;
};

export default function PayrollSetupForm({ user, profile }: PayrollSetupFormProps) {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">Payroll setup</h1>
      <p className="mt-2 text-slate-700">
        Payroll setup is tied to {profile.full_name || profile.email || user.email || 'your account'}.
      </p>
      <p className="mt-4 text-sm text-slate-600">
        Your payroll profile will appear here when compensation details are assigned by an authorized administrator.
      </p>
    </section>
  );
}
