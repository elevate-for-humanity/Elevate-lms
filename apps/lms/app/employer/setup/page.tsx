import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Complete Employer Setup' };
export default async function EmployerSetupPage() {
  const { user } = await requireRole(['employer', 'sponsor']);
  const db = await createClient();
  const employer = await getEmployerRecord(db, user.id);
  const { data: documents, error } = await db
    .from('documents')
    .select('id,file_name,status')
    .eq('user_id', user.id);
  if (error) throw new Error('Your documents could not be loaded. Please retry.');
  const steps = [
    ['Company profile', 'Confirm your business and contact details.', '/employer/settings'],
    [
      'Documents and agreements',
      'Review your MOU, NDA, non-compete, handbook, and recovered files. Provide your own signatures and missing documents.',
      '/employer/documents',
    ],
    [
      'Employer orientation',
      'Review how the employer partnership and portal work.',
      '/employer/orientation',
    ],
    [
      'Hiring and training needs',
      'Tell us the positions, locations, and training support you need.',
      '/employer/hiring-needs',
    ],
  ];
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-bold">Complete employer setup</h1>
      <p className="text-lg">
        {employer?.company_name || employer?.business_name || 'Your organization'}
      </p>
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        You can complete your profile and documents while approval is pending. Hiring, candidate
        access, and apprenticeship operations remain subject to verification and applicable program
        requirements.
      </p>
      {!employer && (
        <p role="alert">
          Your login is not yet linked to an employer organization. Contact Elevate before
          continuing.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map(([title, description, href]) => (
          <Link
            key={href}
            href={href!}
            className="rounded-xl border bg-white p-5 hover:border-blue-600"
          >
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-2 text-slate-600">{description}</p>
            <p className="mt-4 font-semibold text-blue-700">Continue →</p>
          </Link>
        ))}
      </div>
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-bold">Your saved documents</h2>
        <p className="mt-2">
          {documents?.length || 0} files available.{' '}
          <Link className="text-blue-700 underline" href="/employer/documents">
            Review files and status
          </Link>
        </p>
      </section>
      <Link href="/employer/dashboard" className="text-blue-700 underline">
        Return to dashboard
      </Link>
    </main>
  );
}
