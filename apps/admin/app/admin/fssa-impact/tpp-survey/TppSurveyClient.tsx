// ARCHIVED — FSSA SNAP E&T program ended. Do not import or extend.
'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// FSSA DFR Third Party Provider (TPP) Questionnaire
// Sections mirror the actual Indiana FSSA SNAP E&T TPP application

type SurveyData = {
  // Section 1 — Organization
  org_name: string;
  org_type: string;
  ein: string;
  uei: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  // Section 2 — Program
  program_name: string;
  program_type: string;
  delivery_mode: string;
  counties_served: string[];
  duration_weeks: string;
  weekly_hours_structured: string;
  weekly_hours_supervised: string;
  // Section 3 — Participant Projections
  total_participants: string;
  snap_participants: string;
  abawd_participants: string;
  completion_rate: string;
  placement_rate: string;
  // Section 4 — Services
  provides_training: boolean;
  provides_case_management: boolean;
  provides_job_placement: boolean;
  supportive_services: string[];
  // Section 5 — FSSA Cost Plan (mirrors official FSSA budget table)
  // I. Direct Program & Admin Costs
  salary_wages_nonfed: string;
  salary_wages_fed: string;
  fringe_rate: string;           // approved fringe benefit rate %
  fringe_nonfed: string;
  fringe_fed: string;
  noncapital_equipment_nonfed: string;
  noncapital_equipment_fed: string;
  materials_nonfed: string;
  materials_fed: string;
  travel_nonfed: string;
  travel_fed: string;
  building_space_nonfed: string;
  building_space_fed: string;
  capital_expenditures_nonfed: string;
  capital_expenditures_fed: string;
  // II. Indirect Costs
  indirect_rate: string;         // approved indirect cost rate %
  indirect_nonfed: string;
  indirect_fed: string;
  // III. In-kind / Allocated
  state_inkind_nonfed: string;
  state_inkind_fed: string;
  allocated_costs_nonfed: string;
  allocated_costs_fed: string;
  // IV. Participant Reimbursements (Supportive Services)
  transportation_reimb_nonfed: string;
  transportation_reimb_fed: string;
  tuition_nonfed: string;
  tuition_fed: string;
  // Legacy fields kept for compatibility
  total_program_cost: string;
  snap_eligible_costs: string;
  personnel_cost: string;
  training_cost: string;
  support_services_cost: string;
  admin_cost: string;
  // Section 6 — Compliance
  etpl_listed: boolean;
  dol_registered: boolean;
  liability_insurance: boolean;
  background_check_policy: boolean;
  data_privacy_policy: boolean;
  compliance_notes: string;
};

const INITIAL: SurveyData = {
  org_name: `2Exclusive LLC-S (DBA: ${PLATFORM_DEFAULTS.orgLegalName})`,
  org_type: 'nonprofit',
  ein: '',
  uei: 'VX2GK5S8SZH8',
  address: '8888 Keystone Crossing, Suite 1300',
  city: 'Indianapolis',
  state: 'IN',
  zip: '46240',
  contact_name: 'Elizabeth Greene',
  contact_title: 'Founder & Chief Executive Officer',
  contact_email: 'elevate4humanityedu@gmail.com',
  contact_phone: PLATFORM_DEFAULTS.supportPhone,
  program_name: 'SNAP E&T Workforce Credential Program',
  program_type: 'vocational_training',
  delivery_mode: 'hybrid',
  counties_served: ['Marion'],
  duration_weeks: '4',
  weekly_hours_structured: '20',
  weekly_hours_supervised: '10',
  total_participants: '150',
  snap_participants: '150',
  abawd_participants: '75',
  completion_rate: '82',
  placement_rate: '74',
  provides_training: true,
  provides_case_management: true,
  provides_job_placement: true,
  supportive_services: ['transportation', 'work_clothing', 'testing_fees', 'childcare', 'tools', 'housing_referral', 'mental_health'],
  // FSSA Cost Plan
  salary_wages_nonfed: '',
  salary_wages_fed: '100000',
  fringe_rate: '15',
  fringe_nonfed: '',
  fringe_fed: '',
  noncapital_equipment_nonfed: '',
  noncapital_equipment_fed: '',
  materials_nonfed: '',
  materials_fed: '50000',
  travel_nonfed: '',
  travel_fed: '',
  building_space_nonfed: '',
  building_space_fed: '',
  capital_expenditures_nonfed: '',
  capital_expenditures_fed: '',
  indirect_rate: '0',
  indirect_nonfed: '0',
  indirect_fed: '0',
  state_inkind_nonfed: '5000',
  state_inkind_fed: '0',
  allocated_costs_nonfed: '0',
  allocated_costs_fed: '0',
  transportation_reimb_nonfed: '0',
  transportation_reimb_fed: '24000',
  tuition_nonfed: '0',
  tuition_fed: '9000',
  // Legacy
  total_program_cost: '743153',
  snap_eligible_costs: '743153',
  personnel_cost: '556140',
  training_cost: '45925',
  support_services_cost: '70000',
  admin_cost: '0',
  etpl_listed: true,
  dol_registered: true,
  liability_insurance: true,
  background_check_policy: true,
  data_privacy_policy: true,
  compliance_notes: '',
};

