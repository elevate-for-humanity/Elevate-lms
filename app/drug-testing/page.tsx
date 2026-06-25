import { buildMetadata } from '@/lib/cf-seo';
import { siteConfig } from '@/content/cf-site';
export const metadata = buildMetadata({ title: 'Drug Testing', description: 'Employer drug testing programs including DOT, hair, urine, and instant tests.', path: '/drug-testing' });
export default function Page() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Drug Testing</h1>
      <p className="mt-4 text-slate-700">Employer drug testing programs including DOT, hair, urine, and instant tests.</p>
      <div className="mt-8 flex gap-4">
        <a href={siteConfig.handoff.apply} className="rounded bg-black px-5 py-3 text-white hover:bg-gray-800">Apply Now</a>
        <a href="mailto:info@elevateforhumanity.org" className="rounded border px-5 py-3 hover:bg-slate-50">Contact Us</a>
      </div>
    </section>
  );
}
