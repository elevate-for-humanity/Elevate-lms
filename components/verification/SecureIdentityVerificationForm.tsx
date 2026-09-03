'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type IdentityFields = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  ssn: string;
  streetAddress: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  idType: 'drivers_license' | 'state_id' | 'passport' | 'military_id';
  idState: string;
  idExpiration: string;
};

const EMPTY_FIELDS: IdentityFields = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  ssn: '',
  streetAddress: '',
  addressLine2: '',
  city: '',
  state: 'IN',
  zipCode: '',
  idType: 'drivers_license',
  idState: 'IN',
  idExpiration: '',
};

const FILE_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function SecureIdentityVerificationForm() {
  const router = useRouter();
  const [fields, setFields] = useState<IdentityFields>(EMPTY_FIELDS);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fieldClass =
    'w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-base text-slate-950 outline-none focus:border-brand-blue-700 focus:ring-2 focus:ring-blue-100';
  const labelClass = 'mb-1.5 block text-sm font-bold text-slate-950';

  function updateField(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function selectFile(file: File | null, setter: (file: File | null) => void) {
    if (!file) {
      setter(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Identity images must be JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Each identity image must be 10 MB or smaller.');
      return;
    }
    setter(file);
    setError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const ssnDigits = fields.ssn.replace(/\D/g, '');
    if (ssnDigits.length !== 9) {
      setError('Enter your complete 9-digit Social Security number.');
      return;
    }
    if (!idFront || !selfie || (fields.idType !== 'passport' && !idBack)) {
      setError(
        'Upload the front of your government-issued ID, the back unless you are using a passport, and a clear selfie.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(fields).forEach(([key, value]) => body.append(key, value));
      body.append('idFront', idFront);
      if (idBack) body.append('idBack', idBack);
      body.append('selfie', selfie);

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        body,
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit identity verification.');
      }

      router.push('/onboarding/learner?step=verification&status=submitted');
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to submit identity verification. Please try again.',
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7" noValidate={false}>
      {error ? (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-950">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-black text-slate-950">Legal identity</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Enter the information exactly as it appears on your government records.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="identity-first-name">First name *</label>
            <input id="identity-first-name" name="firstName" required autoComplete="given-name" value={fields.firstName} onChange={updateField} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="identity-middle-name">Middle name</label>
            <input id="identity-middle-name" name="middleName" autoComplete="additional-name" value={fields.middleName} onChange={updateField} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="identity-last-name">Last name *</label>
            <input id="identity-last-name" name="lastName" required autoComplete="family-name" value={fields.lastName} onChange={updateField} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="identity-dob">Date of birth *</label>
            <input id="identity-dob" type="date" name="dateOfBirth" required value={fields.dateOfBirth} onChange={updateField} className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="identity-ssn">Social Security number *</label>
            <input
              id="identity-ssn"
              type="password"
              name="ssn"
              required
              inputMode="numeric"
              autoComplete="off"
              maxLength={11}
              pattern="(?:[0-9]{9}|[0-9]{3}-[0-9]{2}-[0-9]{4})"
              placeholder="123-45-6789"
              value={fields.ssn}
              onChange={updateField}
              aria-describedby="identity-ssn-note"
              className={fieldClass}
            />
            <p id="identity-ssn-note" className="mt-2 text-xs font-semibold leading-5 text-slate-700">
              Required for enrollment/workforce identity verification. Your complete SSN is hashed immediately; only the hash and last four are stored in the protected identity record.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-black text-slate-950">Current address</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="identity-address">Street address *</label>
            <input id="identity-address" name="streetAddress" required autoComplete="address-line1" value={fields.streetAddress} onChange={updateField} className={fieldClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="identity-address-2">Address line 2</label>
            <input id="identity-address-2" name="addressLine2" autoComplete="address-line2" value={fields.addressLine2} onChange={updateField} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="identity-city">City *</label>
            <input id="identity-city" name="city" required autoComplete="address-level2" value={fields.city} onChange={updateField} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="identity-state">State *</label>
            <input id="identity-state" name="state" required maxLength={2} autoComplete="address-level1" value={fields.state} onChange={updateField} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="identity-zip">ZIP code *</label>
            <input id="identity-zip" name="zipCode" required inputMode="numeric" maxLength={10} autoComplete="postal-code" value={fields.zipCode} onChange={updateField} className={fieldClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-black text-slate-950">Government-issued photo ID</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Accepted ID types: driver&apos;s license, state ID, passport, or military ID. Upload clear color images with all edges visible.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="identity-id-type">ID type *</label>
            <select id="identity-id-type" name="idType" required value={fields.idType} onChange={updateField} className={fieldClass}>
              <option value="drivers_license">Driver&apos;s license</option>
              <option value="state_id">State ID</option>
              <option value="passport">Passport</option>
              <option value="military_id">Military ID</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="identity-id-state">Issuing state/country</label>
            <input id="identity-id-state" name="idState" value={fields.idState} onChange={updateField} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="identity-id-expiration">Expiration date</label>
            <input id="identity-id-expiration" type="date" name="idExpiration" value={fields.idExpiration} onChange={updateField} className={fieldClass} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <FileField
            id="identity-id-front"
            label="ID front *"
            file={idFront}
            required
            onChange={(file) => selectFile(file, setIdFront)}
          />
          <FileField
            id="identity-id-back"
            label={fields.idType === 'passport' ? 'ID back (not required for passport)' : 'ID back *'}
            file={idBack}
            required={fields.idType !== 'passport'}
            onChange={(file) => selectFile(file, setIdBack)}
          />
          <FileField
            id="identity-selfie"
            label="Current selfie *"
            file={selfie}
            required
            capture="user"
            onChange={(file) => selectFile(file, setSelfie)}
          />
        </div>
      </section>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Identity files are stored in the private documents bucket for authorized verification staff. Do not email or text your Social Security number or ID images.
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-blue-700 px-6 py-3 font-black text-white hover:bg-brand-blue-800 disabled:cursor-not-allowed disabled:bg-slate-500 sm:w-auto"
      >
        {submitting ? 'Submitting secure verification…' : 'Submit Identity Verification'}
      </button>
    </form>
  );
}

function FileField({
  id,
  label,
  file,
  required,
  capture,
  onChange,
}: {
  id: string;
  label: string;
  file: File | null;
  required?: boolean;
  capture?: 'user' | 'environment';
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
      <label htmlFor={id} className="block text-sm font-black text-slate-950">{label}</label>
      <input
        id={id}
        type="file"
        accept={FILE_ACCEPT}
        required={required}
        capture={capture}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="mt-3 block w-full text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-bold file:text-white"
      />
      <p className="mt-2 text-xs font-semibold text-slate-700">JPG, PNG, or WEBP; maximum 10 MB.</p>
      {file ? <p className="mt-2 truncate text-xs font-bold text-slate-900">Selected: {file.name}</p> : null}
    </div>
  );
}
