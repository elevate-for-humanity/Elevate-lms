import Link from 'next/link';
export function PartnerFormsLibrary() {
  const cards = [
    [
      'W-9 — fill, electronically sign and submit',
      '/program-holder/payouts#online-w9',
      'Complete the secure IRS substitute W-9 on your phone. The signed document goes to Elevate for review—no printing or scanning.',
    ],
    [
      'Your MOU and assigned terms',
      '/program-holder/sign-mou',
      'Review your organization, program scope, payment terms and recorded signature.',
    ],
    [
      'Full agreement documents',
      '/program-holder/agreements',
      'Read the full forms and your individual requirements.',
    ],
    [
      'Handbook and professional standards',
      '/program-holder/handbook',
      'Read online and acknowledge your individual requirements.',
    ],
    [
      'Non-compete and confidentiality',
      '/program-holder/non-compete',
      'Read the actual terms and linked full agreement before signing.',
    ],
    [
      'Rights and responsibilities',
      '/program-holder/rights-responsibilities',
      'Review student support, records, safety and compliance duties.',
    ],
    [
      'Invoices and secure bank setup',
      '/program-holder/payouts',
      'Select a student, review your suggested amount, and follow the secure bank setup guide.',
    ],
  ];
  return (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="text-2xl font-black">Forms, handbooks and templates</h2>
      <p className="mt-2 text-sm">
        Complete and electronically sign available Elevate forms online. Existing licenses, ID and insurance certificates still need the
        issuing organization’s original evidence.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {cards.map(([title, href, body]) => (
          <Link key={href} href={href} className="rounded-xl border p-4 hover:border-blue-500">
            <h3 className="font-bold text-blue-800">{title}</h3>
            <p className="mt-2 text-sm">{body}</p>
          </Link>
        ))}
      </div>
      <details className="mt-4 rounded-xl border p-4">
        <summary className="min-h-11 cursor-pointer font-bold">
          Team handouts for site coordinators and program holders
        </summary>
        <p className="mt-2 text-sm">
          Use these blank handouts with your own staff. Each person reviews and signs their own
          applicable agreements. A template does not make anyone an employee or contractor, and does
          not replace an individual Elevate MOU.
        </p>
        <ul className="mt-3 space-y-2">
          {[
            ['staff-orientation', 'Team orientation checklist'],
            ['training-plan', 'Program syllabus and training-plan worksheet'],
            ['invoice', 'Blank invoice worksheet'],
            ['meeting-notes', 'Training and follow-up meeting notes'],
            ['standards', 'Professional standards handout'],
          ].map(([key, title]) => (
            <li key={key}>
              <a
                className="inline-flex min-h-11 items-center font-bold text-blue-800 underline"
                href={`/api/program-holder/forms/templates?type=${key}`}
              >
                Download {title}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
