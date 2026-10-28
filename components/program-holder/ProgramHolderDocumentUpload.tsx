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

export function ProgramHolderDocumentUpload({
  isHvac = false,
  invoiceOnly = false,
  insuranceRequired = true,
  materialsOnly = false,
}: {
  isHvac?: boolean;
  invoiceOnly?: boolean;
  insuranceRequired?: boolean;
  materialsOnly?: boolean;
}) {
  const materialOptions = [['lab_tracker', 'Lab tracker — Excel or CSV'], ['textbook', 'Textbook — PDF or Word document'], ['testing_evidence', 'Student completion and testing evidence — PDF or image']] as const;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
    const response = await fetch('/api/program-holder/documents', {
      method: 'POST',
      body: new FormData(event.currentTarget),
    });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Your session or connection changed. Reload the page and try again.');
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'Upload failed.');
        return;
    }
    setMessage(
      invoiceOnly ? 'Invoice submitted to Elevate for review.' : materialsOnly ? 'Course material uploaded for review.' : 'Uploaded for compliance review.',
    );
    window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The request could not be completed. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="text-lg font-black text-blue-950">
        {invoiceOnly ? 'Submit your training invoice to Elevate' : materialsOnly ? 'Upload lab tracker or textbook' : 'Upload an onboarding document'}
      </h2>
      <p className="mt-1 text-sm text-blue-900">
        {materialsOnly ? 'Lab tracker: XLSX, XLS, or CSV up to 10 MB. Textbook: PDF or DOCX up to 50 MB. Files stay protected; uploading does not publish them to students.' : invoiceOnly
          ? 'PDF, JPG, or PNG up to 10 MB. Include the student, training dates, amount, and invoice number. Submission does not mark the invoice paid.'
          : 'PDF, JPG, or PNG up to 10 MB; MP4 video up to 50 MB. Identity documents remain in protected storage.'}
      </p>
      {!materialsOnly && <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4 text-sm leading-6 text-slate-700">
        <p className="font-black text-slate-950">What should I upload?</p>
        <p className="mt-1">Upload the documents that apply to your Program Holder account. Start with your government-issued photo ID, business registration, W-9{insuranceRequired ? ", general liability insurance," : ""} and your program syllabus/training plan. Upload a profile photo and company logo so your portal and program presentation can be completed. Student training photos/videos are evidence uploads, not substitutes for your onboarding records.</p>
        {isHvac ? <p className="mt-2 font-semibold text-blue-950">HVAC Program Holders should also upload the HVAC syllabus/training plan and EPA Section 608 certification when applicable.</p> : null}
        <p className="mt-2"><strong>Do not guess.</strong> If a document does not apply to your business or you do not have it yet, leave it unselected and use Ask PARIS – Portal help for that specific requirement.</p>
      </div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select
          name="documentType"
          aria-label={materialsOnly ? "Course material type" : "Onboarding document type"}
          required
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
          className="min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm"
        >
          <option value="">{materialsOnly ? "Select course material type" : "Select document type"}</option>
          {(materialsOnly ? materialOptions : invoiceOnly
            ? [['provider_invoice', 'Training invoice — include student name and invoice number']]
            : [
                ...commonOptions.filter(([value]) => insuranceRequired || value !== 'insurance'),
                ...(isHvac
                  ? ([
                      ['epa_608', 'EPA Section 608 certification'],
                      ['hvac_training_plan', 'HVAC syllabus and training plan'],
                    ] as const)
                  : []),
              ]
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="file"
          type="file"
          required
          accept={
            materialsOnly
              ? selectedType === 'testing_evidence' ? '.pdf,.jpg,.jpeg,.png' : selectedType === 'textbook' ? '.pdf,.docx' : selectedType === 'lab_tracker' ? '.xlsx,.xls,.csv' : '.xlsx,.xls,.csv,.pdf,.docx'
              : invoiceOnly
              ? 'application/pdf,image/jpeg,image/png'
              : 'application/pdf,image/jpeg,image/png,video/mp4'
          }
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
            ...materialOptions,
            ...commonOptions.filter(([value]) => insuranceRequired || value !== 'insurance'),
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
