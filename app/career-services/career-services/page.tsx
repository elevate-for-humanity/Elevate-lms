import Link from 'next/link';
import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata = buildMetadata({
  title: 'Career Services',
  description: 'Resume building, interview prep, job placement, and ongoing career support from {PLATFORM_DEFAULTS.orgName}.',
  path: '/career-services',
});

const services = [
  { slug: 'resume-building', title: 'Resume Building', summary: 'Professional resume review and writing support for program graduates.' },
  { slug: 'interview-prep', title: 'Interview Prep', summary: 'Mock interviews, coaching, and employer-readiness workshops.' },
  { slug: 'job-placement', title: 'Job Placement', summary: 'Direct employer connections and hiring pipeline access for graduates.' },
  { slug: 'career-counseling', title: 'Career Counseling', summary: 'One-on-one advising to map your career pathway and next steps.' },
];

export default function CareerServicesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">Career Services</h1>
      <p className="mt-4 text-slate-700">
        Elevate graduates receive career support beyond the classroom — from resume help to direct employer connections.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {services.map((s) => (
          <article key={s.slug} className="rounded border p-6 hover:bg-slate-50">
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{s.summary}</p>
            <Link href={`/career-services/${s.slug}`} className="mt-4 inline-block text-sm underline">Learn more</Link>
          </article>
        ))}
      </div>
      <div className="mt-10">
        <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Apply Now</a>
      </div>
    </section>
  );
}
