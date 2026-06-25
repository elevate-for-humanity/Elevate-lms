import Link from 'next/link';
import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata = buildMetadata({
  title: 'Platform',
  description: 'The {PLATFORM_DEFAULTS.orgName} platform connects learners, employers, workforce boards, and training providers.',
  path: '/platform',
});

const sections = [
  { slug: 'overview', title: 'Overview', summary: 'How the Elevate platform works for all stakeholders.' },
  { slug: 'partners', title: 'Partners', summary: 'Employer and community partners in the Elevate network.' },
  { slug: 'program-holders', title: 'Program Holders', summary: 'Organizations that host and deliver Elevate programs.' },
  { slug: 'providers', title: 'Training Providers', summary: 'Credentialed training providers in the Elevate network.' },
  { slug: 'workforce-boards', title: 'Workforce Boards', summary: 'Workforce board partnerships and WIOA funding access.' },
];

export default function PlatformPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">Platform</h1>
      <p className="mt-4 text-slate-700">Connecting learners, employers, workforce boards, and training providers.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <article key={s.slug} className="rounded border p-6 hover:bg-slate-50">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{s.summary}</p>
            <Link href={`/platform/${s.slug}`} className="mt-4 inline-block text-sm underline">Learn more</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
