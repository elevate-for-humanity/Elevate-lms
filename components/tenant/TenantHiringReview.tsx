import { hiringDataSchema } from '@/lib/tenant/hiring';

export function TenantHiringReview({ websiteId, applicationId, value }: { websiteId: string; applicationId: string; value: unknown }) {
  const result = hiringDataSchema.safeParse(value);
  if (!result.success) return <p className="mt-4 text-sm text-amber-900">This hiring record needs a data review before a decision.</p>;
  const data = result.data;
  const role = data.profile.role === 'company' ? 'Cleaning company / business partner' : data.profile.role === 'apprentice' ? 'Building Technician apprenticeship interest' : 'As-needed cleaner / janitorial worker';
  return <details className="mt-5 rounded-xl border border-slate-300 p-4">
    <summary className="cursor-pointer font-bold">Hiring application · {data.submittedAt ? 'Submitted for human review' : 'In progress'} · {role}</summary>
    <p className="mt-3 text-sm">Skills scores measure knowledge. Verify experience, documents and references before making a hiring or contract decision.</p>
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{Object.entries(data.profile).filter(([key]) => !['name', 'email', 'phone', 'role'].includes(key)).map(([key, value]) => <div key={key}><dt className="font-bold">{({ company: 'Company', serviceArea: 'Service area', services: 'Services', experience: 'Experience / training interests', availability: 'Availability', capacity: 'Capacity', equipment: 'Equipment', insurance: 'Insurance statement', qualificationsNote: 'Qualifications / references' } as Record<string, string>)[key] || key}</dt><dd className="mt-1 whitespace-pre-wrap">{value || 'Not provided'}</dd></div>)}</dl>
    <h3 className="mt-6 font-black">Skills assessment</h3>
    <p className="mt-2 text-sm">{data.assessment ? `${data.assessment.score}% knowledge score. Topics to review: ${data.assessment.reviewTopics.join(', ') || 'No missed topics.'}` : 'Not completed.'}</p>
    <h3 className="mt-6 font-black">Qualification files</h3>
    <ul className="mt-2 space-y-2 text-sm">{data.documents.map(document => <li key={document.id}><a className="font-bold text-blue-800 underline" href={`/api/tenant-sites/hiring?websiteId=${websiteId}&applicationId=${applicationId}&documentId=${document.id}`} target="_blank" rel="noreferrer">{document.name}</a> · {Math.ceil(document.bytes / 1024)} KB · Applicant supplied; verify before relying on it.</li>)}</ul>
    {!data.documents.length ? <p className="mt-2 text-sm">No uploaded files. Review the applicant’s qualification explanation.</p> : null}
    <h3 className="mt-6 font-black">PARIS interview · {data.interview.answered} of 5 answers</h3>
    <div className="mt-3 space-y-3 text-sm">{data.interview.messages.map((message, index) => <div key={index} className="rounded-lg bg-slate-50 p-3"><p className="font-bold">{message.role}</p><p className="mt-1 whitespace-pre-wrap leading-6">{message.text}</p></div>)}</div>
  </details>;
}
