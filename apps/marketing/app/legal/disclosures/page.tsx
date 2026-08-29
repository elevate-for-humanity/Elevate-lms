import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

export const metadata: Metadata = {
  title: 'Required Disclosures,
  description: 'Public disclosures for Elevate for Humanity education, workforce, funding, apprenticeship, and credential pathways.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/legal/disclosures' },
};

export default function RequiredDisclosuresPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 text-slate-950">
      <h1 className="text-4xl font-black tracking-tight">Required Disclosures</h1>
      <p className="mt-5 text-lg leading-8 text-slate-700">
        Program approval, provider status, participant funding eligibility, registered-apprenticeship status, credential eligibility, state licensure, and employment outcomes are separate determinations. Elevate publishes each claim only at the level supported by its controlling record.
      </p>
      <div className="mt-8 space-y-6 text-slate-700">
        <section><h2 className="text-xl font-black text-slate-950">Funding</h2><p className="mt-2 leading-7">Public or workforce funding is not guaranteed. The responsible agency determines participant eligibility, covered costs, current availability, and written authorization before funded enrollment.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Apprenticeship and licensing</h2><p className="mt-2 leading-7">Registered-apprenticeship claims are limited to occupations supported by the current sponsor registration record. State licensing requirements and licensing decisions are controlled separately by the applicable licensing authority.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Credentials and employment</h2><p className="mt-2 leading-7">Training completion does not by itself guarantee third-party certification, licensure, employment, wages, placement, or funding. Those outcomes depend on the applicable credentialing body, regulator, employer, funding source, and participant requirements.</p></section>
        <section><h2 className="text-xl font-black text-slate-950">Supporting records</h2><p className="mt-2 leading-7">For an agency, procurement, or compliance review, contact <a className="font-bold underline" href={`mailto:${siteConfig.email.general}`}>{siteConfig.email.general}</a> or <a className="font-bold underline" href={siteConfig.phone.href}>{siteConfig.phone.display}</a> to request the record supporting a specific public claim.</p></section>
      </div>
    </main>
  );
}