const INDIANA_COUNTIES = [
  'Adams','Allen','Bartholomew','Benton','Blackford','Boone','Brown','Carroll',
  'Cass','Clark','Clay','Clinton','Crawford','Daviess','Dearborn','Decatur',
  'Delaware','Dubois','Elkhart','Fayette','Floyd','Franklin','Fulton','Gibson',
  'Grant','Greene','Hamilton','Hancock','Harrison','Hendricks','Henry','Howard',
  'Huntington','Jackson','Jasper','Jay','Jefferson','Jennings','Johnson','Knox',
  'Kosciusko','Lake','LaPorte','Lawrence','Madison','Marion','Marshall','Miami',
  'Monroe','Montgomery','Morgan','Newton','Noble','Orange','Owen','Parke','Perry',
  'Pike','Porter','Posey','Pulaski','Putnam','Randolph','Ripley','Rush',
  'St. Joseph','Scott','Shelby','Spencer','Starke','Steuben','Sullivan',
  'Tippecanoe','Tipton','Union','Vanderburgh','Vermillion','Vigo','Wabash',
  'Warren','Warrick','Washington','Wayne','Wells','White','Whitley',
];

const SUPPORTIVE_SERVICE_OPTIONS = [
  {
    value: 'transportation',
    label: 'Transportation Assistance',
    detail: 'Bus passes, mileage reimbursement, or rideshare support to attend training and employment.',
  },
  {
    value: 'work_clothing',
    label: 'Work Clothing / Uniforms',
    detail: 'Scrubs, safety gear, steel-toed boots, or professional attire required for the credential program.',
  },
  {
    value: 'testing_fees',
    label: 'Credential Testing Fees',
    detail: 'Exam registration, proctoring, and certification fees (e.g., NHA, EPA 608, CompTIA).',
  },
  {
    value: 'childcare',
    label: 'Childcare Referrals',
    detail: 'Referrals to licensed childcare providers and CCDF subsidy navigation support.',
  },
  {
    value: 'tools',
    label: 'Tools / Equipment',
    detail: 'Program-required tools, kits, or equipment participants must have to complete hands-on training.',
  },
  {
    value: 'housing_referral',
    label: 'Housing Referrals',
    detail: 'Connections to emergency housing, transitional housing programs, and rental assistance resources.',
  },
  {
    value: 'mental_health',
    label: 'Mental Health & Disability Needs',
    detail: 'Referrals to licensed counselors, crisis support lines, and disability accommodation coordination. Includes screening for anxiety, depression, trauma, and co-occurring disorders that may affect participation.',
  },
];

