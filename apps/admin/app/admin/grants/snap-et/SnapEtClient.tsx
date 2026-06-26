'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type FormState = Record<string, string>;

const DEFAULTS: FormState = {
  legal_name: PLATFORM_DEFAULTS.orgLegalName,
  org_type: '2Exclusive LLC-S (DBA)',
  address: '8888 Keystone Crossing, Suite 1300',
  city: 'Indianapolis',
  state: 'IN',
  zip: '46240',
  ein: '85-3832840',
  uei: 'VX2GK5S8SZH8',
  rep_name: 'Elizabeth Greene',
  rep_title: 'Founder & Chief Executive Officer',
  rep_phone: PLATFORM_DEFAULTS.supportPhone,
  rep_email: 'elevate4humanityedu@gmail.com',
  program_name: `${PLATFORM_DEFAULTS.orgName} SNAP E&T Multi-Track Credential Program`,
  program_type: 'Vocational training',
  delivery_mode: 'Hybrid',
  structured_hours: '20',
  supervised_hours: '5',
  total_weekly_hours: '25',
  program_duration: '4 weeks',
  counties: 'Marion, Hamilton, Hendricks, Johnson, Madison',
  training_sites: '8888 Keystone Crossing Suite 1300 (IT/testing/admin)\n6331 N Keystone Ave (healthcare/beauty)\n7116 N College Ave (construction/manufacturing)\n2439 E 65th St (hands-on trades training)',
  credentials: [
    'IT Help Desk / CompTIA A+',
    'Cybersecurity Analyst',
    'CNA (Certified Nursing Assistant)',
    'QMA (Qualified Medication Aide)',
    'Phlebotomy Technician',
    'CDL Class A & B Commercial Driver Training',
    'Barber Apprenticeship',
    'Cosmetology Apprenticeship',
    'Nail Technician Apprenticeship',
    'Esthetician Apprenticeship',
    'Business Administration',
    'Finance & Bookkeeping',
    'HVAC Technician (EPA 608 Certification)',
    'Manufacturing / Production Technician',
  ].join('\n'),
  total_participants: '150',
  snap_recipients: '150',
  abawd_participants: '75',
  completion_rate: '82%',
  placement_rate: '74%',
  nf_salary: '$398,144.50',
  f_salary: '$496,600',
  f_fringe: '$74,490',
  nf_materials: '$3,680',
  f_materials: '$42,245',
  nf_rent: '$7,000',
  f_rent: '$112,954',
  nf_inkind: '$5,000',
  f_transport_reimb: '$54,000',
  f_tuition_reimb: '$16,000',
  total_direct_nf: '$413,824.50',
  total_direct_f: '$796,289',
  total_program_costs: '$1,210,113.50',
  federal_reimb_50pct: '$398,144.50',
  j_salary_narrative: 'SNAP E&T Case Manager, program coordination, community services director, authorized representative, placement specialist, and instructor stipends across credential tracks.',
  j_fringe_narrative: 'Fringe benefits calculated at 15% of federal salary. Covers FICA, health insurance contribution, workers compensation, and unemployment insurance.',
  j_materials_narrative: 'Curriculum materials, workbooks, testing prep materials, PPE kits, and program-specific consumables distributed to participants.',
  j_rent_narrative: 'Proportional share of active training site leases based on square footage and program hours per site.',
  j_transport_narrative: 'Bus passes, mileage reimbursement, and rideshare support for participants.',
  j_tuition_narrative: 'Credential exam registration, proctoring fees, and state licensing fees.',
  j_inkind_narrative: 'Volunteer instructor time documented via sign-in logs and time-and-effort records.',
  j_indirect_narrative: `No indirect costs claimed. ${PLATFORM_DEFAULTS.orgName} does not have a Negotiated Indirect Cost Rate Agreement (NICRA) on file. All costs are direct and documented. This is consistent with the organization's current federal award structure.`,
  reimb_unduplicated: '150',
  reimb_monthly_dup: '60',
  reimb_annual_budget: '$70,000',
  reimb_monthly_budget: '$5,833',
  reimb_per_participant: '$97',
  submission_date: 'April 28, 2026',
  signature_name: 'Elizabeth Greene',
  signature_title: 'Executive Director',
  signature_org: `2exclusive llc-s dba ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute`,
  signature_date: '02/28/2026',
};

