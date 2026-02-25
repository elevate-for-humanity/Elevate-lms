export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Schedule | Student Portal',
  description: 'View your class schedule and upcoming sessions.',
  robots: { index: false, follow: false },
};

export default async function StudentPortalSchedulePage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/student-portal/schedule');
  }

  // Fetch enrollments to get program/course info
  const { data: enrollments } = await db
    .from('training_enrollments')
    .select(`
      id,
      status,
      course_id,
      program_id,
      courses:course_id(id, title, schedule, location, instructor_name)
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'enrolled', 'in_progress']);

  // Fetch upcoming appointments/sessions
  const { data: appointments } = await db
    .from('crm_appointments')
    .select('*')
    .eq('contact_id', user.id)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10);

  const activeEnrollments = enrollments || [];
  const upcomingAppointments = appointments || [];

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/success-hero.jpg" alt="Student portal" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Student Portal', href: '/student-portal' }, { label: 'Schedule' }]} />
      </div>
      <h1 className="text-3xl font-bold mb-6">Class Schedule</h1>

      {/* Active Courses */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Active Courses</h2>
        {activeEnrollments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active enrollments.</p>
            <a href="/programs" className="text-brand-blue-600 hover:underline text-sm mt-2 inline-block">
              Browse programs
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {activeEnrollments.map((enrollment: any) => {
              const course = enrollment.courses;
              return (
                <div key={enrollment.id} className="bg-white rounded-xl shadow-sm p-6 border">
                  <h3 className="font-bold text-gray-900 mb-2">{course?.title || 'Course'}</h3>
                  {course?.schedule && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.schedule}</span>
                    </div>
                  )}
                  {course?.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>{course.location}</span>
                    </div>
                  )}
                  {course?.instructor_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{course.instructor_name}</span>
                    </div>
                  )}
                  <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                    enrollment.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-brand-blue-100 text-brand-blue-700'
                  }`}>
                    {enrollment.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming Appointments */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
        {upcomingAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming appointments.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {upcomingAppointments.map((apt: any) => (
              <div key={apt.id} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{apt.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(apt.scheduled_at).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })} at {new Date(apt.scheduled_at).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                  {apt.location && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {apt.location}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  apt.status === 'confirmed' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
