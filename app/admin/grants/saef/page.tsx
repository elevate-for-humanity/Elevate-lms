'use client';

import { useState } from 'react';
import { ExternalLink, Send, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Elevate for Humanity — SAEF 3 Round 2 Application Data ───────────────────
// All answers sourced from repo data (data/team.ts, efh-config.json, contact page)
// Form: https://docs.google.com/forms/d/e/1FAIpQLScqiIUAO2CCKOkG_h3cqvrWXCt4U0SUyLZo2rLYb4V8wrcU1g/viewform

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScqiIUAO2CCKOkG_h3cqvrWXCt4U0SUyLZo2rLYb4V8wrcU1g/viewform';

const APPLICATION_DATA = {
  // ── Section 1: Organization Info ──────────────────────────────────────────
  organizationName: '2Exclusive LLC (DBA: Elevate for Humanity Technical and Career Institute)',
  address: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
  primaryContact: 'Elizabeth Greene, Founder & Chief Executive Officer',
  phone: '(317) 314-3757',
  email: 'elevate4humanityedu@gmail.com',
  organizationType: 'Nonprofit',

  // ── Section 2: Organizational Eligibility ─────────────────────────────────
  samRegistration: 'Yes — CAGE Code: 0QH19 (2Exclusive LLC-S, DBA: Elevate for Humanity Technical and Career Institute) · UEI: VX2GK5S8SZH8 · Active through June 29, 2026',
  registeredBidder: 'Yes — SAM.gov registered, active federal government contractor. CAGE: 0QH19.',
  dolSponsor: 'Yes — DOL Registered Apprenticeship Sponsor',
  ein: 'Available upon request',

  // ── Section 3: Grant Categories Selected ──────────────────────────────────
  categoriesSelected: [
    'Teacher RTI (RAP) — $104,650 (9 min. enrollments)',
    'Paraeducator RTI (RAP) — $43,750 (7 min. enrollments)',
    'Pre-Apprenticeship (25 min. enrollments) — $21,562',
  ],
  totalRequested: '$170,000 (within $400,000 cap)',

  // ── Section 4: Employer Partner ───────────────────────────────────────────
  employerPartner: 'Selfish Inc., a 501(c)(3) nonprofit based in Indianapolis, Indiana. Registered employer partner actively participating in apprenticeship programs sponsored by 2Exclusive LLC (DBA: Elevate for Humanity Technical and Career Institute), a DOL Registered Apprenticeship Sponsor. Currently employing apprentices in workforce development and community services roles in Indiana.',
  employerState: 'Indiana',
  employerStatus: 'In good standing with the State of Indiana',

  // ── Section 5: Program Narrative ──────────────────────────────────────────
  statementOfNeed: `Indiana faces a critical shortage of qualified educators and paraeducators, particularly in underserved urban communities. Indianapolis Public Schools and surrounding Marion County districts report persistent vacancies in classroom teaching and paraeducator roles. Many aspiring educators lack access to affordable, structured pathways that allow them to earn while they learn. Elevate for Humanity, a DOL Registered Apprenticeship Sponsor and ETPL-approved provider, is uniquely positioned to address this gap. We serve justice-involved individuals, veterans, low-income adults, and career changers — populations most likely to remain in Indiana communities long-term. Our existing partnerships with WorkOne, EmployIndy, and the Indiana Department of Workforce Development provide a proven infrastructure for participant recruitment, wraparound support, and data reporting.`,

  programDescription: `Elevate for Humanity will launch and expand Registered Apprenticeship Programs (RAPs) for Teachers and Paraeducators in partnership with Indiana-based school districts. Apprentices will complete 2,000 hours of On-the-Job Learning (OJL) per 12-month period under the supervision of a qualified mentor, combined with Related Technical Instruction (RTI) delivered through accredited postsecondary partners. The program will also operate a Certified Pre-Apprenticeship pathway for individuals not yet ready for full RAP enrollment, providing a structured on-ramp with a minimum of 25 participants. All participants will be entered into Indiana Career Connect and RAPIDS per federal reporting requirements. Elevate will participate in quarterly AiHUB meetings and submit all required financial and outcome reports within 15 days of each quarter end.`,

  objectives: `1. Enroll a minimum of 9 Teacher apprentices and 7 Paraeducator apprentices in DOL-registered RAPs within 90 days of award.
2. Launch a Certified Pre-Apprenticeship cohort of 25+ participants within 60 days of award.
3. Achieve 80%+ retention rate across all apprenticeship categories through wraparound case management.
4. Enter 100% of participants into Indiana Career Connect and RAPIDS within 30 days of enrollment.
5. Submit all quarterly reports and invoices within the required 15-day window.
6. Participate in all quarterly AiHUB community of practice meetings.`,

  methods: `Recruitment: Elevate will leverage existing partnerships with WorkOne Indianapolis, EmployIndy, Job Ready Indy, and HSI affiliates to recruit qualified candidates. Targeted outreach will focus on paraprofessionals already working in schools who seek to advance to teaching roles, career changers, veterans, and justice-involved individuals.

Training Delivery: RTI will be delivered through accredited postsecondary partners. OJL will be conducted at employer partner school sites under qualified mentor supervision. Mentors will receive structured training and stipends as outlined in the grant budget.

Case Management: Elevate's Program Coordinator and Director of Enrollment will provide ongoing case management, documentation collection, and compliance support. All participant records will be maintained in audit-ready format per DWD-WBLA requirements.

Data & Reporting: All participants will be entered into Indiana Career Connect and RAPIDS. Quarterly financial and outcome reports will be submitted using DWD-provided templates within 15 days of each quarter end.`,

  outcomes: `- Minimum 16 new Registered Apprentices (9 Teacher + 7 Paraeducator) enrolled and active
- Minimum 25 Pre-Apprenticeship participants enrolled
- 80%+ program retention rate
- 100% of participants entered into Indiana Career Connect and RAPIDS
- All quarterly reports submitted on time
- Contribution toward statewide targets: 550 total participants, 5 new RAPs, 10 expanded RAPs`,

  // ── Section 6: Budget Narrative ───────────────────────────────────────────
  budgetNarrative: `Teacher RTI (RAP): $86,500 RTI + $4,500 Mentoring + $5,000 Admin + $8,650 Case Management = $104,650
  - RTI covers tuition, testing/certification fees, tools, books, and required materials for 9 apprentices
  - Mentoring covers structured mentor training and stipends for qualified mentors
  - Admin/Case Management covers program management, compliance, reporting, data entry, and audit-ready recordkeeping

Paraeducator RTI (RAP): $35,000 RTI + $3,500 Mentoring + $1,750 Admin + $3,500 Case Management = $43,750
  - RTI covers tuition, certification fees, and required materials for 7 apprentices
  - Mentoring and case management as above

Pre-Apprenticeship (25 participants): $18,750 RTI + $937 Admin + $1,875 Case Management = $21,562
  - RTI covers instruction costs for 25 pre-apprentices
  - No mentoring component per RFA guidelines

Total Requested: $170,000
No financial match required per SAEF 3 Competitive Grant terms.
No wage subsidies or supplanting of other committed funds included.
All costs align with allowable uses as defined in the RFA.`,

  // ── Section 7: Capacity & Experience ─────────────────────────────────────
  organizationalCapacity: `2Exclusive LLC (DBA: Elevate for Humanity Technical and Career Institute) is a DOL Registered Apprenticeship Sponsor, ETPL provider, WRG/WIOA/Job Ready Indy approved organization with active partnerships across Indiana's workforce ecosystem. Key credentials include:
- SAM.gov registered (CAGE: 0QH19, UEI: VX2GK5S8SZH8), active federal government contractor, active through June 29, 2026
- ByBlack certified
- CareerSafe OSHA provider, curriculum partner, NRF Rise Up provider, Certiport CATC
- WorkOne partner, EmployIndy partner, Job Ready Indy partner, HSI affiliate
- Led by Elizabeth Greene: U.S. Army veteran, IRS Enrolled Agent, licensed barber, Indiana substitute teacher, EPA 608 Certified Proctor
- Financial oversight by Dr. Carlina Wilkes: 24+ years federal experience with DFAS, DoD Financial Management Certification Level II
- Existing infrastructure for participant documentation, data reporting, and grant compliance`,

  // ── Section 8: AiHUB Commitment ───────────────────────────────────────────
  aihubCommitment: 'Yes — Elevate for Humanity commits to participating in all quarterly AiHUB community of practice meetings as required by the grant.',

  // ── Section 9: Reporting Commitment ──────────────────────────────────────
  reportingCommitment: 'Yes — Elevate for Humanity will submit all quarterly Performance Progress Reports, Financial Data reports, and Data/Evaluation reports within 15 days of each quarter end using DWD-provided templates.',
};

type SectionKey = 'org' | 'eligibility' | 'categories' | 'partner' | 'narrative' | 'budget' | 'capacity' | 'commitments';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'org', label: 'Organization Information' },
  { key: 'eligibility', label: 'Organizational Eligibility' },
  { key: 'categories', label: 'Grant Categories' },
  { key: 'partner', label: 'Employer Partner' },
  { key: 'narrative', label: 'Program Narrative' },
  { key: 'budget', label: 'Budget Narrative' },
  { key: 'capacity', label: 'Organizational Capacity' },
  { key: 'commitments', label: 'AiHUB & Reporting Commitments' },
];