const SECTIONS: Array<{ title: string; fields: Array<[string, string, boolean?]> }> = [
  {
    title: '1. Organization Information',
    fields: [
      ['legal_name', 'Legal Organization Name'],
      ['org_type', 'Organization Type'],
      ['ein', 'EIN'],
      ['uei', 'UEI (SAM.gov)'],
      ['address', 'Street Address'],
      ['city', 'City'],
      ['state', 'State'],
      ['zip', 'ZIP'],
      ['rep_name', 'Authorized Representative'],
      ['rep_title', 'Title'],
      ['rep_phone', 'Phone'],
      ['rep_email', 'Email'],
    ],
  },
  {
    title: '2. Program Details',
    fields: [
      ['program_name', 'Program Name'],
      ['program_type', 'Program Type'],
      ['delivery_mode', 'Delivery Mode'],
      ['program_duration', 'Program Duration'],
      ['structured_hours', 'Structured Hours / Week'],
      ['supervised_hours', 'Supervised Hours / Week'],
      ['total_weekly_hours', 'Total Weekly Hours'],
      ['counties', 'Counties Served'],
      ['training_sites', 'Training Sites', true],
      ['credentials', 'Credential Programs Offered', true],
    ],
  },
  {
    title: '3. Participant Projections',
    fields: [
      ['total_participants', 'Total Annual Participants'],
      ['snap_recipients', 'SNAP Recipients'],
      ['abawd_participants', 'ABAWD Participants'],
      ['completion_rate', 'Expected Completion Rate'],
      ['placement_rate', 'Expected 90-Day Job Placement Rate'],
    ],
  },
  {
    title: '5. FSSA Cost Plan',
    fields: [
      ['nf_salary', 'Salary / Wages (Non-Federal)'],
      ['f_salary', 'Salary / Wages (Federal)'],
      ['f_fringe', 'Fringe Benefits'],
      ['nf_materials', 'Materials / Supplies (Non-Federal)'],
      ['f_materials', 'Materials / Supplies (Federal)'],
      ['nf_rent', 'Building Space / Rent (Non-Federal)'],
      ['f_rent', 'Building Space / Rent (Federal)'],
      ['nf_inkind', 'State In-Kind Contribution'],
      ['f_transport_reimb', 'Transportation Reimbursements'],
      ['f_tuition_reimb', 'Tuition / Training Costs'],
      ['total_direct_nf', 'Total Non-Federal Share'],
      ['total_direct_f', 'Total Federal Share'],
      ['total_program_costs', 'Total Program Costs'],
      ['federal_reimb_50pct', 'Est. Federal Reimbursement (50%)'],
    ],
  },
  {
    title: 'Section J - Budget Narrative & Justification',
    fields: [
      ['j_salary_narrative', 'Salary / Wages Narrative', true],
      ['j_fringe_narrative', 'Fringe Benefits Narrative', true],
      ['j_materials_narrative', 'Materials / Supplies Narrative', true],
      ['j_rent_narrative', 'Building Space / Rent Narrative', true],
      ['j_transport_narrative', 'Transportation Reimbursements Narrative', true],
      ['j_tuition_narrative', 'Tuition / Training Costs Narrative', true],
      ['j_inkind_narrative', 'In-Kind Contributions Narrative', true],
      ['j_indirect_narrative', 'Indirect Costs Narrative', true],
    ],
  },
  {
    title: '6. Participant Reimbursements',
    fields: [
      ['reimb_unduplicated', 'Unduplicated Annual Count'],
      ['reimb_monthly_dup', 'Monthly Duplicated Count'],
      ['reimb_annual_budget', 'Annual Budget'],
      ['reimb_monthly_budget', 'Monthly Budget'],
      ['reimb_per_participant', 'Per Participant / Month'],
    ],
  },
  {
    title: '9. Compliance & Authorized Signature',
    fields: [
      ['submission_date', 'Submission Date'],
      ['signature_date', 'Signature Date'],
      ['signature_name', 'Authorized Representative'],
      ['signature_title', 'Title'],
      ['signature_org', 'Organization Name'],
    ],
  },
];

