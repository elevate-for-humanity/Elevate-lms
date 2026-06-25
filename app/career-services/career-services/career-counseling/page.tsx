import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata = buildMetadata({
  title: 'Career Counseling',
  description: '{PLATFORM_DEFAULTS.orgName} career services — Career Counseling.',
  path: '/career-services/career-counseling',
});

export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Career Counseling</h1>
      <p className="mt-4 text-slate-700">
        Available to all {PLATFORM_DEFAULTS.orgName} program graduates. Contact us to schedule your session.
      </p>
      <div className="mt-8 flex gap-4">
        <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Apply Now</a>
        <a href="/career-services" className="rounded border px-5 py-3 hover:bg-slate-50">All Services</a>
      </div>
    </section>
  );
}