function fmt$(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const SECTIONS = [
  'Organization Info',
  'Program Details',
  'Participant Projections',
  'Services Provided',
  'Budget Breakdown',
  'Compliance & Certifications',
  'Review & Submit',
];

export default function TppSurveyClient() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SurveyData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof SurveyData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCounty = (c: string) =>
    setForm((prev) => ({
      ...prev,
      counties_served: prev.counties_served.includes(c)
        ? prev.counties_served.filter((x) => x !== c)
        : [...prev.counties_served, c],
    }));

  const toggleService = (v: string) =>
    setForm((prev) => ({
      ...prev,
      supportive_services: prev.supportive_services.includes(v)
        ? prev.supportive_services.filter((x) => x !== v)
        : [...prev.supportive_services, v],
    }));

  const totalWeeklyHours = (parseInt(form.weekly_hours_structured || '0') + parseInt(form.weekly_hours_supervised || '0'));
  const snapEligibleCosts = parseFloat(form.snap_eligible_costs || '0');
  const estimatedReimbursement = snapEligibleCosts * 0.5;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/fssa/tpp-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to save survey.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">TPP Survey Saved</h2>
        <p className="text-slate-500 mb-6">Your FSSA Third Party Provider questionnaire responses have been saved. Use this data when completing the official FSSA portal submission.</p>
        <button onClick={() => { setSubmitted(false); setStep(0); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          Edit Responses
        </button>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1">
        {SECTIONS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <button
              onClick={() => setStep(i)}
              className={`flex-1 h-1.5 rounded-full transition ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">{SECTIONS[step]}</h2>
        <span className="text-xs text-slate-400">Step {step + 1} of {SECTIONS.length}</span>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Section 1 — Organization */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Legal Organization Name</label>
              <input className={inputCls} value={form.org_name} onChange={e => set('org_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Organization Type</label>
              <select className={inputCls} value={form.org_type} onChange={e => set('org_type', e.target.value)}>
                <option value="nonprofit">Nonprofit / 501(c)(3)</option>
                <option value="for_profit">For-Profit</option>
                <option value="government">Government Agency</option>
                <option value="educational">Educational Institution</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>EIN (Federal Tax ID)</label>
              <input className={inputCls} value={form.ein} onChange={e => set('ein', e.target.value)} placeholder="XX-XXXXXXX" />
            </div>
            <div>
              <label className={labelCls}>UEI (SAM.gov)</label>
              <input className={inputCls} value={form.uei} onChange={e => set('uei', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Street Address</label>
              <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>ZIP</label>
              <input className={inputCls} value={form.zip} onChange={e => set('zip', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Primary Contact Name</label>
              <input className={inputCls} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={form.contact_title} onChange={e => set('contact_title', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Section 2 — Program */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Program Name</label>
              <input className={inputCls} value={form.program_name} onChange={e => set('program_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Program Type</label>
              <select className={inputCls} value={form.program_type} onChange={e => set('program_type', e.target.value)}>
                <option value="vocational_training">Short-term vocational training</option>
                <option value="job_search">Job search / job search training</option>
                <option value="work_experience">Work experience</option>
                <option value="education">Education (ABE/GED)</option>
                <option value="community_service">Community service</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Delivery Mode</label>
              <select className={inputCls} value={form.delivery_mode} onChange={e => set('delivery_mode', e.target.value)}>
                <option value="in_person">In-person</option>
                <option value="hybrid">Hybrid</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Duration (weeks)</label>
              <input type="number" className={inputCls} value={form.duration_weeks} onChange={e => set('duration_weeks', e.target.value)} min="1" />
            </div>
            <div>
              <label className={labelCls}>Structured Hours / Week</label>
              <input type="number" className={inputCls} value={form.weekly_hours_structured} onChange={e => set('weekly_hours_structured', e.target.value)} min="0" />
            </div>
            <div>
              <label className={labelCls}>Supervised Activity Hours / Week</label>
              <input type="number" className={inputCls} value={form.weekly_hours_supervised} onChange={e => set('weekly_hours_supervised', e.target.value)} min="0" />
            </div>
          </div>
          <div className={`rounded-lg px-4 py-3 text-sm font-medium ${totalWeeklyHours >= 20 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            Total weekly hours: <strong>{totalWeeklyHours}</strong> — ABAWD minimum is 20 hrs/week
          </div>
          <div>
            <label className={labelCls}>Counties Served</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
              {INDIANA_COUNTIES.map(c => (
                <label key={c} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.counties_served.includes(c)} onChange={() => toggleCounty(c)} className="rounded border-slate-300 text-blue-600" />
                  {c}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 3 — Projections */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
            Be defensible. FSSA will verify these numbers against monthly reports. Inflate and you will get flagged.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Total Participants (annual)</label>
              <input type="number" className={inputCls} value={form.total_participants} onChange={e => set('total_participants', e.target.value)} min="0" />
            </div>
            <div>
              <label className={labelCls}>SNAP Recipients</label>
              <input type="number" className={inputCls} value={form.snap_participants} onChange={e => set('snap_participants', e.target.value)} min="0" />
            </div>
            <div>
              <label className={labelCls}>ABAWD Participants</label>
              <input type="number" className={inputCls} value={form.abawd_participants} onChange={e => set('abawd_participants', e.target.value)} min="0" />
            </div>
            <div>
              <label className={labelCls}>Expected Completion Rate (%)</label>
              <input type="number" className={inputCls} value={form.completion_rate} onChange={e => set('completion_rate', e.target.value)} min="0" max="100" />
            </div>
            <div>
              <label className={labelCls}>Expected Job Placement Rate (90-day) (%)</label>
              <input type="number" className={inputCls} value={form.placement_rate} onChange={e => set('placement_rate', e.target.value)} min="0" max="100" />
            </div>
          </div>
        </div>
      )}

      {/* Section 4 — Services */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            {[
              { field: 'provides_training' as const, label: 'Vocational / skills training' },
              { field: 'provides_case_management' as const, label: 'Case management' },
              { field: 'provides_job_placement' as const, label: 'Job placement assistance' },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form[field] as boolean} onChange={e => set(field, e.target.checked)} className="rounded border-slate-300 text-blue-600 w-4 h-4" />
                {label}
              </label>
            ))}
          </div>
          <div>
            <label className={labelCls}>Supportive Services Provided</label>
            <p className="text-xs text-slate-500 mb-3">Select all services your organization provides or coordinates for SNAP E&amp;T participants.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              {SUPPORTIVE_SERVICE_OPTIONS.map(s => (
                <label
                  key={s.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    form.supportive_services.includes(s.value)
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.supportive_services.includes(s.value)}
                    onChange={() => toggleService(s.value)}
                    className="rounded border-slate-300 text-blue-600 w-4 h-4 mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-800 block">{s.label}</span>
                    <span className="text-xs text-slate-500 leading-snug">{s.detail}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 5 — Budget */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Total Program Cost ($)</label>
              <input type="number" className={inputCls} value={form.total_program_cost} onChange={e => set('total_program_cost', e.target.value)} min="0" />
            </div>
            <div>
              <label className={labelCls}>SNAP-Eligible Costs ($)</label>
              <input type="number" className={inputCls} value={form.snap_eligible_costs} onChange={e => set('snap_eligible_costs', e.target.value)} min="0" />
            </div>
            <div>
              <label className={labelCls}>Personnel / Instruction ($)</label>
              <input type="number" className={inputCls} value={form.personnel_cost} onChange={e => set('personnel_cost', e.target.value)} min="0" />
            </div>
            <div>
              <label className={labelCls}>Training Materials ($)</label>
              <input type="number" className={inputCls} value={form.training_cost} onChange={e => set('training_cost', e.target.value)} min="0" />
            </div>
            <div>
              <label className={labelCls}>Support Services ($)</label>
              <input type="number" className={inputCls} value={form.support_services_cost} onChange={e => set('support_services_cost', e.target.value)} min="0" />
            </div>
            <div>
              <label className={labelCls}>Administrative / Indirect ($)</label>
              <input type="number" className={inputCls} value={form.admin_cost} onChange={e => set('admin_cost', e.target.value)} min="0" />
            </div>
          </div>
          {snapEligibleCosts > 0 && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-sm text-emerald-700">
                Estimated SNAP E&T reimbursement (50% of eligible costs):{' '}
                <strong className="text-emerald-800">{fmt$(estimatedReimbursement)}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section 6 — Compliance */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { field: 'etpl_listed' as const, label: 'Listed on Indiana ETPL (Eligible Training Provider List)' },
              { field: 'dol_registered' as const, label: 'DOL Registered Apprenticeship Sponsor (if applicable)' },
              { field: 'liability_insurance' as const, label: 'General liability insurance in force' },
              { field: 'background_check_policy' as const, label: 'Background check policy for staff working with participants' },
              { field: 'data_privacy_policy' as const, label: 'Written data privacy / FERPA compliance policy' },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form[field] as boolean} onChange={e => set(field, e.target.checked)} className="rounded border-slate-300 text-blue-600 w-4 h-4" />
                {label}
              </label>
            ))}
          </div>
          <div>
            <label className={labelCls}>Additional Compliance Notes</label>
            <textarea className={inputCls} rows={3} value={form.compliance_notes} onChange={e => set('compliance_notes', e.target.value)} placeholder="Accreditations, certifications, prior FSSA experience..." />
          </div>
        </div>
      )}

      {/* Section 7 — Review */}
      {step === 6 && (
        <div className="space-y-4 text-sm">
          <div className="rounded-xl border divide-y divide-slate-100 overflow-hidden">
            {[
              { label: 'Organization', value: form.org_name },
              { label: 'Contact', value: `${form.contact_name} — ${form.contact_email}` },
              { label: 'Program', value: form.program_name },
              { label: 'Duration', value: `${form.duration_weeks} weeks` },
              { label: 'Weekly Hours', value: `${totalWeeklyHours} hrs/week (${form.weekly_hours_structured} structured + ${form.weekly_hours_supervised} supervised)` },
              { label: 'Counties', value: form.counties_served.join(', ') || 'None selected' },
              { label: 'Total Participants', value: form.total_participants },
              { label: 'SNAP Participants', value: form.snap_participants },
              { label: 'ABAWD Participants', value: form.abawd_participants },
              { label: 'Completion Rate Target', value: `${form.completion_rate}%` },
              { label: 'Placement Rate Target', value: `${form.placement_rate}%` },
              { label: 'Total Program Cost', value: fmt$(parseFloat(form.total_program_cost || '0')) },
              { label: 'SNAP-Eligible Costs', value: fmt$(snapEligibleCosts) },
              { label: 'Est. Reimbursement (50%)', value: fmt$(estimatedReimbursement) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between px-4 py-2.5">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-800 text-right max-w-xs">{value}</span>
              </div>
            ))}
          </div>
          {totalWeeklyHours < 20 && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              ⚠ Weekly hours total {totalWeeklyHours} — must be at least 20 for ABAWD compliance. Go back and fix before submitting.
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {step < SECTIONS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || totalWeeklyHours < 20}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Saving...' : 'Save Survey'}
          </button>
        )}
      </div>
    </div>
  );
}
