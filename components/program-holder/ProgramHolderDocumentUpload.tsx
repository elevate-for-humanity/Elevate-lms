'use client';
import { FormEvent, useEffect, useState } from 'react';

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
  students = [],
}: {
  isHvac?: boolean;
  invoiceOnly?: boolean;
  insuranceRequired?: boolean;
  materialsOnly?: boolean;
  students?: any[];
}) {
  const materialOptions = [
    ['lab_tracker', 'Lab tracker — Excel or CSV'],
    ['textbook', 'Textbook — PDF or Word document'],
    ['testing_evidence', 'Student completion and testing evidence — PDF or image'],
  ] as const;
  const [invoiceMode, setInvoiceMode] = useState('form');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState(invoiceOnly ? 'provider_invoice' : '');
  const isSyllabus = ['training_plan', 'hvac_training_plan'].includes(selectedType);
  const [programOptions, setProgramOptions] = useState<Array<{id: string; title?: string; name?: string}>>([]);
  useEffect(() => {
    if (!isSyllabus) return;
    const controller = new AbortController();
    fetch('/api/program-holder/syllabus', { signal: controller.signal })
      .then(response => response.json()).then(data => {
        if (Array.isArray(data.programs)) setProgramOptions(data.programs);
        else setMessage(data.error || 'Programs could not be loaded.');
      }).catch(error => { if (error.name !== 'AbortError') setMessage('Programs could not be loaded. Reload to retry.'); });
    return () => controller.abort();
  }, [isSyllabus]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/program-holder/documents', {
        method: 'POST',
        body: new FormData(event.currentTarget),
      });
      if (!response.headers.get('content-type')?.includes('application/json'))
        throw new Error('Your session or connection changed. Reload the page and try again.');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || 'Upload failed.');
        return;
      }
      if (isSyllabus && data.buildStarted !== true) {
        setMessage(data.courseBuild?.error || 'Syllabus saved, but Course Builder did not start. Use Retry syllabus build below.');
        return;
      }
      setMessage(
        isSyllabus ? 'Syllabus saved and Course Builder started. The quality-verified course will appear as a secondary student assignment.' :
        invoiceOnly
          ? 'Invoice submitted to Elevate for review.'
          : materialsOnly
            ? 'Course material uploaded for review.'
            : 'Uploaded for compliance review.',
      );
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'The request could not be completed. Please retry.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="text-lg font-black text-blue-950">
        {invoiceOnly
          ? 'Submit your training invoice to Elevate'
          : materialsOnly
            ? 'Upload lab tracker or textbook'
            : 'Upload an onboarding document'}
      </h2>
      <p className="mt-1 text-sm text-blue-900">
        {materialsOnly
          ? 'Lab tracker: XLSX, XLS, or CSV up to 10 MB. Textbook: PDF or DOCX up to 50 MB. Files stay protected; uploading does not publish them to students.'
          : invoiceOnly
            ? 'Fill out and submit your invoice below, or upload an existing invoice. Submission sends it for review and does not mark it paid.'
            : 'PDF, JPG, or PNG up to 10 MB; MP4 video up to 50 MB. Identity documents remain in protected storage.'}
      </p>
      {!materialsOnly && !invoiceOnly && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4 text-sm leading-6 text-slate-700">
          <p className="font-black text-slate-950">What should I upload?</p>
          <p className="mt-1">
            Upload the documents that apply to your Program Holder account. Start with your
            government-issued photo ID, business registration, W-9
            {insuranceRequired ? ', general liability insurance,' : ''} and your program
            syllabus/training plan. Upload a profile photo and company logo so your portal and
            program presentation can be completed. Student training photos/videos are evidence
            uploads, not substitutes for your onboarding records.
          </p>
          {isHvac ? (
            <p className="mt-2 font-semibold text-blue-950">
              HVAC Program Holders should also upload the HVAC syllabus/training plan and EPA
              Section 608 certification when applicable.
            </p>
          ) : null}
          <p className="mt-2">
            <strong>Do not guess.</strong> If a document does not apply to your business or you do
            not have it yet, leave it unselected and use Ask PARIS – Portal help for that specific
            requirement.
          </p>
        </div>
      )}
      {isSyllabus && <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm font-bold">Assigned program
          <select name="programId" required className="min-h-11 rounded-xl border bg-white p-2">
            <option value="">Choose the program for this syllabus</option>
            {programOptions.map(program => <option key={program.id} value={program.id}>{program.title || program.name || 'Assigned program'}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">Syllabus text (optional for readable PDFs; required if the file cannot be read)
          <textarea name="syllabusText" maxLength={250000} rows={5} className="rounded-xl border bg-white p-2" />
        </label>
        <p className="text-sm">Course Builder uses this syllabus to create secondary training for your assigned students. Your primary Elevate curriculum remains in place.</p>
      </div>}
      {materialsOnly && (
        <label className="mt-4 block text-sm font-bold">
          Student for supporting evidence
          <select
            name="enrollmentId"
            required={selectedType === 'testing_evidence'}
            className="mt-1 min-h-11 w-full rounded-xl border bg-white p-2"
          >
            <option value="">General curriculum material</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name || 'Student'}
              </option>
            ))}
          </select>
        </label>
      )}
      {invoiceOnly && (
        <div className="mt-4 space-y-4">
          <label className="grid gap-1 text-sm font-bold">Invoice method
            <select name="invoiceMode" value={invoiceMode} onChange={event => setInvoiceMode(event.target.value)} className="min-h-11 rounded-xl border bg-white p-2">
              <option value="form">Fill out an invoice</option>
              <option value="upload">Upload an existing invoice</option>
            </select>
          </label>
          {invoiceMode === 'form' && <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
            {[
              ['providerName', 'Provider / business name', 'text'],
              ['invoiceNumber', 'Invoice number', 'text'],
              ['studentName', 'Student name', 'text'],
              ['trainingStart', 'Training start date', 'date'],
              ['trainingEnd', 'Training end date', 'date'],
              ['amount', 'Amount requested (USD)', 'number'],
            ].map(([name, label, type]) => <label key={name} className="grid gap-1 text-sm font-bold">{label}
              <input name={name} type={type} required maxLength={200} min={type === 'number' ? '0.01' : undefined} max={type === 'number' ? '9999999.99' : undefined} step={type === 'number' ? '0.01' : undefined} className="min-h-11 min-w-0 rounded-xl border bg-white p-2" />
            </label>)}
            <label className="grid gap-1 text-sm font-bold sm:col-span-2">Training / services provided
              <textarea name="serviceDescription" required maxLength={2000} rows={4} className="rounded-xl border bg-white p-2" />
            </label>
            <label className="flex gap-2 text-sm sm:col-span-2"><input name="invoiceAttested" type="checkbox" value="yes" required />I certify that these services and the requested amount are accurate.</label>
          </fieldset>}
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select
          name="documentType"
          aria-label={
            invoiceOnly
              ? 'Invoice document type'
              : materialsOnly
                ? 'Course material type'
                : 'Onboarding document type'
          }
          required
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
          className="min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm"
        >
          <option value="">
            {materialsOnly ? 'Select course material type' : 'Select document type'}
          </option>
          {(materialsOnly
            ? materialOptions
            : invoiceOnly
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
        {(!invoiceOnly || invoiceMode === 'upload') && <input
          name="file"
          type="file"
          required
          accept={
            materialsOnly
              ? selectedType === 'testing_evidence'
                ? '.pdf,.jpg,.jpeg,.png'
                : selectedType === 'textbook'
                  ? '.pdf,.docx'
                  : selectedType === 'lab_tracker'
                    ? '.xlsx,.xls,.csv'
                    : '.xlsx,.xls,.csv,.pdf,.docx'
              : invoiceOnly
                ? 'application/pdf,image/jpeg,image/png'
                : 'application/pdf,image/jpeg,image/png,video/mp4'
          }
          className="min-h-11 rounded-xl border border-blue-200 bg-white p-2 text-sm"
        />}
        <button
          disabled={busy}
          className="min-h-11 rounded-xl bg-blue-700 px-5 font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Submitting…' : invoiceOnly ? 'Submit invoice' : 'Upload'}
        </button>
      </div>
      {selectedType ? (
        <p className="mt-3 text-sm font-semibold text-blue-950">
          Selected:{' '}
          {
            [
              ['provider_invoice', 'Training invoice'],
              ...materialOptions,
              ...commonOptions.filter(([value]) => insuranceRequired || value !== 'insurance'),
              ...(isHvac
                ? ([
                    ['epa_608', 'EPA Section 608 certification'],
                    ['hvac_training_plan', 'HVAC syllabus and training plan'],
                  ] as const)
                : []),
            ].find(([value]) => value === selectedType)?.[1]
          }
          {invoiceOnly && invoiceMode === 'form' ? '. Complete the fields above, then press Submit invoice.' : '. Choose the matching file from your device, then submit.'}
        </p>
      ) : (
        <p className="mt-3 text-sm font-semibold text-amber-900">
          Choose the document type first. The file you attach must match that selection.
        </p>
      )}
      {message ? (
        <p role="status" className="mt-3 text-sm font-bold text-blue-950">
          {message}
        </p>
      ) : null}
    </form>
  );
}