function Field({ label, name, value, onChange, textarea }: {
  label: string;
  name: string;
  value: string;
  onChange: (k: string, v: string) => void;
  textarea?: boolean;
}) {
  const base = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white';
  return (
    <div className={textarea ? 'col-span-2' : 'col-span-1'}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      {textarea ? (
        <textarea rows={4} className={base} value={value} onChange={e => onChange(name, e.target.value)} />
      ) : (
        <input type="text" className={base} value={value} onChange={e => onChange(name, e.target.value)} />
      )}
    </div>
  );
}

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 12px;font-weight:600;color:#475569;width:220px;vertical-align:top">${label}</td><td style="padding:6px 12px;color:#0f172a">${value.replace(/\n/g, '<br/>')}</td></tr>`;
}

function buildEmailHtml(form: FormState): string {
  const sections = SECTIONS.map(section => {
    const rows = section.fields.map(([name, label]) => row(label, form[name] ?? '')).join('');
    return `<h2 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#1e293b;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin:28px 0 12px">${section.title}</h2><table style="width:100%;border-collapse:collapse;font-size:13px">${rows}</table>`;
  }).join('');

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#0f172a">
    <div style="background:#1e293b;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
      <p style="margin:0;font-size:11px;opacity:.7">STATE OF INDIANA - Family and Social Services Administration - Division of Family Resources</p>
      <h1 style="margin:8px 0 4px;font-size:20px">SNAP Employment &amp; Training Program</h1>
      <p style="margin:0;font-size:14px;opacity:.85">Third Party Provider (TPP) Application Questionnaire</p>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:16px 24px;font-size:12px;color:#475569">
      <strong>Submitting Organization:</strong> ${form.legal_name} &nbsp;|&nbsp; <strong>EIN:</strong> ${form.ein} &nbsp;|&nbsp; <strong>UEI:</strong> ${form.uei}<br/>
      <strong>Primary Contact:</strong> ${form.rep_name} &nbsp; ${form.rep_phone} &nbsp; ${form.rep_email}<br/>
      <strong>Submission Date:</strong> ${form.submission_date}
    </div>
    <div style="padding:0 8px">${sections}</div>
  </body></html>`;
}

export default function SnapEtClient() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(k: string, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'elevate4humanityedu@gmail.com',
          subject: `SNAP E&T TPP Application - ${form.program_name}`,
          html: buildEmailHtml(form),
          fromName: 'Elevate Admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Send failed');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="text-lg font-semibold text-slate-900">Application sent to elevate4humanityedu@gmail.com</p>
        <button onClick={() => setSent(false)} className="text-sm text-brand-blue-600 hover:underline">Edit &amp; resend</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-800 mb-8">
        All fields are pre-filled from the submitted application. Edit any field before sending.
      </div>

      {SECTIONS.map(section => (
        <section key={section.title} className="mb-8">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-wide">{section.title}</h2>
          <div className="grid grid-cols-2 gap-4">
            {section.fields.map(([name, label, textarea]) => (
              <Field key={name} name={name} label={label} value={form[name] ?? ''} onChange={update} textarea={textarea} />
            ))}
          </div>
        </section>
      ))}

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending...' : 'Send to elevate4humanityedu@gmail.com'}
        </button>
      </div>
    </div>
  );
}
