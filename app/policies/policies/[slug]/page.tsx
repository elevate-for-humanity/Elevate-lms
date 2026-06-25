import { notFound } from 'next/navigation';
import { policies } from '@/content/cf-policies';
import { findBySlug, staticParamsFromSlugs } from '@/lib/cf-content-helpers';
import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = findBySlug(policies, slug);
  if (!policy) return {};
  return buildMetadata({
    title: policy.title,
    description: policy.summary,
    path: `/policies/${slug}`,
  });
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = findBySlug(policies, slug);
  if (!policy) return notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">{policy.title}</h1>
      <p className="mt-4 text-slate-700">{policy.summary}</p>

      <div className="mt-8 rounded border bg-slate-50 p-6">
        <p className="text-sm text-slate-700">
          For the full text of this policy, contact us at{' '}
          <a href={`mailto:${siteConfig.email}`} className="underline">
            {siteConfig.email}
          </a>{' '}
          or call{' '}
          <a href={`tel:${siteConfig.phone}`} className="underline">
            {siteConfig.phone}
          </a>.
        </p>
      </div>
    </section>
  );
}
