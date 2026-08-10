'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, FileSignature, Landmark, UserRoundCheck } from 'lucide-react';

type OnboardingFlowProps = {
  user: { id: string; email?: string | null };
  profile: { id: string; full_name?: string | null; email?: string | null; role?: string | null };
  packet: { id: string; title?: string | null; description?: string | null };
  documents: Array<{ id?: string; title?: string | null; name?: string | null; description?: string | null; slug?: string | null }>;
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
  signedAtByDocId,
  payrollStatus,
}: OnboardingFlowProps) {
  const signedCount = documents.filter((doc) => doc.id && signedDocumentIds.has(doc.id)).length;
  const documentsComplete = documents.length === 0 || signedCount === documents.length;
  const payrollComplete = ['complete', 'verified', 'approved'].includes(payrollStatus ?? '');

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Secure onboarding</p>
          <h1 className="mt-3 text-3xl font-black">{packet.title || 'Complete your onboarding'}</h1>
          <p className="mt-3 max-w-3xl text-slate-200">
            {packet.description || `Finish the required setup for ${profile.full_name || profile.email || user.email || 'your account'}.`}
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <UserRoundCheck className="h-7 w-7 text-blue-700" />
            <p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-600">Account</p>
            <h2 className="mt-1 text-lg font-black">Identity confirmed</h2>
            <p className="mt-2 text-sm text-slate-700">Role: {profile.role || 'pending assignment'}</p>
            <CheckCircle2 className="mt-4 h-5 w-5 text-emerald-700" />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <FileSignature className="h-7 w-7 text-blue-700" />
            <p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-600">Documents</p>
            <h2 className="mt-1 text-lg font-black">{signedCount} of {documents.length} signed</h2>
            <p className="mt-2 text-sm text-slate-700">Required agreements are tracked against your authenticated account.</p>
            {documentsComplete ? <CheckCircle2 className="mt-4 h-5 w-5 text-emerald-700" /> : <Circle className="mt-4 h-5 w-5 text-amber-600" />}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <Landmark className="h-7 w-7 text-blue-700" />
            <p className="mt-4 text-sm font-black uppercase tracking-wide text-slate-600">Payroll</p>
            <h2 className="mt-1 text-lg font-black">{payrollComplete ? 'Verified' : 'Needs completion'}</h2>
            <p className="mt-2 text-sm text-slate-700">Sensitive payroll information stays in the secure onboarding workflow.</p>
            {payrollComplete ? <CheckCircle2 className="mt-4 h-5 w-5 text-emerald-700" /> : <Circle className="mt-4 h-5 w-5 text-amber-600" />}
          </section>
        </div>

        {documents.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-black">Required agreements</h2>
            <div className="mt-4 divide-y divide-slate-200">
              {documents.map((doc, index) => {
                const id = doc.id ?? `document-${index}`;
                const signed = Boolean(doc.id && signedDocumentIds.has(doc.id));
                return (
                  <div key={id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">{doc.title || doc.name || `Onboarding document ${index + 1}`}</p>
                      {doc.description ? <p className="mt-1 text-sm text-slate-600">{doc.description}</p> : null}
                      {signed && doc.id && signedAtByDocId[doc.id] ? (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">Signed {new Date(signedAtByDocId[doc.id]).toLocaleString()}</p>
                      ) : null}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${signed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                      {signed ? 'Signed' : 'Required'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!documentsComplete ? (
            <Link href="/onboarding/legal" className="rounded-xl bg-blue-700 px-5 py-3 text-center font-black text-white hover:bg-blue-800">
              Review required agreements
            </Link>
          ) : null}
          {!payrollComplete ? (
            <Link href="/onboarding/payroll-setup" className="rounded-xl bg-slate-950 px-5 py-3 text-center font-black text-white hover:bg-slate-800">
              Continue payroll setup
            </Link>
          ) : null}
          {documentsComplete && payrollComplete ? (
            <Link href="/onboarding/learner" className="rounded-xl bg-emerald-700 px-5 py-3 text-center font-black text-white hover:bg-emerald-800">
              Continue onboarding
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
