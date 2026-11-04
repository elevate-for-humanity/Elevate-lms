import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { saveEmployerProfile } from './actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Company Settings | Employer Portal' };
export default async function EmployerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { user } = await requireRole(['employer', 'sponsor', 'admin']);
  const db = await createClient();
  const employer = await getEmployerRecord(db, user.id);
  const { saved } = await searchParams;
  if (!employer)
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1>Employer account not linked</h1>
        <p>Contact Elevate to connect your organization before editing company information.</p>
      </main>
    );
  const { data: contact, error } = await db
    .from('employers')
    .select('contact_name,contact_phone')
    .eq('id', employer.id)
    .eq('owner_user_id', user.id)
    .single();
  if (error) throw new Error('Company contact information could not be loaded.');
  const fields = [
    ['company_name', 'Company name', employer.company_name || employer.business_name],
    ['contact_name', 'Contact name', contact.contact_name],
    ['phone', 'Contact phone', contact.contact_phone || employer.phone],
    ['industry', 'Industry', employer.industry],
    ['company_size', 'Company size', employer.company_size],
    ['city', 'City', employer.city],
    ['state', 'State', employer.state],
    ['zip', 'ZIP code', employer.zip],
    ['website_url', 'Website', employer.website_url],
  ];
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <Link href="/employer/setup" className="text-blue-700 underline">
        Back to employer setup
      </Link>
      <h1 className="text-3xl font-bold">Company settings</h1>
      {saved === '1' && (
        <p role="status" className="rounded-lg bg-green-50 p-4 text-green-900">
          Company profile saved.
        </p>
      )}
      <p>Sign-in email: {user.email}. Contact Elevate if your account email needs to change.</p>
      <form action={saveEmployerProfile} className="space-y-5 rounded-xl border bg-white p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map(([name, label, value]) => (
            <label key={name} className="block font-semibold">
              {label}
              <input
                name={name!}
                defaultValue={value || ''}
                required={name === 'company_name'}
                type={name === 'website_url' ? 'url' : name === 'phone' ? 'tel' : 'text'}
                maxLength={name === 'state' ? 2 : name === 'website_url' ? 500 : 200}
                className="mt-2 block w-full rounded-lg border p-3 font-normal"
              />
            </label>
          ))}
        </div>
        <label className="block font-semibold">
          Company description
          <textarea
            name="description"
            maxLength={4000}
            rows={4}
            defaultValue={employer.description || ''}
            className="mt-2 block w-full rounded-lg border p-3 font-normal"
          />
        </label>
        <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
          Save company profile
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Saving your profile does not approve your employer account or change program authorization.
      </p>
    </main>
  );
}
