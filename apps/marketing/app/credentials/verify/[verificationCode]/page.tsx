import { notFound } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getOpenBadgeStatus } from '@/lib/credentials/open-badges';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null) {
  if (!value) return 'No expiration';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US');
}

export default async function CredentialVerificationPage({
  params,
}: {
  params: Promise<{ verificationCode: string }>;
}) {
  const { verificationCode } = await params;
  const db = await requireAdminClient();

  const { data, error } = await db
    .from('learner_credentials')
    .select(
      `verification_code, status, issued_at, expires_at, revoked_at, revoked_reason,
       badge_url, certificate_url, open_badge_status, open_badge_credential_url,
       open_badge_proof_type,
       credentials!inner(name, description, issuing_authority, partner_id, badge_image_url)`
    )
    .eq('verification_code', verificationCode)
    .maybeSingle();

  if (error || !data) notFound();

  const definition = Array.isArray(data.credentials) ? data.credentials[0] : data.credentials;
  if (!definition) notFound();

  let partner: { name: string; type: string } | null = null;
  if (definition.partner_id) {
    const { data: partnerData } = await db
      .from('credentialing_partners')
      .select('name, type')
      .eq('id', definition.partner_id)
      .maybeSingle();
    partner = partnerData;
  }

  const status = getOpenBadgeStatus({
    status: data.status,
    expiresAt: data.expires_at,
    revokedAt: data.revoked_at,
  });

  const badgeImage = data.badge_url || definition.badge_image_url;
  const verified = status === 'active';
  const internalIssuer = partner?.type === 'internal';
  const issuerName = definition.issuing_authority || partner?.name || 'Credential issuer';

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-8 text-center">
            {badgeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={badgeImage}
                alt={`${definition.name} credential badge`}
                className="mx-auto mb-5 h-28 w-28 rounded-xl object-contain"
              />
            ) : (
              <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-blue-50 text-4xl font-bold text-blue-700">
                EFH
              </div>
            )}
            <div
              className={`mx-auto mb-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                verified
                  ? 'bg-emerald-50 text-emerald-800'
                  : status === 'revoked'
                    ? 'bg-red-50 text-red-800'
                    : 'bg-amber-50 text-amber-800'
              }`}
            >
              {verified ? 'Credential record verified' : `Credential ${status}`}
            </div>
            <h1 className="text-3xl font-bold text-slate-950">{definition.name}</h1>
            <p className="mt-2 text-slate-600">{definition.description}</p>
          </div>

          <dl className="grid gap-0 sm:grid-cols-2">
            <div className="border-b border-slate-200 p-5 sm:border-r">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issuer</dt>
              <dd className="mt-1 font-medium text-slate-900">{issuerName}</dd>
            </div>
            <div className="border-b border-slate-200 p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification ID</dt>
              <dd className="mt-1 break-all font-mono text-sm text-slate-900">{data.verification_code}</dd>
            </div>
            <div className="border-b border-slate-200 p-5 sm:border-r">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issued</dt>
              <dd className="mt-1 text-slate-900">{formatDate(data.issued_at)}</dd>
            </div>
            <div className="border-b border-slate-200 p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expiration</dt>
              <dd className="mt-1 text-slate-900">{formatDate(data.expires_at)}</dd>
            </div>
            <div className="p-5 sm:border-r">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credential authority</dt>
              <dd className="mt-1 text-slate-900">
                {internalIssuer ? 'Elevate-issued credential' : 'External industry credential'}
              </dd>
            </div>
            <div className="p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Digital badge</dt>
              <dd className="mt-1 text-slate-900">
                {data.open_badge_status === 'issued'
                  ? 'Signed Open Badges 3.0 credential issued'
                  : data.open_badge_status === 'pending'
                    ? 'Open Badge signature pending'
                    : 'No Elevate Open Badge issued'}
              </dd>
            </div>
          </dl>

          {status === 'revoked' && data.revoked_reason && (
            <div className="border-t border-red-200 bg-red-50 p-5 text-sm text-red-900">
              Revocation reason: {data.revoked_reason}
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-slate-200 p-6">
            {data.open_badge_status === 'issued' && data.open_badge_credential_url && (
              <a
                href={data.open_badge_credential_url}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                View signed credential JSON-LD
              </a>
            )}
            {data.certificate_url && (
              <a
                href={data.certificate_url}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                View certificate
              </a>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-sm text-slate-500">
          This page verifies the credential record maintained by Elevate for Humanity. Third-party
          certifications remain subject to verification by their original issuing authority.
        </p>
      </div>
    </main>
  );
}
