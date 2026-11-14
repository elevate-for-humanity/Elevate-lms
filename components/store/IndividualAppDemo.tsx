'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SubscriptionCommercialPlayer from '@/components/store/SubscriptionCommercialPlayer';
import { SamGovApp } from '@/apps/marketing/app/apps/sam-gov/SamGovApp';
import { GrantsApp } from '@/apps/marketing/app/apps/grants/GrantsApp';
import WebsiteBuilderCommercial from '@/components/store/WebsiteBuilderCommercial';
import { WorkspaceDemoContext } from '@/components/apps/WorkspaceDemoContext';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import type { IndividualAppCatalog } from '@/lib/apps/individual-app-plans';
type Row = Record<string, any>;
export default function IndividualAppDemo({
  catalog,
  opportunities = [],
  initialPlan,
}: {
  catalog: IndividualAppCatalog;
  opportunities?: Row[];
  initialPlan?: string;
}) {
  const [plan, setPlan] = useState(
    catalog.plans.find((p) => p.id === initialPlan)?.id || catalog.plans[0].id,
  );
  const voice = useNaturalVoice();
  const selected = catalog.plans.find((p) => p.id === plan)!;
  const narration = `${catalog.displayName}. ${selected.name}, ${selected.priceMonthly} dollars per month. ${selected.features.join('. ')}. This is a subscription for one user account. Explore the workspace below, compare the plans, and start your fourteen day trial. Payment uses QuickBooks invoices. ${catalog.slug === 'sam-gov' ? 'Official registration and approval remain on SAM dot gov.' : catalog.slug === 'grants' ? 'Funding decisions and final applications remain with the awarding agency.' : ''}`;
  return (
    <div className="bg-slate-50 text-slate-950">
      <header className="mx-auto max-w-7xl px-4 py-8">
        <Link href={`/store/apps/${catalog.slug}`} className="font-bold underline">
          Back to {catalog.displayName}
        </Link>
        <p className="mt-6 text-sm font-black uppercase tracking-widest text-red-700">
          Try it before you choose
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">{catalog.displayName}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8">
          Choose a plan to see its price, included features and workspace controls.
        </p>
        <SubscriptionCommercialPlayer catalog={catalog} plan={selected} />
        <div className="mt-5 flex flex-wrap gap-3" aria-label="Demo subscription plans">
          {catalog.plans.map((p) => (
            <button
              key={p.id}
              aria-pressed={p.id === plan}
              onClick={() => {
                voice.stop();
                setPlan(p.id);
              }}
              className={`rounded-xl border px-5 py-3 font-bold ${p.id === plan ? 'bg-slate-950 text-white' : 'bg-white'}`}
            >
              {p.name} · {p.priceLabel}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-5 rounded-2xl border bg-white p-6 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-xl font-black">{selected.name} includes</h2>
            <ul className="mt-3 space-y-2">
              {selected.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-6">
              One licensed user. QuickBooks invoice billing. A free trial is available without a
              card.
            </p>
          </div>
          <div className="space-y-3">
            {voice.error ? (
              <p role="status" className="max-w-xs text-sm">
                Narration is temporarily unavailable. The plan details remain below.
              </p>
            ) : null}
            <button
              onClick={() => void voice.play(narration, { style: 'commercial' })}
              className="block rounded-xl bg-red-700 px-5 py-3 font-bold text-white"
            >
              Hear this plan
            </button>
            <Link
              href={`/store/apps/${catalog.slug}`}
              className="block rounded-xl border px-5 py-3 text-center font-bold"
            >
              Compare &amp; start trial
            </Link>
          </div>
        </div>
      </header>
      {catalog.slug === 'website-builder' ? (
        <WebsiteBuilderCommercial />
      ) : (
        <DemoWorkspace key={plan} catalog={catalog} plan={plan} opportunities={opportunities} />
      )}
    </div>
  );
}
function DemoWorkspace({
  catalog,
  plan,
  opportunities,
}: {
  catalog: IndividualAppCatalog;
  plan: string;
  opportunities: Row[];
}) {
  const [entities, setEntities] = useState<Row[]>([]),
    [documents, setDocuments] = useState<Row[]>([]),
    [alerts, setAlerts] = useState<Row[]>([]),
    [saved, setSaved] = useState<Row[]>([]),
    [applications, setApplications] = useState<Row[]>([]),
    [searches, setSearches] = useState(0);
  const urls = useRef(new Map<string, string>());
  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  const allowance = plan === 'starter' ? 50 : plan === 'professional' ? 500 : 2000;
  const request = async (app: 'sam-gov' | 'grants', body: Row | FormData) => {
    if (app !== catalog.slug) throw Error('Choose this app in the demo.');
    if (app === 'sam-gov') {
      if (body instanceof FormData) {
        const file = body.get('file'),
          entity = String(body.get('entity_id') || '');
        if (
          !(file instanceof File) ||
          !file.size ||
          file.size > 10 * 1024 * 1024 ||
          ![
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ].includes(file.type)
        )
          throw Error('Choose a file up to 10 MB.');
        if (!entities.some((e) => e.id === entity)) throw Error('Choose an entity first.');
        const id = crypto.randomUUID();
        urls.current.set(id, URL.createObjectURL(file));
        setDocuments((rows) => [
          ...rows,
          { id, entity_id: entity, file_name: file.name, storage_path: 'demo-local' },
        ]);
        return { ok: true };
      }
      if (body.action === 'read-alert') {
        setAlerts((rows) => rows.filter((r) => r.id !== body.id));
        return { ok: true };
      }
      if (!String(body.legal_business_name || '').trim()) throw Error('Enter the business name.');
      const limit = plan === 'starter' ? 1 : plan === 'professional' ? 5 : Infinity;
      if (!body.entity_id && entities.length >= limit)
        throw Error(`This plan allows ${limit} entity records.`);
      const id = body.entity_id || crypto.randomUUID(),
        row = { ...body, id };
      setEntities((rows) => [...rows.filter((r) => r.id !== id), row]);
      setAlerts((rows) => [
        ...rows.filter((r) => r.entity_id !== id),
        ...(body.registration_expires_on
          ? [
              {
                id: crypto.randomUUID(),
                entity_id: id,
                title: `Review ${body.legal_business_name} renewal`,
                due_date: body.registration_expires_on,
              },
            ]
          : []),
      ]);
      return { ok: true };
    }
    if (body instanceof FormData) throw Error('Use the grant controls.');
    if (body.action === 'search') {
      if (searches >= allowance) throw Error('This plan search allowance has been reached.');
      setSearches((v) => v + 1);
      const words = String(body.keyword || '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const found = opportunities.filter((g) =>
        words.some((w) => JSON.stringify(g).toLowerCase().includes(w)),
      );
      return { opportunities: found, total: found.length, remaining: allowance - searches - 1 };
    }
    const grant = opportunities.find((g) => g.id === body.grant_id);
    if (body.action === 'save') {
      if (!grant) throw Error('Select an opportunity.');
      setSaved((rows) =>
        rows.some((r) => r.grant_id === grant.id)
          ? rows
          : [...rows, { id: crypto.randomUUID(), grant_id: grant.id, grant: grant }],
      );
      return { ok: true };
    }
    if (body.action === 'unsave') {
      setSaved((rows) => rows.filter((r) => r.grant_id !== body.grant_id));
      return { ok: true };
    }
    if (plan === 'starter')
      throw Error('Application tracking is included in Professional and Enterprise.');
    if (body.action === 'draft') {
      if (!grant) throw Error('Select an opportunity.');
      setApplications((rows) =>
        rows.some((r) => r.opportunity_id === grant.id)
          ? rows
          : [
              ...rows,
              {
                id: crypto.randomUUID(),
                opportunity_id: grant.id,
                title: grant.title,
                status: 'draft',
              },
            ],
      );
      return { ok: true };
    }
    if (body.action === 'application') {
      setApplications((rows) => rows.map((r) => (r.id === body.id ? { ...r, ...body } : r)));
      return { ok: true };
    }
    throw Error('Choose a demo action.');
  };
  const props = {
    user: { id: 'public-demo' },
    subscription: { plan, status: 'demo' },
    trialDaysRemaining: 0,
    demo: true,
  };
  return (
    <WorkspaceDemoContext.Provider
      value={{ request, refresh: () => {}, documentHref: (id) => urls.current.get(id) }}
    >
      <aside className="mx-auto max-w-7xl px-4">
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6">
          <strong>Interactive demo · browser session only.</strong> These are the same workspace
          controls used by subscribers. Records you enter here stay in this tab and disappear on
          refresh. No account, official registration, grant submission or payment is created.{' '}
          {catalog.slug === 'grants'
            ? 'Search filters a public Grants.gov snapshot; paid account search uses the live service.'
            : ''}
        </p>
        {catalog.slug === 'grants' && !opportunities.length ? (
          <p role="status" className="mt-3">
            The Grants.gov snapshot is unavailable. Open the product page to explore plans and try
            live search in your account.
          </p>
        ) : null}
      </aside>
      {catalog.slug === 'sam-gov' ? (
        <SamGovApp {...props} entities={entities} documents={documents} alerts={alerts} />
      ) : (
        <GrantsApp
          {...props}
          opportunities={opportunities}
          savedGrants={saved}
          applications={applications}
        />
      )}
    </WorkspaceDemoContext.Provider>
  );
}
