'use client';

import Link from 'next/link';
import { Building2, Bell, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { ContextAwareAdvisor } from '@/components/apps/ContextAwareAdvisor';

type Row = Record<string, any>;

type SamSetupContext = {
  entity?: string;
  status?: string;
  goal?: string;
  team?: string;
};

interface Props {
  user: { id: string; email?: string | null };
  subscription: Row;
  entities: Row[];
  documents: Row[];
  alerts: Row[];
  trialDaysRemaining: number;
  setupContext?: SamSetupContext | null;
}

function entityName(entity: Row): string {
  return entity.legal_business_name || entity.entity_name || entity.name || entity.uei || 'Entity';
}

export function SamGovApp({ subscription, entities, documents, alerts, trialDaysRemaining, setupContext }: Props) {
  const setupEntries = setupContext ? Object.entries(setupContext).filter(([, value]) => Boolean(value)) : [];

  return (
    <main className="bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-red-700">Elevate Apps</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">SAM.gov Manager</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Organize entity registration records, supporting documents, and compliance reminders. Final federal registration and submission remain on SAM.gov.
            </p>
          </div>
          <Link href="/store/apps/sam-gov" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700">Plans & billing</Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 ring-1 ring-slate-200">Plan: {subscription.plan || 'starter'}</span>
          <span className="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 ring-1 ring-slate-200">Status: {subscription.status || 'unknown'}</span>
          {subscription.status === 'trial' && <span className="rounded-full bg-amber-50 px-4 py-2 font-semibold text-amber-800 ring-1 ring-amber-200">{Math.max(0, trialDaysRemaining)} trial days remaining</span>}
        </div>

        {setupEntries.length > 0 && (
          <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-2 text-emerald-900"><Sparkles className="h-5 w-5" /><h2 className="font-black">Guided setup context</h2></div>
            <p className="mt-2 text-sm leading-6 text-emerald-900">Your plain-English setup answers were carried into this workspace and are passed into the AI advisor as user-provided context. Official SAM.gov records remain the source of truth.</p>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              {setupEntries.map(([key, value]) => <div key={key} className="rounded-xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-slate-500">{key}</dt><dd className="mt-1 text-sm text-slate-900">{value}</dd></div>)}
            </dl>
          </section>
        )}

        <ContextAwareAdvisor appSlug="sam-gov" context={setupContext} />

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat icon={Building2} label="Entities" value={entities.length} />
          <Stat icon={FileText} label="Documents" value={documents.length} />
          <Stat icon={Bell} label="Unread alerts" value={alerts.length} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-xl font-black text-slate-900">Entity records</h2>
              <p className="mt-1 text-sm text-slate-600">Registration data stored in your Elevate workspace.</p>
            </div>
            {entities.length === 0 ? (
              <div className="p-10 text-center text-slate-600">No SAM entity records have been added yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {entities.map((entity, index) => (
                  <article key={entity.id || index} className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{entityName(entity)}</h3>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                          {entity.uei && <span>UEI: {entity.uei}</span>}
                          {entity.cage_code && <span>CAGE: {entity.cage_code}</span>}
                          {entity.status && <span>Status: {entity.status}</span>}
                        </div>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-brand-red-700" />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Compliance alerts</h2>
              {alerts.length === 0 ? <p className="mt-4 text-sm text-slate-600">No unread alerts.</p> : (
                <ul className="mt-4 space-y-3">
                  {alerts.map((alert, index) => (
                    <li key={alert.id || index} className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                      <div className="font-bold">{alert.title || alert.alert_type || 'Compliance reminder'}</div>
                      {alert.message && <p className="mt-1 leading-6">{alert.message}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Documents</h2>
              <p className="mt-2 text-sm text-slate-600">{documents.length} supporting document{documents.length === 1 ? '' : 's'} currently associated with your entity records.</p>
            </div>
          </div>
        </section>

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm leading-6 text-blue-900">
          <strong>Important:</strong> Elevate's SAM.gov Manager is an organizational preparation and tracking tool. It does not replace the official SAM.gov website or federal approval process.
        </div>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-brand-red-700" /><div className="mt-3 text-3xl font-black text-slate-900">{value}</div><div className="text-sm text-slate-600">{label}</div></div>;
}

export default SamGovApp;
