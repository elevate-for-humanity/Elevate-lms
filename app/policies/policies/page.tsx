import Link from 'next/link';
import { policies } from '@/content/cf-policies';
import { buildMetadata } from '@/lib/cf-seo';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata = buildMetadata({
  title: 'Policies',
  description: '{PLATFORM_DEFAULTS.orgName} institutional policies covering admissions, attendance, academic integrity, privacy, and more.',
  path: '/policies',
});

export default function PoliciesPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Policies</h1>
      <p className="mt-4 text-slate-700">
        Institutional policies governing enrollment, conduct, privacy, and program operations.
      </p>
      <ul className="mt-8 divide-y">
        {policies.map((policy) => (
          <li key={policy.slug} className="py-4">
            <Link href={`/policies/${policy.slug}`} className="font-medium hover:underline">
              {policy.title}
            </Link>
            <p className="mt-1 text-sm text-slate-700">{policy.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
