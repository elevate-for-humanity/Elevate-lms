'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROGRAM_TYPE_OPTIONS = [
  ['registered_apprenticeship', 'Registered Apprenticeship'],
  ['healthcare', 'Healthcare Training'],
  ['skilled_trades', 'Skilled Trades'],
  ['transportation', 'Transportation / CDL'],
  ['technology', 'Technology'],
  ['business', 'Business / Administration'],
  ['testing', 'Testing / Certification Services'],
  ['workforce', 'Workforce / Career Services'],
] as const;

export default function ProgramHolderForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    orgName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    orgType: '',
    legalStructure: '',
    address: '',
    city: '',
    state: 'Indiana',
    zip: '',
    yearsInBusiness: '',
    licenseNumber: '',
    programTypes: [] as string[],
    approvals: '',
    instructorCapacity: '',
    facilityCapacity: '',
    fundingRelationships: '',
    deliveryModel: '',
    description: '',
  });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; reference?: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setResult(null);
  }

  function toggleProgramType(value: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      programTypes: checked
        ? [...new Set([...prev.programTypes, value])]
        : prev.programTypes.filter((item) => item !== value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (form.programTypes.length === 0) {
      setResult({ success: false, error: 'Select at least one program or service type.' });
      return;
    }
    if (!consent) {
      setResult({ success: false, error: 'Confirm the Program Holder certification before submitting.' });
      return;
    }

    setSubmitting(true);
    const notes = [
      form.orgType ? `Organization type: ${form.orgType}` : '',
      form.legalStructure ? `Legal structure: ${form.legalStructure}` : '',
      form.address || form.city || form.state || form.zip
        ? `Address: ${[form.address, form.city, form.state, form.zip].filter(Boolean).join(', ')}`
        : '',
      form.yearsInBusiness ? `Years in business/operation: ${form.yearsInBusiness}` : '',
      form.licenseNumber ? `License / provider / approval number: ${form.licenseNumber}` : '',
      form.approvals ? `Existing approvals/accreditations: ${form.approvals}` : '',
      form.instructorCapacity ? `Instructor/staff capacity: ${form.instructorCapacity}` : '',
      form.facilityCapacity ? `Facility/lab capacity: ${form.facilityCapacity}` : '',
      form.fundingRelationships ? `Workforce/funding relationships: ${form.fundingRelationships}` : '',
      form.deliveryModel ? `Delivery model: ${form.deliveryModel}` : '',
      form.description ? `Program/organization description: ${form.description}` : '',
      'Program Holder certification and verification consent acknowledged: yes',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      const res = await fetch('/api/program-holder/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          organizationName: form.orgName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          website: form.website,
          programTypes: form.programTypes,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const reference = data.referenceNumber || data.applicationId || '';
        setResult({
          success: true,
          reference,
          message: 'Program Holder application received. We will review the organization, program scope, capacity, and required approvals before onboarding.',
        });
        const q = new URLSearchParams();
        if (reference) q.set('ref', reference);
        q.set('type', 'program-holder');
        setTimeout(() => router.push(`/apply/success?${q.toString()}`), 1500);
      } else {
        setResult({ success: false, error: data.error || 'The Program Holder application could not be submitted.' });
      }
    } catch {
      setResult({ success: false, error: 'Network error. The Program Holder application was not confirmed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = 'w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-slate-950 focus:border-brand-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100';
  const labelClass = 'mb-1 block text-sm font-bold text-slate-950';

  if (result?.success) {
    return (
      <div className="rounded-xl border border-green-300 bg-white p-8 text-center">
        <h3 className="text-2xl font-black text-slate-950">Application Received</h3>
        <p className="mt-3 text-slate-800">{result.message}</p>
        {result.reference && <p className="mt-4 rounded-lg bg-slate-100 p-3 font-bold">Reference: {result.reference}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7 rounded-xl border border-slate-300 bg-white p-6 sm:p-8">
      <section>
        <h2 className="mb-4 text-xl font-black text-slate-950">Organization identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={labelClass}>Legal Organization Name *</label><input name="orgName" required value={form.orgName} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Primary Contact *</label><input name="contactName" required value={form.contactName} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Email *</label><input type="email" name="email" required value={form.email} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Phone</label><input type="tel" name="phone" value={form.phone} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Website</label><input type="url" name="website" value={form.website} onChange={handleChange} className={fieldClass} placeholder="https://" /></div>
          <div><label className={labelClass}>Organization Type</label><select name="orgType" value={form.orgType} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="school">Career / technical school</option><option value="employer">Employer</option><option value="nonprofit">Nonprofit / community organization</option><option value="workforce_agency">Workforce agency</option><option value="testing_center">Testing / certification center</option><option value="healthcare">Healthcare organization</option><option value="other">Other</option></select></div>
          <div><label className={labelClass}>Legal Structure</label><select name="legalStructure" value={form.legalStructure} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="llc">LLC</option><option value="corporation">Corporation</option><option value="nonprofit_501c3">501(c)(3) nonprofit</option><option value="government">Government / public entity</option><option value="sole_proprietor">Sole proprietor</option><option value="other">Other</option></select></div>
          <div><label className={labelClass}>Years in Operation</label><input type="number" min="0" name="yearsInBusiness" value={form.yearsInBusiness} onChange={handleChange} className={fieldClass} /></div>
          <div className="sm:col-span-2"><label className={labelClass}>Street Address</label><input name="address" value={form.address} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>City</label><input name="city" value={form.city} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>State</label><input name="state" value={form.state} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>ZIP</label><input name="zip" value={form.zip} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>License / Provider / Approval Number</label><input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} className={fieldClass} /></div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-7">
        <h2 className="mb-2 text-xl font-black text-slate-950">Programs and operating capacity</h2>
        <p className="mb-4 text-sm text-slate-700">Select every training/service category you intend to operate or manage.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROGRAM_TYPE_OPTIONS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 rounded-lg border border-slate-300 p-4 font-semibold text-slate-950">
              <input type="checkbox" checked={form.programTypes.includes(value)} onChange={(event) => toggleProgramType(value, event.target.checked)} className="h-5 w-5" />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className={labelClass}>Existing Approvals / Accreditations / Certifications</label><textarea name="approvals" rows={3} value={form.approvals} onChange={handleChange} className={fieldClass} placeholder="ETPL/INTraining, DOL apprenticeship, state license, testing authorization, accreditation, etc." /></div>
          <div><label className={labelClass}>Instructor / Staff Capacity</label><textarea name="instructorCapacity" rows={3} value={form.instructorCapacity} onChange={handleChange} className={fieldClass} placeholder="Number of instructors, licenses/credentials, proctors, support staff, etc." /></div>
          <div><label className={labelClass}>Facility / Lab / Equipment Capacity</label><textarea name="facilityCapacity" rows={3} value={form.facilityCapacity} onChange={handleChange} className={fieldClass} /></div>
          <div><label className={labelClass}>Workforce / Funding Relationships</label><textarea name="fundingRelationships" rows={3} value={form.fundingRelationships} onChange={handleChange} className={fieldClass} placeholder="WorkOne, workforce boards, WRG, WIOA, employer-funded, self-pay, grants, etc." /></div>
          <div><label className={labelClass}>Delivery Model</label><select name="deliveryModel" value={form.deliveryModel} onChange={handleChange} className={fieldClass}><option value="">Select</option><option value="in_person">In person</option><option value="hybrid">Hybrid</option><option value="online">Online</option><option value="multiple">Multiple delivery models</option></select></div>
        </div>
        <div className="mt-4"><label className={labelClass}>Organization / Program Description</label><textarea name="description" rows={4} value={form.description} onChange={handleChange} className={fieldClass} /></div>
      </section>

      <label className="flex items-start gap-3 rounded-xl border border-slate-300 p-4 text-sm font-semibold leading-6 text-slate-900">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
        <span>I certify that I am authorized to submit this application for the organization. I authorize Elevate for Humanity to verify organizational, licensing, approval, instructor, facility, program, and workforce-partner information needed to review this Program Holder request. Submission does not constitute approval.</span>
      </label>

      {result?.error && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-950">{result.error}</div>}
      <button type="submit" disabled={submitting} className="w-full rounded-xl bg-brand-blue-700 py-4 font-extrabold text-white hover:bg-brand-blue-800 disabled:bg-slate-600">{submitting ? 'Submitting…' : 'Submit Program Holder Application'}</button>
    </form>
  );
}
