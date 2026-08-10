'use client';

type OnboardingFlowProps = {
  user: { id: string; email?: string | null };
  profile: { id: string; full_name?: string | null; email?: string | null; role?: string | null };
  packet: { id: string; title?: string | null; description?: string | null };
  documents: Array<Record<string, unknown>>;
  signedDocumentIds: Set<string>;
  signedAtByDocId: Record<string, string>;
  payrollStatus: string | null;
};

export default function OnboardingFlow({
  user,
  profile,
  packet,
  documents,
  signedDocumentIds,
  payrollStatus,
}: OnboardingFlowProps) {
  const completed = documents.filter((document) => {
    const id = document.id;
    return typeof id === 'string' && signedDocumentIds.has(id);
  }).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand-blue-700">{profile.role || 'Onboarding'}</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">{packet.title || 'Complete your onboarding'}</h1>
        {packet.description ? <p className="mt-3 text-slate-700">{packet.description}</p> : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{completed}/{documents.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payroll</p>
            <p className="mt-1 font-bold text-slate-950">{payrollStatus || 'Not started'}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
            <p className="mt-1 truncate font-bold text-slate-950">{profile.full_name || profile.email || user.email || user.id}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
