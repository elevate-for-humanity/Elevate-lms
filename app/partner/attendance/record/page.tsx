import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import AttendanceRecordForm from './AttendanceRecordForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Record Attendance | Partner Portal',
};

export const dynamic = 'force-dynamic';

export default async function RecordAttendancePage() {
  const supabase = await createClient();
  

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const db = createAdminClient();
  if (!db) redirect('/partner/login');

  // Resolve role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['partner', 'admin', 'super_admin', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) redirect('/unauthorized');

  // Resolve partner_id via partner_users (partners table has no user_id column)
  const { data: partnerLink } = await db
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  let students: any[] = [];
  let courses: any[] = [];

  if (partnerLink?.partner_id) {
    const partnerId = partnerLink.partner_id;

    // Get active apprentices placed at this partner site.
    // apprentice_placements.shop_id = partners.id (barber shop partner)
    const { data: placements } = await db
      .from('apprentice_placements')
      .select('apprentice_id, profiles:apprentice_id(id, full_name)')
      .eq('shop_id', partnerId)
      .eq('status', 'active');

    if (placements) {
      students = placements.map((a: any) => ({
        id: a.profiles?.id || a.apprentice_id,
        name: a.profiles?.full_name || 'Student',
        present: true,
      }));
    }

    // Get active courses linked to this partner
    const { data: courseData } = await db
      .from('training_courses')
      .select('id, title')
      .eq('partner_id', partnerId)
      .eq('is_active', true);

    if (courseData) courses = courseData;
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/partner-page-3.jpg" alt="Record attendance" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Attendance', href: '/partner/attendance' }, { label: 'Record' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/partner/attendance" className="inline-flex items-center text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Attendance
        </Link>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Record Attendance</h1>
          
          {students.length > 0 ? (
            <AttendanceRecordForm students={students} courses={courses} />
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">No active students are enrolled with your organization.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
