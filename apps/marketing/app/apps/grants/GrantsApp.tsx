'use client';

import Link from 'next/link';
import { CalendarDays, FileText, Search, Bookmark, Sparkles } from 'lucide-react';
import { ContextAwareAdvisor } from '@/components/apps/ContextAwareAdvisor';

type Row = Record<string, any>;

type GrantsSetupContext = {
  organization?: string;
  purpose?: string;
  amount?: string;
  geography?: string;
};

interface Props {
  user: { id: string; email?: string | null };
  subscription: Row;
  opportunities: Row[];
  savedGrants: Row[];
  applications: Row[];
  trialDaysRemaining: number;
  setupContext?: GrantsSetupContext | null;
}

function opportunityName(row: Row): string {
  return row.title || row.opportunity_title || row.name || row.opportunity_number || 'Grant opportunity';
}

function deadlineLabel(value: unknown): string {
  if (!value) return 'Deadline not listed';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

export function GrantsApp({ subscription, opportunities, savedGrants, applications, trialDaysRemaining, setupContext }: Props) {
  const setupEntries = setupContext ? Object.entries(setupContext).filter(([, value]) => Boolean(value)) : [];

  return (
    <main className="bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-red-700">Elevate Apps</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Grants Discovery & Management</h1>
            <p className="mt-2 max-w-3xl text-slate-600">Review open opportunities, saved grants, and application activity from the records available to your account.</p>
          </div>
          <Link href="/store/apps/grants" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700">Plans & billing</Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 ring-1 ring-slate-200">Plan: {subscription.plan || 'starter'}</span>
          <span className="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 ring-1 ring-slate-200">Status: {subscription.status || 'unknown'}</span>
          {subscription.status === 'trial' && <span className="rounded-full bg-amber-50 px-4 py-2 font-semibold text-amber-800 ring-1 ring-amber-200">{Math.max(0, trialDaysRemaining)} trial days remaining</span>}
        </div>

        {setupEntries.length > 0 && (
          <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-2 text-emerald-900"><Sparkles className="h-5 w-5" /><h2 className="font-black">Guided discovery context</h2></div>
            <p className="mt-2 text-sm leading-6 text-emerald-900">Your plain-English funding answers were carried into this workspace. They are also passed into the AI advisor as user-provided context; opportunity availability still depends on verified records and feeds available to Elevate.</p>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              {setupEntries.map(([key, value]) => <div key={key} className="rounded-xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-slate-500">{key}</dt><dd className="mt-1 text-sm text-slate-900">{value}</dd></div>)}
            </dl>
          </section>
        )}

        <ContextAwareAdvisor appSlug="grants" context={setupContext} />

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat icon={Search} label="Open opportunities" value={opportunities.length} />
          <Stat icon={Bookmark} label="Saved grants" value={savedGrants.length} />
          <Stat icon={FileText} label="Applications" value={applications.length} />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Open opportunities</h2>
              <p className="mt-1 text-sm text-slate-600">Showing up to 50 open records currently available in the grants database.</p>
            </div>
          </div>
          {opportunities.length === 0 ? (
            <div className="p-10 text-center text-slate-600">No open grant opportunities are currently loaded for this workspace.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {opportunities.map((grant, index) => (
                <article key={grant.id || index} className="grid gap-3 p-6 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">{opportunityName(grant)}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{grant.description || grant.summary || grant.agency || 'Opportunity details available in the record.'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <CalendarDays className="h-4 w-4" />
                    {deadlineLabel(grant.deadline)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Saved grants</h2>
            {savedGrants.length === 0 ? <p className="mt-4 text-sm text-slate-600">No saved grants yet.</p> : (
              <ul className="mt-4 space-y-3">
                {savedGrants.slice(0, 10).map((saved, index) => (
                  <li key={saved.id || index} className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-800">{opportunityName(saved.grant || saved)}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Applications</h2>
            {applications.length === 0 ? <p className="mt-4 text-sm text-slate-600">No grant applications have been created in this workspace yet.</p> : (
              <ul className="mt-4 space-y-3">
                {applications.slice(0, 10).map((application, index) => (
                  <li key={application.id || index} className="rounded-xl bg-slate-50 p-4">
                    <div className="font-semibold text-slate-900">{application.title || application.grant_name || application.opportunity_title || 'Grant application'}</div>
                    <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{application.status || 'draft'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-brand-red-700" /><div className="mt-3 text-3xl font-black text-slate-900">{value}</div><div className="text-sm text-slate-600">{label}</div></div>;
}

export default GrantsApp;
