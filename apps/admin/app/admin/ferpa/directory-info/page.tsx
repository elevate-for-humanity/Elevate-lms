import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import DirectoryInfoClient from './DirectoryInfoClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `FERPA Directory Information | Admin | ${PLATFORM_DEFAULTS.orgName}`,
};

const DIRECTORY_FIELDS = [
  { key: 'directory_name', label: 'Student Name', description: 'Full legal name' },
  {
    key: 'directory_enrollment_status',
    label: 'Enrollment Status',
    description: 'Current enrollment status (full-time, part-time, etc.)',
  },
  {
    key: 'directory_program',
    label: 'Program of Study',
    description: 'Program or credential being pursued',
  },
  {
    key: 'directory_dates',
    label: 'Dates of Attendance',
    description: 'Start and expected completion dates',
  },
  { key: 'directory_degrees', label: 'Degrees & Certificates', description: 'Credentials awarded' },
  {
    key: 'directory_photo',
    label: 'Photograph',
    description: 'Profile photo used for identification',
  },
];

async function getDirectorySettings() {
  const adminClient = await requireAdminClient();
  const fallback = await createClient();
  const db = adminClient ?? fallback;

  const { data } = await db
    .from('platform_settings')
    .select('key, value')
    .in(
      'key',
      DIRECTORY_FIELDS.map((f) => f.key),
    );

  const map: Record<string, boolean> = {};
  (data ?? []).forEach((row: any) => {
    map[row.key] = row.value === 'true' || row.value === true;
  });
  // Default all to true (directory info is public unless student opts out)
  DIRECTORY_FIELDS.forEach((f) => {
    if (!(f.key in map)) map[f.key] = true;
  });
  return map;
}

export default async function FerpaDirectoryInfoPage() {
  await requireRole(['admin']);
  const settings = await getDirectorySettings();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'FERPA', href: '/admin/ferpa' },
            { label: 'Directory Information' },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Directory Information Settings</h1>
          <p className="text-slate-600 mt-1">
            Configure which fields are designated as directory information under FERPA. Students may
            opt out of disclosure of any field.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          <strong>FERPA Notice:</strong> Directory information may be disclosed without student
          consent unless the student has filed a non-disclosure request. Changes take effect
          immediately.
        </div>

        <DirectoryInfoClient fields={DIRECTORY_FIELDS} initialSettings={settings} />
      </div>
    </div>
  );
}
