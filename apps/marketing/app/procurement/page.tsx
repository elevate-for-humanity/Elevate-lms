import type { Metadata } from 'next';
import Link from 'next/link';
import { Accessibility, Activity, Boxes, Database, FileLock2, FileText, KeyRound, LifeBuoy, Network, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Procurement Center',
  description: 'Buyer-oriented procurement, architecture, security, accessibility, implementation, data ownership, and auditability resources for the Elevate platform.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/procurement' },
};

const reviewMaterials = [
  { item: 'Privacy and data handling', access: 'Public', href: '/privacy', detail: 'Collection, use, sharing, retention, payment data, participant rights, and request handling.' },
  { item: 'Security control description', access: 'Public', href: '/security-and-data-protection', detail: 'Identity, authorization, audit logging, encryption, incident handling, and control boundaries.' },
  { item: 'Accessibility statement', access: 'Public', href: '/accessibility', detail: 'WCAG 2.2 Level AA target, testing approach, accommodations, and barrier reporting.' },
  { item: 'Platform demonstration', access: 'Public demo', href: '/platform/demo', detail: 'Synthetic personas and example workflows; no production participant information is exposed.' },
  { item: 'Support process', access: 'Public', href: '/support', detail: 'Support channels, business hours, help topics, and ticket intake.' },
  { item: 'Architecture, data flow, and subprocessors', access: 'Authorized review', href: '/contact', detail: 'Shared during due diligence at the level appropriate to the proposed implementation.' },
  { item: 'Availability, recovery, and escalation commitments', access: 'Contract', href: '/contact', detail: 'Defined in the executed agreement for the purchased scope; not implied by public marketing.' },
  { item: 'Independent attestations and test reports', access: 'On request', href: '/contact', detail: 'Provided only when a current report exists and the recipient is authorized to receive it.' },
] as const;

const buyerTopics = [
  { title: 'Architecture & tenancy', text: 'Review the multi-service platform model, role separation, tenant boundaries, and deployment architecture.', icon: Network },
  { title: 'Identity & access', text: 'Review authentication, role-based authorization, administrative boundaries, and access revocation controls.', icon: KeyRound },
  { title: 'Auditability', text: 'Lifecycle actions such as enrollment, OJT verification, completion, and credentialing are designed to be recorded and reproducible.', icon: Activity },
  { title: 'Data ownership', text: 'Client data ownership, export expectations, processing responsibilities, and retention requirements belong in the procurement agreement.', icon: Database },
  { title: 'Security review', text: 'Security questionnaires, encryption controls, incident-response expectations, and third-party dependencies can be reviewed during due diligence.', icon: FileLock2 },
  { title: 'Accessibility', text: 'Accessibility is treated as a procurement requirement and is documented separately from general marketing claims.', icon: Accessibility },
  { title: 'Implementation', text: 'Implementation scope should define tenant setup, integrations, data migration, roles, training, launch criteria, and acceptance testing.', icon: Boxes },
  { title: 'Support & service levels', text: 'Support channels, escalation, availability commitments, recovery objectives, and service levels are contract-specific and should be documented before purchase.', icon: LifeBuoy },
];

export default function ProcurementPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Government & Enterprise Procurement</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Evaluate the platform beyond the sales page.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">This center organizes the technical, security, accessibility, implementation, and evidence questions a public agency or enterprise buyer should review before purchase.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/platform/demo" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950">Open platform demo</Link>
            <Link href="/trust" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-black text-white">Open Trust Center</Link>
            <Link href="/contact" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-black text-white">Request due-diligence materials</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" /><div><h2 className="font-black">Procurement claims are evidence-bound</h2><p className="mt-2 leading-7 text-amber-950">This page intentionally avoids claiming certifications, uptime levels, outcomes, or regulatory approvals unless those claims are separately supported and approved for public use. Contract commitments should be stated in the executed agreement, not inferred from marketing copy.</p></div></div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {buyerTopics.map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded-3xl border border-slate-200 p-6">
              <Icon className="h-7 w-7" />
              <h2 className="mt-4 text-xl font-black">{title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>

        <section className="mt-12" aria-labelledby="buyer-review-checklist">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-600">Buyer review checklist</p>
          <h2 id="buyer-review-checklist" className="mt-2 text-3xl font-black tracking-tight">What is public, what requires review, and what belongs in the contract</h2>
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <div className="hidden grid-cols-[1.1fr_0.45fr_1.6fr] gap-4 bg-slate-950 px-6 py-4 text-sm font-black text-white md:grid">
              <span>Review item</span><span>Access</span><span>What it covers</span>
            </div>
            {reviewMaterials.map((material) => (
              <div key={material.item} className="grid gap-2 border-t border-slate-200 px-6 py-5 first:border-t-0 md:grid-cols-[1.1fr_0.45fr_1.6fr] md:gap-4">
                <Link href={material.href} className="font-black text-slate-950 underline-offset-4 hover:underline">{material.item}</Link>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">{material.access}</span>
                <p className="leading-6 text-slate-600">{material.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">A public description is not a substitute for a signed service level, completed security questionnaire, current accessibility evaluation, or independent assurance report.</p>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-7">
            <FileText className="h-7 w-7" />
            <h2 className="mt-4 text-2xl font-black">Evidence package</h2>
            <p className="mt-3 leading-7 text-slate-600">Agency reviewers should be able to request the specific approval notice, registration record, policy, architecture description, security response, accessibility statement, implementation plan, or control evidence applicable to the purchase.</p>
            <Link href="/approvals" className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Review regulatory evidence</Link>
          </div>
          <div className="rounded-3xl bg-slate-50 p-7">
            <ShieldCheck className="h-7 w-7" />
            <h2 className="mt-4 text-2xl font-black">Security & data protection</h2>
            <p className="mt-3 leading-7 text-slate-600">Security controls and compliance-support capabilities are documented separately from formal third-party certifications. Buyers can review the public security surface and request a tailored questionnaire response.</p>
            <Link href="/security-and-data-protection" className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Review security</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
