import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { generateCertificateNumber } from '@/lib/partner-workflows/certificates';
import BulkIssueForm from './BulkIssueForm';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/certificates/bulk',
  },
  title: 'Bulk Certificate Issuance | Elevate For Humanity',
  description: 'Issue certificates to multiple participants at once.',
};

export default async function BulkCertificatesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch certificate templates
  const { data: templates } = await db
    .from('certificate_templates')
    .select('id, name, description')
    .eq('status', 'active')
    .order('name');

  // Fetch eligible participants (completed courses without certificates)
  const { data: eligibleParticipants, count: eligibleCount } = await db
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
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-certificates-bulk-hero.jpg" alt="Bulk certificate issuance" fill sizes="100vw" className="object-cover" priority />
      </section>
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
