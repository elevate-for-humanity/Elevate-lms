import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Eye, Calendar, MessageSquare, Bell, BarChart3, Shield,
  ArrowRight, Phone, CheckCircle2, GraduationCap, Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Parent & Guardian Portal | Elevate For Humanity',
  description: 'Monitor your student\'s progress, attendance, and grades. Communicate with instructors and stay informed about program updates.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/parent-portal' },
};

const FEATURES = [
  {
    icon: Eye,
    title: 'Monitor Progress',
    desc: 'View lesson completion, quiz scores, and credential milestones in real time.',
    image: '/images/pages/student-portal-page-2.jpg',
  },
  {
    icon: Calendar,
    title: 'Track Attendance',
    desc: 'See daily attendance records and receive alerts for absences or tardiness.',
    image: '/images/pages/student-portal-page-3.jpg',
  },
  {
    icon: MessageSquare,
    title: 'Message Instructors',
    desc: 'Send and receive messages directly with your student\'s instructors and advisors.',
    image: '/images/pages/student-portal-page-4.jpg',
  },
  {
    icon: Bell,
    title: 'Notifications',
    desc: 'Get alerts for grades, attendance events, upcoming exams, and program announcements.',
    image: '/images/pages/student-portal-page-5.jpg',
  },
  {
    icon: BarChart3,
    title: 'Progress Reports',
    desc: 'Download detailed progress and performance reports at any time.',
    image: '/images/pages/student-portal-page-6.jpg',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'FERPA-compliant access. Your student\'s data is protected and never shared.',
    image: '/images/pages/student-portal-page-7.jpg',
  },
];

export default async function ParentPortalPage() {
  const supabase = await createClient();

  // Check if user is already logged in — show their linked student data if so
  const { data: { user } } = await supabase.auth.getUser();

  let linkedStudents: { id: string; full_name: string; program: string; enrollment_state: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from('parent_student_links')
      .select('student_id, profiles!parent_student_links_student_id_fkey(full_name), program_enrollments(enrollment_state, programs(title))')
      .eq('parent_id', user.id)
      .limit(10);
    if (data) {
      linkedStudents = data.map((row: any) => ({
        id: row.student_id,
        full_name: row.profiles?.full_name ?? 'Student',
        program: row.program_enrollments?.[0]?.programs?.title ?? 'Program',
        enrollment_state: row.program_enrollments?.[0]?.enrollment_state ?? 'enrolled',
      }));
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Parent & Guardian Portal' }]} />
      </div>

      {/* Hero — image only, title below */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image
            src="/images/pages/about-career-training.jpg"
            alt="Parent and guardian portal"
            fill className="object-cover object-center" priority sizes="100vw"
          />
        </div>
        <div className="bg-white border-t py-10 text-center px-4">
          <p className="text-brand-blue-600 font-bold text-xs uppercase tracking-widest mb-3">For Parents &amp; Guardians</p>
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">Parent &amp; Guardian Portal</h1>
          <p className="text-black text-lg max-w-2xl mx-auto mb-8">
            Stay connected to your student&apos;s training journey. Monitor progress, attendance, and grades.
            Communicate directly with instructors.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login?redirect=/parent-portal/dashboard"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Access Portal
            </Link>
            <a
              href="tel:3173143757"
              className="border-2 border-black text-black font-bold px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>

      {/* If logged in and linked — show student cards */}
      {user && linkedStudents.length > 0 && (
        <section className="py-12 px-4 bg-brand-blue-50 border-b border-brand-blue-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-black text-black mb-6">Your Linked Students</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {linkedStudents.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-black truncate">{s.full_name}</p>
                    <p className="text-black text-sm truncate">{s.program}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-green-100 text-brand-green-800 capitalize">
                      {s.enrollment_state.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <Link href={`/parent-portal/student/${s.id}`} className="text-brand-blue-600 hover:text-brand-blue-700 flex-shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features grid — real images, no generic icons alone */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-black text-center mb-3">What You Can Do</h2>
          <p className="text-black text-center mb-10 max-w-xl mx-auto">
            Available for parents and guardians of students enrolled in apprenticeship and career training programs.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="relative h-40 flex-shrink-0">
                    <Image src={f.image} alt={f.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                    <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <Icon className="w-4 h-4 text-brand-blue-600" />
                    </div>
                  </div>
                  <div className="p-5 flex-1">
                    <h3 className="font-bold text-black text-base mb-2">{f.title}</h3>
                    <p className="text-black text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to get access */}
      <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-black mb-4">How to Get Access</h2>
              <p className="text-black mb-6 leading-relaxed">
                Portal access is available for parents and guardians of minor students enrolled in
                apprenticeship programs. Contact your student&apos;s program coordinator to request access.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Your student must be actively enrolled in a program',
                  'Contact us with your student\'s name and your email address',
                  'We\'ll create your account and send login instructions within 1 business day',
                  'Access is free — no fees or subscriptions',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-black text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  Request Access
                </Link>
                <a
                  href="tel:3173143757"
                  className="border-2 border-black text-black font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Call Us
                </a>
              </div>
            </div>
            <div className="relative h-72 rounded-2xl overflow-hidden">
              <Image
                src="/images/pages/about-supportive-services.jpg"
                alt="Supportive services for students and families"
                fill className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-slate-900 text-center px-4">
        <h2 className="text-3xl font-black text-white mb-4">Already Have Access?</h2>
        <p className="text-white text-lg mb-8 max-w-xl mx-auto">
          Log in to view your student&apos;s progress, attendance, and grades.
        </p>
        <Link
          href="/login?redirect=/parent-portal/dashboard"
          className="inline-flex items-center gap-2 bg-white text-black font-bold px-10 py-4 rounded-xl hover:bg-slate-100 transition-colors text-lg"
        >
          Log In to Portal <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
