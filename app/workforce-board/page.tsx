import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';
export const metadata = buildMetadata({ title: 'Workforce Board', description: 'Workforce board partnerships and WIOA-funded training access.', path: '/workforce-board' });
export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Workforce Board</h1>
      <p className="mt-4 text-slate-700">Elevate partners with regional workforce boards to connect eligible learners to WIOA-funded training programs.</p>
      <div className="mt-8"><a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Check Eligibility</a></div>
    </section>
  );
}
