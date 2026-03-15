export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  ChevronRight,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Video,
  Building2,
} from 'lucide-react';

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

  const { data: enrollments } = await db
    .from('training_enrollments')
    .select(`
      id,
      status,
      course_id,
      program_id,
      courses:course_id(id, title, schedule, location, instructor_name, delivery_mode)
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'enrolled', 'in_progress']);

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
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="relative h-[260px] sm:h-[340px] overflow-hidden bg-slate-900">
        <Image
          src="/images/pages/student-portal-page-10.jpg"
          alt="Class schedule"
          fill
          sizes="100vw"
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
        <div className="relative h-full flex items-end pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <p className="text-brand-blue-300 text-xs font-bold uppercase tracking-widest mb-2">Student Portal</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">My Schedule</h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              Your active courses, class times, locations, and upcoming appointments in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student Portal', href: '/student-portal' }, { label: 'Schedule' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Active Courses */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Active Courses</h2>
              <p className="text-sm text-gray-500">Your currently enrolled programs and class times</p>
            </div>
          </div>

          {activeEnrollments.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200">
              <div className="relative h-56 sm:h-72">
                <Image
                  src="/images/pages/student-portal-page-3.jpg"
                  alt="Browse programs"
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/65" />
                <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                  <BookOpen className="w-12 h-12 text-white/50 mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">No active enrollments</h3>
                  <p className="text-slate-300 text-sm mb-5 max-w-sm">Enroll in a program to see your class schedule here.</p>
                  <Link
                    href="/programs"
                    className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors"
                  >
                    Browse Programs <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {activeEnrollments.map((enrollment: any) => {
                const course = enrollment.courses;
                const isOnline = course?.delivery_mode === 'online' || course?.location?.toLowerCase().includes('online');
                return (
                  <div key={enrollment.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src="/images/pages/student-portal-page-4.jpg"
                        alt={course?.title || 'Course'}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-bold text-white text-base leading-tight">{course?.title || 'Course'}</h3>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          enrollment.status === 'active' ? 'bg-brand-green-500 text-white' : 'bg-brand-blue-500 text-white'
                        }`}>
                          {enrollment.status}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      {course?.schedule && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                          <span>{course.schedule}</span>
                        </div>
                      )}
                      {course?.location && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-700">
                          {isOnline
                            ? <Video className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                            : <MapPin className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                          }
                          <span>{course.location}</span>
                        </div>
                      )}
                      {course?.instructor_name && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-700">
                          <User className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                          <span>{course.instructor_name}</span>
                        </div>
                      )}
                      {!course?.schedule && !course?.location && !course?.instructor_name && (
                        <p className="text-sm text-gray-400 italic">Schedule details not yet available — contact student services.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Appointments */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-brand-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
              <p className="text-sm text-gray-500">Advising sessions, orientations, and scheduled meetings</p>
            </div>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200">
              <div className="relative h-56 sm:h-72">
                <Image
                  src="/images/pages/student-portal-page-5.jpg"
                  alt="Schedule an appointment"
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/65" />
                <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                  <Calendar className="w-12 h-12 text-white/50 mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">No upcoming appointments</h3>
                  <p className="text-slate-300 text-sm mb-5 max-w-sm">Need to speak with an advisor? Reach out to student services.</p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-brand-orange-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-orange-600 transition-colors"
                  >
                    Contact Student Services <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {upcomingAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/pages/calendar-page-1.jpg"
                      alt="Appointment"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-brand-blue-600/80 flex flex-col items-center justify-center">
                      <span className="text-white text-[10px] font-bold leading-none">
                        {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-white text-2xl font-extrabold leading-none">
                        {new Date(apt.scheduled_at).getDate()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{apt.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
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
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    apt.status === 'confirmed'
                      ? 'bg-brand-green-100 text-brand-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {apt.status === 'confirmed'
                      ? <><CheckCircle className="w-3 h-3" /> Confirmed</>
                      : <><AlertCircle className="w-3 h-3" /> Pending</>
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Training Location */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Training Location</h2>
              <p className="text-sm text-gray-500">Elevate for Humanity main training center</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="relative h-56 md:h-auto min-h-[220px]">
                <Image
                  src="/images/pages/student-portal-page-8.jpg"
                  alt="Elevate for Humanity training center"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Elevate for Humanity Career & Training Institute</h3>
                <div className="flex items-start gap-3 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-brand-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">8888 Keystone Crossing, Suite 1300</p>
                    <p>Indianapolis, IN 46240</p>
                    <p className="text-gray-400 text-xs mt-1">Appointment-only. Confirm your session before arriving.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                  <span>Mon–Fri, 9:00 AM – 5:00 PM EST</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                  <a href="tel:+13173143757" className="hover:text-brand-blue-600 transition-colors">(317) 314-3757</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-brand-blue-500 flex-shrink-0" />
                  <a href="mailto:info@elevateforhumanity.org" className="hover:text-brand-blue-600 transition-colors">info@elevateforhumanity.org</a>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors w-fit"
                >
                  Contact Student Services <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-5">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'My Courses', href: '/lms/courses', img: '/images/pages/student-portal-page-1.jpg' },
              { label: 'Grades & Progress', href: '/student-portal/grades', img: '/images/pages/student-portal-page-2.jpg' },
              { label: 'Documents', href: '/student-portal/onboarding/documents', img: '/images/pages/student-portal-page-6.jpg' },
              { label: 'Contact Support', href: '/contact', img: '/images/pages/student-portal-page-9.jpg' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="relative h-28">
                  <Image
                    src={link.img}
                    alt={link.label}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/50 group-hover:bg-slate-900/40 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center px-2">
                    <span className="text-white font-bold text-sm text-center leading-tight">{link.label}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