function Field({ label, value }: { label: string; value: string | string[] }) {
  const [copied, setCopied] = useState(false);
  const text = Array.isArray(value) ? value.join('\n') : value;

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        <button
          onClick={copy}
          className="text-xs text-brand-blue-600 hover:underline flex items-center gap-1"
        >
          {copied ? <><CheckCircle className="w-3 h-3 text-green-500" /> Copied</> : 'Copy'}
        </button>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap font-mono">
        {text}
      </div>
    </div>
  );
}

function Section({ label, children, defaultOpen = false }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 text-left"
      >
        <span className="font-semibold text-gray-900">{label}</span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="px-5 py-4 border-t border-gray-100 bg-white">{children}</div>}
    </div>
  );
}

export default function SAEFApplicationPage() {
  const openForm = () => window.open(FORM_URL, '_blank');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-brand-green-100 text-brand-green-700 text-xs font-bold px-2 py-1 rounded-full">SAEF 3 — ROUND 2</span>
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">DEADLINE: APR 10, 2025</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Education & Advanced Manufacturing/Logistics</h1>
              <p className="text-gray-500 text-sm mt-1">Indiana DWD — Apprenticeship Grant Opportunity · Up to $400,000</p>
            </div>
            <button
              onClick={openForm}
              className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Google Form
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-5 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-brand-blue-800">
                <p className="font-semibold mb-1">How to submit:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click <strong>Open Google Form</strong> above — the form opens in a new tab</li>
                  <li>For each field, click <strong>Copy</strong> next to the answer below</li>
                  <li>Paste into the corresponding field in the Google Form</li>
                  <li>Hit <strong>Submit</strong> in the Google Form when all fields are filled</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Funding Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Teacher RAP', amount: '$104,650', min: '9 enrollments' },
            { label: 'Paraeducator RAP', amount: '$43,750', min: '7 enrollments' },
            { label: 'Pre-Apprenticeship', amount: '$21,562', min: '25 enrollments' },
          ].map((cat) => (
            <div key={cat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{cat.label}</p>
              <p className="text-xl font-bold text-brand-green-600">{cat.amount}</p>
              <p className="text-xs text-gray-400">{cat.min}</p>
            </div>
          ))}
        </div>

        {/* All Sections */}
        <Section label="Section 1 — Organization Information" defaultOpen>
          <Field label="Organization Name" value={APPLICATION_DATA.organizationName} />
          <Field label="Address" value={APPLICATION_DATA.address} />
          <Field label="Primary Contact Person & Title" value={APPLICATION_DATA.primaryContact} />
          <Field label="Phone" value={APPLICATION_DATA.phone} />
          <Field label="Email" value={APPLICATION_DATA.email} />
          <Field label="Organization Type" value={APPLICATION_DATA.organizationType} />
        </Section>

        <Section label="Section 2 — Organizational Eligibility">
          <Field label="SAM.gov Registration / CAGE Code" value={APPLICATION_DATA.samRegistration} />
          <Field label="Registered Bidder Status (Indiana)" value={APPLICATION_DATA.registeredBidder} />
          <Field label="DOL Registered Apprenticeship Sponsor" value={APPLICATION_DATA.dolSponsor} />
          <Field label="EIN" value={APPLICATION_DATA.ein} />
        </Section>

        <Section label="Section 3 — Grant Categories Selected">
          <Field label="Categories Applied For" value={APPLICATION_DATA.categoriesSelected} />
          <Field label="Total Funding Requested" value={APPLICATION_DATA.totalRequested} />
        </Section>

        <Section label="Section 4 — Employer Partner">
          <Field label="Employer Partner Name & Description" value={APPLICATION_DATA.employerPartner} />
          <Field label="State" value={APPLICATION_DATA.employerState} />
          <Field label="Standing" value={APPLICATION_DATA.employerStatus} />
        </Section>

        <Section label="Section 5 — Program Narrative">
          <Field label="Statement of Need" value={APPLICATION_DATA.statementOfNeed} />
          <Field label="Program Description" value={APPLICATION_DATA.programDescription} />
          <Field label="Objectives" value={APPLICATION_DATA.objectives} />
          <Field label="Methods" value={APPLICATION_DATA.methods} />
          <Field label="Expected Outcomes" value={APPLICATION_DATA.outcomes} />
        </Section>

        <Section label="Section 6 — Budget Narrative">
          <Field label="Budget Narrative" value={APPLICATION_DATA.budgetNarrative} />
        </Section>

        <Section label="Section 7 — Organizational Capacity">
          <Field label="Organizational Capacity & Experience" value={APPLICATION_DATA.organizationalCapacity} />
        </Section>

        <Section label="Section 8 — AiHUB & Reporting Commitments">
          <Field label="AiHUB Participation Commitment" value={APPLICATION_DATA.aihubCommitment} />
          <Field label="Reporting Commitment" value={APPLICATION_DATA.reportingCommitment} />
        </Section>

        {/* Submit CTA */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Ready to Submit?</h2>
          <p className="text-gray-500 text-sm mb-4">Open the Google Form, paste all answers, and submit before April 10, 2025 at 5:00 PM ET.</p>
          <button
            onClick={openForm}
            className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            <Send className="w-5 h-5" />
            Open & Submit Google Form
          </button>
        </div>

      </div>
    </div>
  );
}
