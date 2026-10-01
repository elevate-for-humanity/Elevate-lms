import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, FileCode2, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { COMMERCE_CATALOG } from '@/lib/store/commerce-catalog';
import {
  STORE_FEATURE_PROOFS,
  STORE_PRODUCT_PROOFS,
  getStoreFeatureProof,
  type StoreFeatureProof,
  type StoreProductProof,
} from '@/lib/store/offer-proof';
import type { PlatformFeatureKey } from '@/lib/platform/features';
import { getAppVersion } from '@/lib/version/getAppVersion';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Store Capability Proof | Elevate for Humanity',
  description:
    'Source-backed evidence, working surfaces, scope, and limitations for every product advertised in the Elevate Store.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/proof' },
};

const REPOSITORY = 'https://github.com/elevate-for-humanity/Elevate-lms';

function sourceHref(revision: string, sourcePath: string): string {
  return `${REPOSITORY}/blob/${revision}/${sourcePath}`;
}

function accessLabel(access: StoreFeatureProof['access']): string {
  if (access === 'public-demo') return 'Public interactive evidence';
  if (access === 'authenticated-workflow') return 'Authenticated production workflow';
  return 'Public product evidence';
}

export default function StoreProofPage() {
  const deployedSha = getAppVersion();
  const sourceRevision = /^[0-9a-f]{40}$/i.test(deployedSha) ? deployedSha : 'main';
  const featureProofs = Object.entries(STORE_FEATURE_PROOFS)
    .filter((entry): entry is [PlatformFeatureKey, StoreFeatureProof] => Boolean(entry[1]))
    .sort(([, left], [, right]) => left.title.localeCompare(right.title));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Capability Proof' }]} />
      </div>

      <section className="border-y border-slate-200 bg-white px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">
            <ShieldCheck className="h-5 w-5" /> Source-backed Store
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Verify what every Store offer can do.
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-700">
            Every public plan, add-on, app, preview, and enterprise offer below is connected to a
            working surface and the implementation source that supports the claim. Limits are shown
            alongside the proof instead of being hidden behind checkout.
          </p>
          <p className="mt-4 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-950">
            Source-backed means the implementation and route exist. Public interactive evidence can
            be tested immediately. Authenticated workflows and provider-dependent actions still
            require a signed-in production acceptance test with the customer&apos;s enabled services.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-600">Offers checked</p>
              <p className="mt-2 text-3xl font-black">{COMMERCE_CATALOG.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-600">Capabilities proven</p>
              <p className="mt-2 text-3xl font-black">{featureProofs.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-600">Deployed revision</p>
              <Link href="/api/version" className="mt-2 block break-all font-mono text-sm font-black text-brand-red-700 hover:underline">
                {deployedSha}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black">Offer-by-offer evidence</h2>
          <p className="mt-3 max-w-3xl font-semibold leading-7 text-slate-700">
            Each Store item resolves to one or more verified capability records. Compatibility-only
            products hidden from public sale are not included here.
          </p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {COMMERCE_CATALOG.map((offer) => {
              const proofs = offer.proofFeatureKeys
                .map((key) => ({ key, proof: getStoreFeatureProof(key) }))
                .filter(
                  (entry): entry is { key: PlatformFeatureKey; proof: StoreFeatureProof } =>
                    Boolean(entry.proof),
                );
              const productProof: StoreProductProof | null = offer.proofProductId
                ? STORE_PRODUCT_PROOFS[offer.proofProductId]
                : null;
              return (
                <article
                  id={`offer-${offer.id}`}
                  key={offer.id}
                  className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-brand-red-700">
                        {offer.status === 'sellable' ? 'Available offer' : offer.status}
                      </p>
                      <h3 className="mt-2 text-2xl font-black">{offer.name}</h3>
                    </div>
                    <Link href={offer.href} className="inline-flex items-center gap-2 text-sm font-black text-brand-red-700 hover:underline">
                      View offer <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{offer.description}</p>
                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                    {proofs.map(({ key, proof }) => (
                      <a
                        key={key}
                        href={`#feature-${key}`}
                        className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3 hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                        <span>
                          <span className="block text-sm font-black text-slate-950">{proof.title}</span>
                          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-700">{proof.claim}</span>
                        </span>
                      </a>
                    ))}
                    {productProof ? (
                      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                        <span>
                          <span className="block text-sm font-black text-slate-950">{productProof.title}</span>
                          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-700">{productProof.claim}</span>
                          {productProof.limitation ? (
                            <span className="mt-2 block text-xs font-bold leading-5 text-amber-800">Scope: {productProof.limitation}</span>
                          ) : null}
                          <span className="mt-2 flex flex-wrap gap-3">
                            <Link href={productProof.evidenceHref} className="text-xs font-black text-brand-red-700 hover:underline">
                              {productProof.evidenceLabel}
                            </Link>
                            {productProof.sourcePaths.map((sourcePath) => (
                              <a key={sourcePath} href={sourceHref(sourceRevision, sourcePath)} className="text-xs font-black text-slate-700 hover:underline">
                                Source: {sourcePath}
                              </a>
                            ))}
                          </span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black">Capability source records</h2>
          <p className="mt-3 max-w-3xl font-semibold leading-7 text-slate-700">
            These links point to the exact deployed revision when its SHA is available. The deployment
            gate checks that every listed source exists and that every public Store offer resolves to proof.
          </p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {featureProofs.map(([key, proof]) => (
              <article id={`feature-${key}`} key={key} className="scroll-mt-24 rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start gap-3">
                  <FileCode2 className="mt-1 h-6 w-6 shrink-0 text-brand-red-700" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-800">{accessLabel(proof.access)}</p>
                    <h3 className="mt-1 text-xl font-black">{proof.title}</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">{proof.claim}</p>
                {proof.limitation ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-900">
                    Scope: {proof.limitation}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-col items-start gap-2">
                  <Link href={proof.evidenceHref} className="inline-flex items-center gap-2 text-sm font-black text-brand-red-700 hover:underline">
                    {proof.evidenceLabel} <ExternalLink className="h-4 w-4" />
                  </Link>
                  {proof.sourcePaths.map((sourcePath) => (
                    <a key={sourcePath} href={sourceHref(sourceRevision, sourcePath)} className="break-all font-mono text-xs font-bold text-slate-600 hover:text-slate-950 hover:underline">
                      {sourcePath}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
