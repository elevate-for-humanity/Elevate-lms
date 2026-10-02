'use client';
import { FormEvent, useState } from 'react';

const commonOptions = [
  ['government_id', 'Government-issued photo ID'],
  ['business_registration', 'Business registration'],
  ['insurance', 'General liability insurance'],
  ['w9', 'IRS Form W-9'],
  ['training_plan', 'Program syllabus and training plan'],
  ['profile_photo', 'Program Holder profile picture'],
  ['company_logo', 'Program Holder company logo'],
  ['student_photo', 'Student training photo'],
  ['student_video', 'Student training video'],
] as const;

export function ProgramHolderDocumentUpload({ isHvac = false }: { isHvac?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/program-holder/documents', {
      method: 'POST',
      body: new FormData(event.currentTarget),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'Upload failed.');
      setBusy(false);
      return;
    }
    setMessage('Uploaded for compliance review.');
    window.setTimeout(() => window.location.reload(), 600);
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="text-lg font-black text-blue-950">Upload an onboarding document</h2>
      <p className="mt-1 text-sm text-blue-900">
        PDF, JPG, or PNG up to 10 MB; MP4 video up to 50 MB. Identity documents remain in protected
        storage.
      </p>
      <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4 text-sm leading-6 text-slate-700">
        <p className="font-black text-slate-950">What should I upload?</p>
        <p className="mt-1">Upload the documents that apply to your Program Holder account. Start with your government-issued photo ID, business registration, W-9, general liability insurance, and your program syllabus/training plan. Upload a profile photo and company logo so your portal and program presentation can be completed. Student training photos/videos are evidence uploads, not substitutes for your onboarding records.</p>
        {isHvac ? <p className="mt-2 font-semibold text-blue-950">HVAC Program Holders should also upload the HVAC syllabus/training plan and EPA Section 608 certification when applicable.</p> : null}
        <p className="mt-2"><strong>Do not guess.</strong> If a document does not apply to your business or you do not have it yet, leave it unselected and use Ask PARIS – Portal help for that specific requirement.</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select
          name="documentType"
          required
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
          className="min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm"
        >
          <option value="">Select document type</option>
          {[
            ...commonOptions,
            ...(isHvac
              ? ([
                  ['epa_608', 'EPA Section 608 certification'],
                  ['hvac_training_plan', 'HVAC syllabus and training plan'],
                ] as const)
              : []),
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="file"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png,video/mp4"
          className="min-h-11 rounded-xl border border-blue-200 bg-white p-2 text-sm"
        />
        <button
          disabled={busy}
          className="min-h-11 rounded-xl bg-blue-700 px-5 font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {selectedType ? (
        <p className="mt-3 text-sm font-semibold text-blue-950">
          Selected: {[
            ...commonOptions,
            ...(isHvac ? ([['epa_608', 'EPA Section 608 certification'], ['hvac_training_plan', 'HVAC syllabus and training plan']] as const) : []),
          ].find(([value]) => value === selectedType)?.[1]}. Choose the matching file from your device, then press Upload.
        </p>
      ) : (
        <p className="mt-3 text-sm font-semibold text-amber-900">Choose the document type first. The file you attach must match that selection.</p>
      )}
      {message ? (
        <p role="status" className="mt-3 text-sm font-bold text-blue-950">
          {message}
        </p>
      ) : null}
    </form>
  );
}
