import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, MapPin } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { submitEmployerJob } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Post a Job | Employer Portal',
  description: 'Submit a job opening for review and publication.',
  robots: { index: false, follow: false },
};

const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const programs = ['CNA', 'HVAC', 'Barber', 'CDL', 'IT'];

export default async function PostJobPage() {
  const { user } = await requireRole(['employer', 'sponsor']);
  const supabase = await createClient();
  const employer = await getEmployerRecord(supabase, user.id);

  if (!employer || !employer.approved) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl border border-amber-200 p-10 text-center">
            <Briefcase className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Employer approval required</h1>
            <p className="text-slate-600 mb-6">
              Complete employer onboarding and approval before submitting job postings.
            </p>
            <Link href="/employer/dashboard" className="inline-flex px-5 py-2.5 rounded-lg bg-brand-blue-600 text-white font-semibold">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">Employer Portal</p>
          <h1 className="text-2xl font-bold text-black">Post a Job</h1>
          <p className="text-slate-600 mt-1">
            Submit a position for review. Approved listings can then appear on the public job board.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4">
          <form action={submitEmployerJob} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Posting as</p>
              <p className="font-semibold text-slate-900 mt-1">
                {employer.company_name || employer.business_name || 'Employer'}
              </p>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
              <input id="title" name="title" type="text" required minLength={3} maxLength={160} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Job Description *</label>
              <textarea id="description" name="description" required minLength={20} rows={6} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-slate-700 mb-1">Requirements</label>
              <textarea id="requirements" name="requirements" rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="employment_type" className="block text-sm font-medium text-slate-700 mb-1">Employment Type *</label>
                <select id="employment_type" name="employment_type" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                  <option value="">Select type</option>
                  {employmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="salary_range" className="block text-sm font-medium text-slate-700 mb-1">Salary Range</label>
                <input id="salary_range" name="salary_range" type="text" placeholder="$18–$22/hour" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">Job Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input id="location" name="location" type="text" required className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="Indianapolis, IN" />
              </div>
            </div>

            <div>
              <label htmlFor="benefits" className="block text-sm font-medium text-slate-700 mb-1">Benefits</label>
              <textarea id="benefits" name="benefits" rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-slate-700 mb-2">Preferred Training Programs</legend>
              <div className="flex flex-wrap gap-2">
                {programs.map((program) => (
                  <label key={program} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input name="required_programs" type="checkbox" value={program} className="rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500" />
                    <span className="text-sm text-slate-700">{program}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-end">
              <Link href="/employer/jobs" className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 text-center">
                Cancel
              </Link>
              <button type="submit" className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-2.5 px-6 rounded-lg">
                Submit for Review
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
