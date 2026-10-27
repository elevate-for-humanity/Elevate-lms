import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  alternates: { canonical: 'https://admin.elevateforhumanity.org/partners/lms-integrations' },
  title: 'Partner LMS Integrations | Elevate For Humanity',
  description: 'Manage verified partner learning-platform connections.',
};

export default async function LmsIntegrationsPage() {
  await requireRole(['admin']);
  const db = await createClient();
  const [{ data: platforms, error: ltiError }, { data: providers, error: providerError }] =
    await Promise.all([
      db
        .from('lti_platforms')
        .select('id,name,status,auth_login_url,jwks_uri,updated_at')
        .order('updated_at', { ascending: false }),
      db
        .from('integrations')
        .select('id,slug,status,is_active,note,updated_at')
        .in('slug', ['edlink', 'google-classroom', 'lti']),
    ]);
  const ltiPlatforms = ltiError ? [] : (platforms ?? []);
  const integrations = providerError ? [] : (providers ?? []);
  const activeLti = ltiPlatforms.filter(
    (platform) => platform.status === 'active' && platform.auth_login_url && platform.jwks_uri,
  );
  const activeProviders = integrations.filter(
    (provider) => provider.is_active === true && provider.status === 'active',
  );
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Partners</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">LMS integration control center</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Connection records shown here come from integration tables—not student profiles. A
          provider is active only after configuration and a verified operational connection.
        </p>
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Configured providers" value={integrations.length} />
          <Metric label="Verified providers" value={activeProviders.length} />
          <Metric label="Verified LTI platforms" value={activeLti.length} />
        </section>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Institutional gateways</h2>
              <p className="mt-1 text-sm text-slate-600">
                Edlink, Google Classroom, and direct LTI records.
              </p>
            </div>
            <Link
              href="/integrations"
              className="rounded-lg border px-4 py-2 text-sm font-bold hover:bg-slate-50"
            >
              Integration settings
            </Link>
          </div>
          <div className="mt-5 divide-y divide-slate-200">
            {integrations.length ? (
              integrations.map((provider) => (
                <Connection
                  key={provider.id}
                  name={provider.slug}
                  active={provider.is_active === true && provider.status === 'active'}
                  updatedAt={provider.updated_at}
                  note={provider.note}
                />
              ))
            ) : (
              <Empty message="No institutional gateway has been configured." />
            )}
          </div>
        </section>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Direct LTI platforms</h2>
          <div className="mt-5 divide-y divide-slate-200">
            {ltiPlatforms.length ? (
              ltiPlatforms.map((platform) => (
                <Connection
                  key={platform.id}
                  name={platform.name || 'Unnamed platform'}
                  active={
                    platform.status === 'active' &&
                    Boolean(platform.auth_login_url && platform.jwks_uri)
                  }
                  updatedAt={platform.updated_at}
                  note={
                    !platform.auth_login_url || !platform.jwks_uri
                      ? 'OIDC login or JWKS configuration is incomplete.'
                      : null
                  }
                />
              ))
            ) : (
              <Empty message="No direct LTI platform registrations exist." />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
function Connection({
  name,
  active,
  updatedAt,
  note,
}: {
  name: string;
  active: boolean;
  updatedAt: string | null;
  note?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-black capitalize text-slate-950">{name.replaceAll('-', ' ')}</p>
        <p className="text-sm text-slate-500">
          {note ||
            `Last configuration change: ${updatedAt ? new Date(updatedAt).toLocaleString() : 'unknown'}`}
        </p>
      </div>
      <span
        className={`w-fit rounded-full px-3 py-1 text-xs font-black ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}
      >
        {active ? 'Verified' : 'Setup required'}
      </span>
    </div>
  );
}
function Empty({ message }: { message: string }) {
  return <p className="py-8 text-center text-slate-500">{message}</p>;
}
