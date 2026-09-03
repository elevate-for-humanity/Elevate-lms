import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireStaffPortalAccess } from '@/lib/staff-portal/access';
import StudentAddForm from './StudentAddForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Add Student | Staff Portal',
  description: 'Create a student record and enroll the learner in an active program.',
  robots: { index: false, follow: false },
};

const fundingTypes = [
  { value: 'wioa', label: 'WIOA Adult' },
  { value: 'wioa-youth', label: 'WIOA Youth' },
  { value: 'wrg', label: 'Workforce Ready Grant' },
  { value: 'jri', label: 'Job Ready Indy' },
  { value: 'voc-rehab', label: 'Vocational Rehabilitation' },
  { value: 'self_pay', label: 'Self Pay' },
  { value: 'employer_sponsored', label: 'Employer Sponsored' },
] as const;

export default async function AddStudentPage() {
  const auth = await requireStaffPortalAccess();
  // Access is authorized above. The staff enrollment workflow needs the
  // canonical active-program catalog, which is intentionally not constrained
  // by learner-facing RLS policies.
  const supabase = await requireAdminClient();

  const { data: rawPrograms, error } = await supabase
    .from('programs')
    .select('id, name, slug, funding_types, price_self_pay')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[staff/add-student] failed to load programs:', error.message);
  }

  const programs = (rawPrograms ?? []).map((program: any) => ({
    id: String(program.id),
    name: String(program.name || program.slug || 'Program'),
    slug: String(program.slug || ''),
    funding_types: Array.isArray(program.funding_types) ? program.funding_types : [],
    price_self_pay: typeof program.price_self_pay === 'number' ? program.price_self_pay : null,
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
            <Link href="/staff-portal" className="hover:text-brand-blue-700">Staff Portal</Link>
            <span className="px-2">/</span>
            <Link href="/staff-portal/students" className="hover:text-brand-blue-700">Students</Link>
            <span className="px-2">/</span>
            <span className="font-semibold text-slate-900">Add Student</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-950">Add Student</h1>
          <p className="mt-2 text-slate-600">
            Create the learner record, select the program and funding source, collect required documents,
            and complete enrollment in one workflow.
          </p>
        </div>
        <StudentAddForm
          programs={programs}
          fundingTypes={fundingTypes.map((item) => ({ ...item }))}
          staffId={auth.user.id}
        />
      </div>
    </main>
  );
}
