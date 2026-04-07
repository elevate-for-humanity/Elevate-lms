import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { generateCertificateNumber } from '@/lib/partner-workflows/certificates';
import BulkIssueForm from './BulkIssueForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/certificates/bulk',
  },
  title: 'Bulk Certificate Issuance | Elevate For Humanity',
  description: 'Issue certificates to multiple participants at once.',
};

export default async function BulkCertificatesPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();



  // Fetch certificate templates
  const { data: templates } = await supabase
    .from('certificate_templates')
    .select('id, name, description')
    .eq('status', 'active')
    .order('name');

  // Fetch eligible participants (completed courses without certificates)
  const { data: eligibleParticipants, count: eligibleCount } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      user_id,
      course_id,
      completed_at,
      profiles!inner(full_name, email),
      courses!inner(title)
    `, { count: 'exact' })
    .eq('status', 'completed')
    .is('certificate_issued', null)
    .limit(20);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/certificates" className="hover:text-primary">Certificates</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Bulk Issue</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Certificate Issuance</h1>
          <p className="text-gray-600 mt-2">Issue certificates to multiple participants at once</p>
        </div>

        <BulkIssueForm
          templates={templates || []}
          eligibleParticipants={eligibleParticipants || []}
          eligibleCount={eligibleCount || 0}
        />
      </div>
    </div>
  );
}
