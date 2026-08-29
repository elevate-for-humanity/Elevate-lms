import type { Metadata } from 'next';
import Link from 'next/link';
import { Accessibility, Activity, Boxes, Database, FileLock2, FileText, KeyRound, LifeBuoy, Network, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Procurement Center,
  description: 'Buyer-oriented procurement, architecture, security, accessibility, implementation, data ownership, and auditability resources for the Elevate platform.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/procurement' },
};

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
