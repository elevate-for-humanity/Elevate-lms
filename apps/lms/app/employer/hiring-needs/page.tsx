import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { saveHiringNeeds } from './actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hiring and Training Needs' };
export default async function HiringNeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { user } = await requireRole(['employer', 'sponsor']);
  const db = await createClient();
  const employer = await getEmployerRecord(db, user.id);
  const { saved } = await searchParams;
  if (!employer)
    return (
      <main className="p-6">
        <h1>Employer account not linked</h1>
        <p>Contact Elevate before continuing.</p>
      </main>
    );
  const { data: onboarding, error } = await db
    .from('employer_onboarding')
    .select('hiring_needs')
    .eq('employer_id', employer.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Hiring needs could not be loaded.');
  const needs = onboarding?.hiring_needs || {};
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <Link className="text-blue-700 underline" href="/employer/setup">
        Back to employer setup
      </Link>
      <h1 className="text-3xl font-bold">Hiring and training needs</h1>
      <p>{employer.company_name || employer.business_name}</p>
      {saved === '1' && (
        <p role="status" className="rounded-lg bg-green-50 p-4">
          Your hiring and training needs are saved.
        </p>
      )}
      <form action={saveHiringNeeds} className="space-y-5 rounded-xl border bg-white p-5">
        {[
          ['roles', 'Positions or staff training needed', needs.roles || needs.additionalInfo],
          ['locations', 'Worksite locations', needs.locations],
          ['timeline', 'Hiring or training timeline', needs.timeline],
          ['additionalInfo', 'Additional information', needs.additionalInfo],
        ].map(([name, label, value]) => (
          <label key={name} className="block font-semibold">
            {label}
            <textarea
              name={name}
              required={name === 'roles' || name === 'locations'}
              maxLength={4000}
              defaultValue={typeof value === 'string' ? value : ''}
              rows={3}
              className="mt-2 block w-full rounded-lg border p-3 font-normal"
            />
          </label>
        ))}
        <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
          Save hiring and training needs
        </button>
      </form>
      <p>Submitting your needs does not activate a program or guarantee candidates or funding.</p>
    </main>
  );
}
