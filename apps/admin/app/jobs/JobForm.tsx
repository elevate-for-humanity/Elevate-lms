import Link from 'next/link';

type Employer = { id: string; business_name: string | null; company_name: string | null; approved: boolean | null };
export default function JobForm({ action, employers, job = {}, employerId = '' }: {
  action: (form: FormData) => Promise<void>;
  employers: Employer[];
  job?: Record<string, any>;
  employerId?: string;
}) {
  const field = 'w-full rounded-lg border border-slate-300 px-3 py-3';
  return <form action={action} className="space-y-5 rounded-xl border bg-white p-6">
    <label className="block">Employer *<select name="employer_id" required defaultValue={job.employer_id || employerId} className={field}>
      <option value="">Select employer</option>
      {employers.map(e => <option key={e.id} value={e.id}>{e.company_name || e.business_name || 'Unnamed employer'}{e.approved ? '' : ' — approval required to publish'}</option>)}
    </select></label>
    <label className="block">Job Title *<input name="title" required minLength={3} maxLength={160} defaultValue={job.title || ''} className={field} /></label>
    <label className="block">Location *<input name="location" required defaultValue={job.location || ''} className={field} /></label>
    <label className="block">Employment Type *<select name="employment_type" defaultValue={job.employment_type || 'Full-time'} className={field}>
      {['Full-time','Part-time','Apprenticeship','Internship','Contract'].map(t => <option key={t}>{t}</option>)}
    </select></label>
    <label className="block">Salary Range<input name="salary_range" defaultValue={job.salary_range || ''} placeholder="$18–$22/hour" className={field} /></label>
    <label className="block">Job Description *<textarea name="description" required minLength={20} rows={6} defaultValue={job.description || ''} className={field} /></label>
    <label className="block">Requirements<textarea name="requirements" rows={4} defaultValue={job.requirements || ''} className={field} /></label>
    <label className="block">Publication Status<select name="status" defaultValue={job.status === 'archived' ? 'closed' : job.status || 'pending'} className={field}>
      <option value="pending">Pending review</option><option value="active">Approved — publish</option><option value="paused">Paused</option><option value="closed">Closed</option>
    </select></label>
    <p className="text-sm text-slate-600">Only active postings from approved employers appear publicly. Pending submissions stay in the review queue.</p>
    <div className="flex gap-4"><button type="submit" className="rounded-lg bg-brand-blue-700 px-6 py-3 font-bold text-white">Save Job</button><Link href="/jobs" className="px-4 py-3">Back to Jobs</Link></div>
  </form>;
}
