import Link from 'next/link';

const TRUST_ITEMS = [
  {
    title: 'Registered Apprenticeships',
    detail: 'Sponsor and program information is published with the applicable apprenticeship pathway.',
    href: '/approvals',
    linkLabel: 'Review approvals',
  },
  {
    title: 'Workforce Funding Pathways',
    detail: 'Funding is shown by program and remains subject to participant eligibility, agency approval, and available funds.',
    href: '/funding',
    linkLabel: 'Review funding rules',
  },
  {
    title: 'Credential & Testing Partners',
    detail: 'Program and testing pages identify the credential, exam, or testing relationship that applies to that offering.',
    href: '/testing',
    linkLabel: 'Review testing options',
  },
  {
    title: 'Privacy & Student Records',
    detail: 'Privacy, accessibility, and platform policies are published so applicants and partners can review how information is handled.',
    href: '/privacy',
    linkLabel: 'Review privacy policy',
  },
] as const;

export function TrustBadges() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-12" aria-labelledby="trust-evidence-heading">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-red-700">Evidence before claims</p>
          <h2 id="trust-evidence-heading" className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Verify the approval, funding, credential, or policy that applies to you.
          </h2>
          <p className="mt-3 leading-7 text-slate-700">
            Elevate does not use generic partner logos or unsupported outcome percentages as proof. Review the underlying program and policy pages before making an enrollment or funding decision.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {TRUST_ITEMS.map((item) => (
            <article key={item.title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-700">{item.detail}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline decoration-2 underline-offset-4 hover:text-brand-blue-950"
              >
                {item.linkLabel}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SecurityBadge() {
  return (
    <Link
      href="/privacy"
      className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-50"
    >
      Review privacy & data practices
    </Link>
  );
}

export function AccreditationBadge() {
  return (
    <Link
      href="/approvals"
      className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-50"
    >
      Review approvals & registrations
    </Link>
  );
}
