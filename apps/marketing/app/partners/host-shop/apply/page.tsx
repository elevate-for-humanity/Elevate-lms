'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

const PROGRAM_OPTIONS = [
  { value: 'barber', label: 'Barber Apprenticeship' },
  { value: 'cosmetology', label: 'Cosmetology Apprenticeship' },
  { value: 'esthetician', label: 'Esthetician Apprenticeship' },
  { value: 'nail', label: 'Nail Technician Apprenticeship' },
] as const;

const INDUSTRY_OPTIONS = [
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'salon', label: 'Salon / Day Spa' },
  { value: 'esthetics_spa', label: 'Esthetics Spa' },
  { value: 'nail_salon', label: 'Nail Salon' },
  { value: 'mobile', label: 'Mobile / Booth Rental' },
  { value: 'other', label: 'Other' },
] as const;

const FILE_ACCEPT = '.pdf,image/jpeg,image/png,image/webp';

export default function UniversalHostSiteApplyPage() {
  const router = useRouter();
  const searchParams = useSafeSearchParams();
  const requestedProgram = searchParams.get('program') || '';
  const defaultPrograms = useMemo(
    () => PROGRAM_OPTIONS.some((option) => option.value === requestedProgram)
      ? [requestedProgram]
      : [],
    [requestedProgram],
  );

  const [programs, setPrograms] = useState<string[]>(defaultPrograms);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function toggleProgram(value: string, checked: boolean) {
    setPrograms((current) =>
      checked ? [...new Set([...current, value])] : current.filter((item) => item !== value),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!programs.length) {
      setError('Select at least one apprenticeship program.');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      form.delete('programs');
      programs.forEach((program) => form.append('programs', program));

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 60000);
      const response = await fetch('/api/host-shop/apply-multipart', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        referenceNumber?: string;
        applicationId?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'The Host Site application could not be submitted.');
      }

      const ref = data.referenceNumber || data.applicationId || '';
      const query = new URLSearchParams({ type: 'host-shop' });
      if (ref) query.set('ref', ref);
      router.push(`/apply/success?${query.toString()}`);
    } catch (caught) {
      setError(
        caught instanceof DOMException && caught.name === 'AbortError'
          ? 'The upload took too long. Your application was not confirmed. Check your connection and try again.'
          : caught instanceof Error
            ? caught.message
            : 'Unable to submit the Host Site application. Please try again.',
      );
      setSubmitting(false);
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-brand-blue-700 focus:ring-2 focus:ring-blue-100';
  const labelClass = 'mb-1.5 block text-sm font-bold text-slate-950';
  const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-7';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-4xl px-4">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">
            Apprenticeship Host Site Application
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Become an approved apprenticeship Host Site</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            One no-cost application covers Barber, Cosmetology, Esthetics, and Nail Technician host sites.
            Elevate verifies the business, licensed supervisor, insurance, workers&apos; compensation,
            worksite capacity, and compliance documents before approval. There is no Host Site application
            or apprentice-placement fee.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
          <strong>No-cost Host Site application:</strong> Elevate charges no application or placement fee.
          The Host Site is still responsible for apprentice wages, payroll obligations, insurance, supervision,
          tools, supplies, and normal employer costs. Workforce wage reimbursement is conditional and must be
          approved by WorkOne before covered training begins.
        </div>

        <div className="rounded-xl border border-blue-300 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
          <strong>Prepare five required documents:</strong> current business/shop license,
          commercial/general liability insurance COI, workers&apos; compensation certificate or valid
          exemption, supervising professional license, and EIN verification or W-9. Files upload
          directly as PDF/JPG/PNG/WEBP.
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-950">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className={sectionClass}>
            <h2 className="text-xl font-black">1. Business identity</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Legal business name *" name="legalBusinessName" required className={fieldClass} labelClass={labelClass} />
              <Field label="DBA / shop name" name="dbaName" className={fieldClass} labelClass={labelClass} />
              <Field label="Owner / authorized principal *" name="ownerName" required className={fieldClass} labelClass={labelClass} />
              <div>
                <label htmlFor="industryType" className={labelClass}>Business type *</label>
                <select id="industryType" name="industryType" required className={fieldClass} defaultValue="">
                  <option value="">Select business type</option>
                  {INDUSTRY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <Field label="Indiana business/shop license number *" name="licenseNumber" required className={fieldClass} labelClass={labelClass} />
              <Field label="Available chairs/workstations" name="numberOfChairs" type="number" min="1" className={fieldClass} labelClass={labelClass} />
              <Field label="Number of employees" name="numberOfEmployees" type="number" min="0" className={fieldClass} labelClass={labelClass} />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-black">2. Primary contact and training location</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Primary contact *" name="contactName" required className={fieldClass} labelClass={labelClass} />
              <Field label="Email *" name="email" type="email" autoComplete="email" required className={fieldClass} labelClass={labelClass} />
              <Field label="Phone *" name="phone" type="tel" autoComplete="tel" required className={fieldClass} labelClass={labelClass} />
              <div className="sm:col-span-2">
                <Field label="Physical training-site address *" name="address1" autoComplete="address-line1" required className={fieldClass} labelClass={labelClass} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Suite / unit" name="address2" autoComplete="address-line2" className={fieldClass} labelClass={labelClass} />
              </div>
              <Field label="City *" name="city" autoComplete="address-level2" required className={fieldClass} labelClass={labelClass} />
              <Field label="State *" name="state" autoComplete="address-level1" required defaultValue="Indiana" className={fieldClass} labelClass={labelClass} />
              <Field label="ZIP code *" name="zip" autoComplete="postal-code" required className={fieldClass} labelClass={labelClass} />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-black">3. Programs requested</h2>
            <p className="mt-2 text-sm text-slate-700">Select each occupation this location wants approval to host.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PROGRAM_OPTIONS.map((option) => (
                <label key={option.value} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 p-4 font-bold text-slate-950">
                  <input
                    type="checkbox"
                    checked={programs.includes(option.value)}
                    onChange={(event) => toggleProgram(option.value, event.target.checked)}
                    className="h-5 w-5"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-black">4. Licensed supervisor and employment model</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Supervisor name *" name="supervisorName" required className={fieldClass} labelClass={labelClass} />
              <Field label="Supervisor license number *" name="supervisorLicenseNumber" required className={fieldClass} labelClass={labelClass} />
              <Field label="Years licensed *" name="supervisorYearsLicensed" type="number" min="0" required className={fieldClass} labelClass={labelClass} />
              <SelectField
                label="Can this supervisor verify OJL hours and competencies? *"
                name="canSuperviseAndVerify"
                className={fieldClass}
                labelClass={labelClass}
                options={[['yes', 'Yes'], ['no', 'No']]}
              />
              <SelectField
                label="Current liability insurance? *"
                name="hasInsurance"
                className={fieldClass}
                labelClass={labelClass}
                options={[['yes', 'Yes'], ['no', 'No']]}
              />
              <SelectField
                label="Workers’ compensation status *"
                name="workersCompStatus"
                className={fieldClass}
                labelClass={labelClass}
                options={[
                  ['covered', 'Covered by workers’ compensation'],
                  ['exempt', 'Valid exemption'],
                  ['none', 'No coverage / exemption'],
                ]}
              />
              <SelectField
                label="Apprentice compensation model *"
                name="compensationModel"
                className={fieldClass}
                labelClass={labelClass}
                options={[
                  ['hourly', 'Hourly employee'],
                  ['commission', 'Commission employee'],
                  ['hourly_plus_commission', 'Hourly + commission'],
                  ['other', 'Other approved employment model'],
                ]}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-black">5. Required compliance documents</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FileField label="Business/shop license *" name="shopLicense" />
              <FileField label="Liability insurance COI *" name="insurance" />
              <FileField label="Workers’ comp certificate / exemption *" name="workersComp" />
              <FileField label="Supervisor professional license *" name="supervisorLicense" />
              <FileField label="EIN verification / W-9 *" name="ein" />
              <FileField label="Local business / occupancy document (optional)" name="localBusiness" required={false} />
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-black">6. Certifications and authorized signature</h2>
            <div className="mt-5 space-y-4">
              <Checkbox name="mouAcknowledged" label="I acknowledge the Host Site apprenticeship responsibilities and understand approval is required before an apprentice can be assigned. *" />
              <Checkbox name="consentAcknowledged" label="I authorize Elevate to verify submitted business, insurance, workers’ compensation, licensing, and supervisor information with appropriate third parties. *" />
              <Checkbox name="signatureAcknowledged" label="I certify that the information and documents submitted are true and complete and that I am authorized to sign for this business. *" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Authorized signer name *" name="signerName" required className={fieldClass} labelClass={labelClass} />
                <Field label="Signer title" name="signerTitle" className={fieldClass} labelClass={labelClass} />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 text-base font-black text-white hover:bg-brand-red-700 disabled:cursor-not-allowed disabled:bg-slate-500 sm:w-auto"
          >
            {submitting ? 'Uploading and submitting…' : 'Submit Host Site Application'}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  labelClass,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; labelClass: string }) {
  const id = `host-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input id={id} {...props} className={className} />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  className,
  labelClass,
}: {
  label: string;
  name: string;
  options: Array<[string, string]>;
  className: string;
  labelClass: string;
}) {
  return (
    <div>
      <label htmlFor={`host-${name}`} className={labelClass}>{label}</label>
      <select id={`host-${name}`} name={name} required defaultValue="" className={className}>
        <option value="">Select</option>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );
}

function FileField({ label, name, required = true }: { label: string; name: string; required?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
      <label htmlFor={`host-${name}`} className="block text-sm font-black text-slate-950">{label}</label>
      <input
        id={`host-${name}`}
        type="file"
        name={name}
        accept={FILE_ACCEPT}
        required={required}
        className="mt-3 block w-full text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:font-bold file:text-white"
      />
      <p className="mt-2 text-xs font-semibold text-slate-700">PDF, JPG, PNG, or WEBP; maximum 10 MB.</p>
    </div>
  );
}

function Checkbox({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-300 p-4 text-sm font-semibold leading-6 text-slate-900">
      <input type="checkbox" name={name} value="true" required className="mt-1 h-5 w-5 flex-none" />
      <span>{label}</span>
    </label>
  );
}
