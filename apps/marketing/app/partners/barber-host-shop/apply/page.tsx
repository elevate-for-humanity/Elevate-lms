'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROGRAM_OPTIONS = [
  { value: 'barber', label: 'Barber Apprenticeship' },
  { value: 'cosmetology', label: 'Cosmetology Apprenticeship' },
  { value: 'esthetician', label: 'Esthetician Apprenticeship' },
  { value: 'nail', label: 'Nail Technician Apprenticeship' },
];

const INDUSTRY_OPTIONS = [
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'salon', label: 'Salon / Day Spa' },
  { value: 'esthetics_spa', label: 'Esthetics Spa' },
  { value: 'nail_salon', label: 'Nail Salon' },
  { value: 'mobile', label: 'Mobile / Booth Rental' },
  { value: 'other', label: 'Other' },
];

type UploadKey =
  | 'shopLicense'
  | 'insurance'
  | 'workersComp'
  | 'supervisorLicense'
  | 'ein'
  | 'localBusiness';

type UploadState = Record<UploadKey, File | null>;

const EMPTY_UPLOADS: UploadState = {
  shopLicense: null,
  insurance: null,
  workersComp: null,
  supervisorLicense: null,
  ein: null,
  localBusiness: null,
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function BarberHostShopApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: '',
    legalBusinessName: '',
    dbaName: '',
    ownerName: '',
    contactName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: 'Indiana',
    zip: '',
    industryType: '',
    programs: [] as string[],
    licenseNumber: '',
    yearsInBusiness: '',
    numberOfChairs: '',
    numberOfEmployees: '',
    supervisorName: '',
    supervisorLicenseNumber: '',
    supervisorYearsLicensed: '',
    canSuperviseAndVerify: '',
    hasInsurance: '',
    workersCompStatus: '',
    compensationModel: '',
    documentReadiness: '',
    documentSupportNeeded: '',
    howHeard: '',
    message: '',
    mouAcknowledged: false,
    consentAcknowledged: false,
    signatureAcknowledged: false,
    signerName: '',
    signerTitle: '',
  });
  const [uploads, setUploads] = useState<UploadState>(EMPTY_UPLOADS);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    referenceNumber?: string;
  } | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleProgramCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    const { value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      programs: checked
        ? [...new Set([...prev.programs, value])]
        : prev.programs.filter((program) => program !== value),
    }));
  }

  function handleFile(key: UploadKey, file: File | null) {
    setUploads((prev) => ({ ...prev, [key]: file }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (form.programs.length === 0) {
      setResult({ success: false, error: 'Select at least one apprenticeship program.' });
      return;
    }
    if (!uploads.shopLicense || !uploads.insurance || !uploads.workersComp || !uploads.supervisorLicense || !uploads.ein) {
      setResult({
        success: false,
        error:
          'Upload all required compliance documents: shop license, liability COI, workers’ compensation/exemption, supervisor license, and EIN/W-9 verification.',
      });
      return;
    }
    if (!form.mouAcknowledged || !form.consentAcknowledged || !form.signatureAcknowledged) {
      setResult({
        success: false,
        error: 'Complete all required acknowledgments and authorized signature certification.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const [
        shopLicenseFileData,
        insuranceFileData,
        workersCompFileData,
        supervisorLicenseFileData,
        einFileData,
        localBusinessFileData,
      ] = await Promise.all([
        fileToDataUrl(uploads.shopLicense),
        fileToDataUrl(uploads.insurance),
        fileToDataUrl(uploads.workersComp),
        fileToDataUrl(uploads.supervisorLicense),
        fileToDataUrl(uploads.ein),
        uploads.localBusiness ? fileToDataUrl(uploads.localBusiness) : Promise.resolve(''),
      ]);

      const res = await fetch('/api/host-shop/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          shopLicenseFileData,
          shopLicenseFileName: uploads.shopLicense.name,
          insuranceFileData,
          insuranceFileName: uploads.insurance.name,
          workersCompFileData,
          workersCompFileName: uploads.workersComp.name,
          supervisorLicenseFileData,
          supervisorLicenseFileName: uploads.supervisorLicense.name,
          einFileData,
          einFileName: uploads.ein.name,
          localBusinessFileData: localBusinessFileData || undefined,
          localBusinessFileName: uploads.localBusiness?.name || undefined,
          source: 'barber-host-shop-application',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const referenceNumber = data.referenceNumber || data.applicationId || '';
        setResult({
          success: true,
          referenceNumber,
          message:
            'Your Host Shop application and compliance documents were received. Elevate will verify licensing, insurance, supervision, worksite capacity, and program fit before approval.',
        });
        const q = new URLSearchParams();
        if (referenceNumber) q.set('ref', referenceNumber);
        q.set('type', 'host-shop');
        setTimeout(() => router.push(`/apply/success?${q.toString()}`), 1800);
      } else {
        setResult({
          success: false,
          error: data.error || 'The Host Shop application could not be submitted. Review the required fields and try again.',
        });
      }
    } catch {
      setResult({
        success: false,
        error:
          'Network error. Your application was not confirmed. Your entries remain on this page; please try submitting again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-base text-slate-950 focus:border-brand-blue-600 focus:outline-none focus:ring-2 focus:ring-brand-blue-200';
  const labelClass = 'mb-1 block text-sm font-bold text-slate-950';
  const sectionClass = 'border-t border-slate-200 pt-7 first:border-t-0 first:pt-0';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-4xl px-4">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-brand-red-700">
            Apprenticeship Host Shop Application
          </p>
          <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            Apply to become an approved Host Shop
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-800">
            This application verifies the business, licensed supervisor, insurance, employment model, worksite capacity, and required compliance documents before a shop can host Elevate apprentices.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 rounded-xl border border-blue-300 bg-blue-50 p-5 text-slate-950">
          <p className="font-extrabold">Prepare these documents before you submit:</p>
          <p className="mt-2 leading-7">
            Current shop/business license, commercial/general liability insurance COI, workers’ compensation certificate or valid exemption, supervising professional license, and EIN verification or W-9. A local business license or occupancy record can also be attached when applicable.
          </p>
        </div>

        {result?.success ? (
          <section className="rounded-2xl border border-green-300 bg-white p-8 sm:p-12">
            <h2 className="text-2xl font-black text-slate-950">Application received</h2>
            <p className="mt-3 text-base leading-7 text-slate-800">{result.message}</p>
            {result.referenceNumber && (
              <p className="mt-4 rounded-lg bg-slate-100 p-4 font-bold text-slate-950">
                Reference: {result.referenceNumber}
              </p>
            )}
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-slate-300 bg-white p-6 sm:p-8">
            <section className={sectionClass}>
              <h2 className="mb-5 text-xl font-black">1. Business identity</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="legalBusinessName" className={labelClass}>Legal Business Name *</label>
                  <input id="legalBusinessName" name="legalBusinessName" required value={form.legalBusinessName} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="dbaName" className={labelClass}>DBA / Shop Name</label>
                  <input id="dbaName" name="dbaName" value={form.dbaName} onChange={(e) => {
                    handleChange(e);
                    setForm((prev) => ({ ...prev, businessName: e.target.value || prev.legalBusinessName }));
                  }} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="ownerName" className={labelClass}>Owner / Authorized Principal *</label>
                  <input id="ownerName" name="ownerName" required value={form.ownerName} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="industryType" className={labelClass}>Business Type *</label>
                  <select id="industryType" name="industryType" required value={form.industryType} onChange={handleChange} className={fieldClass}>
                    <option value="">Select business type</option>
                    {INDUSTRY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="licenseNumber" className={labelClass}>Indiana Shop / Establishment License Number *</label>
                  <input id="licenseNumber" name="licenseNumber" required value={form.licenseNumber} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="yearsInBusiness" className={labelClass}>Years in Business</label>
                  <input type="number" min="0" id="yearsInBusiness" name="yearsInBusiness" value={form.yearsInBusiness} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="numberOfEmployees" className={labelClass}>Number of Employees</label>
                  <input type="number" min="0" id="numberOfEmployees" name="numberOfEmployees" value={form.numberOfEmployees} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="numberOfChairs" className={labelClass}>Available Chairs / Workstations *</label>
                  <input type="number" min="1" id="numberOfChairs" name="numberOfChairs" required value={form.numberOfChairs} onChange={handleChange} className={fieldClass} />
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-5 text-xl font-black">2. Business location and contact</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contactName" className={labelClass}>Primary Contact *</label>
                  <input id="contactName" name="contactName" required value={form.contactName} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>Email *</label>
                  <input type="email" id="email" name="email" required value={form.email} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone *</label>
                  <input type="tel" id="phone" name="phone" required value={form.phone} onChange={handleChange} className={fieldClass} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address1" className={labelClass}>Physical Training-Site Address *</label>
                  <input id="address1" name="address1" required value={form.address1} onChange={handleChange} className={fieldClass} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address2" className={labelClass}>Suite / Unit</label>
                  <input id="address2" name="address2" value={form.address2} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="city" className={labelClass}>City *</label>
                  <input id="city" name="city" required value={form.city} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="state" className={labelClass}>State *</label>
                  <input id="state" name="state" required value={form.state} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="zip" className={labelClass}>ZIP Code *</label>
                  <input id="zip" name="zip" required value={form.zip} onChange={handleChange} className={fieldClass} inputMode="numeric" />
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-3 text-xl font-black">3. Apprenticeship programs</h2>
              <p className="mb-4 text-sm leading-6 text-slate-800">Select each occupation your location is requesting approval to host.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {PROGRAM_OPTIONS.map((program) => (
                  <label key={program.value} className="flex items-center gap-3 rounded-lg border border-slate-300 p-4 font-semibold text-slate-950">
                    <input type="checkbox" value={program.value} checked={form.programs.includes(program.value)} onChange={handleProgramCheckbox} className="h-5 w-5" />
                    {program.label}
                  </label>
                ))}
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-5 text-xl font-black">4. Supervising professional</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="supervisorName" className={labelClass}>Supervisor Name *</label>
                  <input id="supervisorName" name="supervisorName" required value={form.supervisorName} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="supervisorLicenseNumber" className={labelClass}>Supervisor License Number *</label>
                  <input id="supervisorLicenseNumber" name="supervisorLicenseNumber" required value={form.supervisorLicenseNumber} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="supervisorYearsLicensed" className={labelClass}>Years Licensed *</label>
                  <input type="number" min="0" id="supervisorYearsLicensed" name="supervisorYearsLicensed" required value={form.supervisorYearsLicensed} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="canSuperviseAndVerify" className={labelClass}>Can this supervisor directly supervise and verify OJL hours/competencies? *</label>
                  <select id="canSuperviseAndVerify" name="canSuperviseAndVerify" required value={form.canSuperviseAndVerify} onChange={handleChange} className={fieldClass}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-5 text-xl font-black">5. Employment and insurance verification</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="compensationModel" className={labelClass}>Apprentice Compensation / Employment Model *</label>
                  <select id="compensationModel" name="compensationModel" required value={form.compensationModel} onChange={handleChange} className={fieldClass}>
                    <option value="">Select</option>
                    <option value="hourly_wage">Hourly wage</option>
                    <option value="hourly_plus_commission">Hourly wage plus commission</option>
                    <option value="commission_with_wage_floor">Commission with applicable wage floor</option>
                    <option value="other_compliant_model">Other compliant employment model</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="hasInsurance" className={labelClass}>Current Commercial / General Liability Insurance? *</label>
                  <select id="hasInsurance" name="hasInsurance" required value={form.hasInsurance} onChange={handleChange} className={fieldClass}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="workersCompStatus" className={labelClass}>Workers’ Compensation Status *</label>
                  <select id="workersCompStatus" name="workersCompStatus" required value={form.workersCompStatus} onChange={handleChange} className={fieldClass}>
                    <option value="">Select</option>
                    <option value="covered">Active coverage</option>
                    <option value="exempt">Valid exemption</option>
                    <option value="none">Neither / not available</option>
                  </select>
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-2 text-xl font-black">6. Required compliance documents</h2>
              <p className="mb-5 text-sm leading-6 text-slate-800">Accepted formats: PDF, JPG, JPEG, PNG. Upload current, readable documents.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <FileField label="Shop / Establishment License *" file={uploads.shopLicense} onChange={(file) => handleFile('shopLicense', file)} />
                <FileField label="Liability Insurance COI *" file={uploads.insurance} onChange={(file) => handleFile('insurance', file)} />
                <FileField label="Workers’ Comp Certificate or Exemption *" file={uploads.workersComp} onChange={(file) => handleFile('workersComp', file)} />
                <FileField label="Supervisor Professional License *" file={uploads.supervisorLicense} onChange={(file) => handleFile('supervisorLicense', file)} />
                <FileField label="EIN Verification / W-9 *" file={uploads.ein} onChange={(file) => handleFile('ein', file)} />
                <FileField label="Local Business License / Occupancy Record (if applicable)" file={uploads.localBusiness} onChange={(file) => handleFile('localBusiness', file)} />
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-5 text-xl font-black">7. Document readiness and support</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="documentReadiness" className={labelClass}>Are your compliance documents current and ready for verification? *</label>
                  <select id="documentReadiness" name="documentReadiness" required value={form.documentReadiness} onChange={handleChange} className={fieldClass}>
                    <option value="">Select</option>
                    <option value="ready">Yes, all current</option>
                    <option value="renewal_pending">One or more renewals are pending</option>
                    <option value="need_help">I need help obtaining or replacing documents</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="documentSupportNeeded" className={labelClass}>Document Support Needed</label>
                  <textarea id="documentSupportNeeded" name="documentSupportNeeded" rows={3} value={form.documentSupportNeeded} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="message" className={labelClass}>Tell us about your shop and training environment</label>
                  <textarea id="message" name="message" rows={4} value={form.message} onChange={handleChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="howHeard" className={labelClass}>How did you hear about Elevate?</label>
                  <select id="howHeard" name="howHeard" value={form.howHeard} onChange={handleChange} className={fieldClass}>
                    <option value="">Select</option>
                    <option value="referral">Referral</option>
                    <option value="workforce">Workforce agency</option>
                    <option value="search">Search / website</option>
                    <option value="social">Social media</option>
                    <option value="event">Community or industry event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            <section className={sectionClass}>
              <h2 className="mb-5 text-xl font-black">8. Certification, consent, and signature</h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 rounded-lg border border-slate-300 p-4 text-sm font-semibold leading-6 text-slate-950">
                  <input type="checkbox" name="mouAcknowledged" checked={form.mouAcknowledged} onChange={handleChange} className="mt-1 h-5 w-5 shrink-0" />
                  <span>I understand Host Shop approval requires compliance with the applicable apprenticeship standards, supervision, recordkeeping, wage/employment requirements, and execution of Elevate’s Host Shop agreement/MOU before final activation.</span>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-slate-300 p-4 text-sm font-semibold leading-6 text-slate-950">
                  <input type="checkbox" name="consentAcknowledged" checked={form.consentAcknowledged} onChange={handleChange} className="mt-1 h-5 w-5 shrink-0" />
                  <span>I authorize Elevate to verify the business, professional licenses, insurance coverage, supplied documents, and other information necessary to evaluate this Host Shop application and share verification information with applicable program, workforce, regulatory, or apprenticeship partners as required for the requested partnership.</span>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="signerName" className={labelClass}>Authorized Signer Full Name *</label>
                    <input id="signerName" name="signerName" required value={form.signerName} onChange={handleChange} className={fieldClass} />
                  </div>
                  <div>
                    <label htmlFor="signerTitle" className={labelClass}>Signer Title</label>
                    <input id="signerTitle" name="signerTitle" value={form.signerTitle} onChange={handleChange} className={fieldClass} />
                  </div>
                </div>
                <label className="flex items-start gap-3 rounded-lg border border-slate-300 p-4 text-sm font-semibold leading-6 text-slate-950">
                  <input type="checkbox" name="signatureAcknowledged" checked={form.signatureAcknowledged} onChange={handleChange} className="mt-1 h-5 w-5 shrink-0" />
                  <span>By typing my name above and checking this box, I certify that I am authorized to submit this application and that the information and documents provided are true and complete to the best of my knowledge.</span>
                </label>
              </div>
            </section>

            {result?.error && (
              <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-4 font-semibold leading-6 text-red-950">
                {result.error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-brand-red-600 px-6 py-4 text-lg font-black text-white hover:bg-brand-red-700 disabled:cursor-not-allowed disabled:bg-slate-500">
              {submitting ? 'Submitting Host Shop Application…' : 'Submit Host Shop Application'}
            </button>
            <p className="text-center text-sm leading-6 text-slate-700">
              Submission begins verification; it does not itself approve the shop to host apprentices.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

function FileField({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-slate-950">{label}</label>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className="block w-full rounded-lg border border-slate-400 bg-white px-3 py-3 text-sm text-slate-950 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-bold file:text-white"
      />
      {file && <p className="mt-1 text-xs font-semibold text-slate-700">Selected: {file.name}</p>}
    </div>
  );
}
