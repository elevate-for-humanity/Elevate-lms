import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, XCircle } from 'lucide-react';

import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Intuit for Education / Edlink | Admin',
  description: 'Elevate LMS readiness for Intuit for Education and Edlink.',
};

type ReadinessState = 'ready' | 'partial' | 'blocked';

const requirements: Array<{
  requirement: string;
  edlink: string;
  elevate: string;
  state: ReadinessState;
}> = [
  {
    requirement: 'School administrator onboarding',
    edlink: 'Authorized administrator completes the Intuit-generated onboarding link.',
    elevate: 'Intuit educator account is created; the Edlink administrator connection is still pending.',
    state: 'partial',
  },
  {
    requirement: 'Supported data connection',
    edlink: 'A supported LMS/SIS provider or an approved OneRoster/LTI connection.',
    elevate: 'A read-only OneRoster 1.2 provider is present and remains disabled until Edlink approval.',
    state: 'partial',
  },
  {
    requirement: 'LTI 1.3',
    edlink: 'LTI can launch learning tools from a compatible LMS.',
    elevate: 'Schema and documentation remain, but the advertised /api/lti routes are not in the active applications.',
    state: 'blocked',
  },
  {
    requirement: 'Canonical roster data',
    edlink: 'Organizations, users, courses, classes, and enrollments need stable sourced IDs.',
    elevate: 'Profiles, courses, programs, and program_enrollments provide the source records.',
    state: 'ready',
  },
  {
    requirement: 'Credentials and connection identity',
    edlink: 'Application credentials and the approved connection ID are required for API sync.',
    elevate: 'EDLINK_CLIENT_ID, EDLINK_CLIENT_SECRET, and EDLINK_CONNECTION_ID are not yet provisioned.',
    state: 'blocked',
  },
  {
    requirement: 'Student privacy gate',
    edlink: 'Roster data must be authorized before names, emails, enrollments, or grades leave Elevate.',
    elevate: 'No outbound Edlink student-data sync is enabled. This is the correct safe default.',
    state: 'ready',
  },
  {
    requirement: 'Sync operations',
    edlink: 'Idempotent imports, webhooks, retries, audit logs, and reconciliation.',
    elevate: 'Enrollment services exist, but an Edlink-specific sync ledger and webhook verifier do not.',
    state: 'blocked',
  },
];

const stateView = {
  ready: { label: 'Ready', className: 'bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  partial: { label: 'Partial', className: 'bg-amber-50 text-amber-900', Icon: AlertTriangle },
  blocked: { label: 'Needed', className: 'bg-slate-100 text-slate-700', Icon: XCircle },
};

export default async function EdlinkIntegrationPage() {
  await requireRole(['admin']);

  const configured = {
    clientId: Boolean(process.env.EDLINK_CLIENT_ID),
    clientSecret: Boolean(process.env.EDLINK_CLIENT_SECRET),
    connectionId: Boolean(process.env.EDLINK_CONNECTION_ID),
    webhookSecret: Boolean(process.env.EDLINK_WEBHOOK_SECRET),
    oneRosterClient: Boolean(process.env.ONEROSTER_CLIENT_ID),
    oneRosterSecret: Boolean(process.env.ONEROSTER_CLIENT_SECRET),
    oneRosterTokenSecret: Boolean(process.env.ONEROSTER_TOKEN_SECRET),
  };
  const credentialCount = Object.values(configured).filter(Boolean).length;
  const credentialsReady = configured.clientId && configured.clientSecret && configured.connectionId;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/integrations" className="text-sm font-semibold text-brand-blue-700 hover:underline">
              Integrations
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Intuit for Education / Edlink
            </h1>
            <p className="mt-2 max-w-3xl text-slate-700">
              This is the operational readiness view for connecting Intuit classes to Elevate. It does not
              send student records or claim that the custom LMS is connected before Edlink approves it.
            </p>
          </div>
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
              credentialsReady ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-950'
            }`}
          >
            {credentialsReady ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {credentialsReady ? 'Credentials configured' : 'Onboarding required'}
          </span>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-600">Credential fields</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {credentialCount}/{Object.keys(configured).length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-600">Outbound student sync</p>
            <p className="mt-2 text-lg font-bold text-slate-950">Disabled</p>
            <p className="mt-1 text-xs text-slate-600">Remains off until authorization and mapping validation.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-600">Recommended connection</p>
            <p className="mt-2 text-lg font-bold text-slate-950">OneRoster 1.2</p>
            <p className="mt-1 text-xs text-slate-600">Use LTI 1.3 separately for tool launch and grade services.</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-bold text-slate-950">Side-by-side readiness audit</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-5 py-3">Requirement</th>
                  <th className="px-5 py-3">Edlink expects</th>
                  <th className="px-5 py-3">Elevate today</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requirements.map((item) => {
                  const view = stateView[item.state];
                  return (
                    <tr key={item.requirement} className="align-top">
                      <th className="px-5 py-4 font-bold text-slate-950">{item.requirement}</th>
                      <td className="max-w-sm px-5 py-4 text-slate-700">{item.edlink}</td>
                      <td className="max-w-sm px-5 py-4 text-slate-700">{item.elevate}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold ${view.className}`}>
                          <view.Icon className="h-3.5 w-3.5" />
                          {view.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-blue-700" />
              <h2 className="text-lg font-bold text-slate-950">Implementation order</h2>
            </div>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-slate-700">
              <li>Complete the Intuit-generated administrator onboarding link and identify the offered provider type.</li>
              <li>Ask Edlink to approve Elevate as a OneRoster 1.2 source if the custom LMS is not listed.</li>
              <li>Provision credentials in the Admin runtime without placing secrets in the database or browser.</li>
              <li>Build read-only roster sync first, validate record mappings, and log every imported or exported ID.</li>
              <li>Enable writes and grade passback only after sandbox certification and privacy approval.</li>
            </ol>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-bold text-amber-950">Do not enable yet</h2>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              Do not send names, emails, enrollments, grades, or attendance through an unverified webhook or a
              pasted onboarding URL. The connection must have a verified Edlink identity, scoped credentials,
              signed webhooks, and a documented data-sharing purpose first.
            </p>
            <a
              href="https://ed.link/docs/providers"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-blue-800 hover:underline"
            >
              Review supported providers <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
