import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  Eye,
  Calendar,
  MessageSquare,
  Bell,
  BarChart3,
  Shield,
  ArrowRight,
  Phone,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Parent & Guardian Portal',
  description:
    "Monitor your student's progress, attendance, and grades. Communicate with instructors and stay informed about program updates.",
  robots: { index: false, follow: false },
};

const FEATURES = [
  {
    icon: Eye,
    title: 'Monitor Progress',
    desc: 'View lesson completion, quiz scores, and credential milestones in real time.',
    image: '/images/pages/training-classroom.webp',
  },
  {
    icon: Calendar,
    title: 'Track Attendance',
    desc: 'See attendance records and stay current on participation requirements.',
    image: '/images/pages/apprenticeship-structure.webp',
  },
  {
    icon: MessageSquare,
    title: 'Message Instructors',
    desc: "Communicate with your student's instructors and program support team.",
    image: '/images/pages/business-meeting.webp',
  },
  {
    icon: Bell,
    title: 'Notifications',
    desc: 'See important program, attendance, assignment, and account updates.',
    image: '/images/pages/admin-email-automation-new-d1.webp',
  },
  {
    icon: BarChart3,
    title: 'Progress Reports',
    desc: 'Review learner progress and program milestones from one secure workspace.',
    image: '/images/pages/admin-analytics-learning-hero.webp',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'Student records are restricted to authenticated users with an approved parent or guardian relationship.',
    image: '/images/pages/platform-page-4.webp',
  },
] as const;

export default async function ParentPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let linkedStudents: {
    id: string;
    full_name: string;
    program: string;
    enrollment_state: string;
  }[] = [];

  if (user) {
    const { data } = await supabase
      .from('parent_student_links')
      .select(
        'student_id, profiles!parent_student_links_student_id_fkey(full_name), program_enrollments(enrollment_state, programs(title))',
      )
      .eq('parent_id', user.id)
      .eq('verified', true)
      .eq('status', 'verified')
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
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Parent & Guardian Portal' }]} />
      </div>

      <section className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-br from-blue-50 via-white to-violet-50">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_1.05fr] lg:px-6 lg:py-10">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-900">
              <ShieldCheck className="h-4 w-4" /> Secure parent access
            </span>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-brand-blue-700">For Parents & Guardians</p>
            <h1 className="mt-2 text-4xl font-black text-slate-950 md:text-5xl">Stay connected to your student&apos;s training journey.</h1>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-slate-700">
              Monitor progress, attendance and milestones, then communicate with the people supporting the learner. Student records only open after secure sign-in and relationship verification.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login?redirect=/parent-portal/dashboard" className="rounded-xl bg-brand-blue-700 px-7 py-3.5 font-black text-white hover:bg-brand-blue-800">Access Secure Dashboard</Link>
              <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 rounded-xl border-2 border-slate-800 bg-white px-7 py-3.5 font-black text-slate-950 hover:bg-slate-50"><Phone className="h-4 w-4" /> {PLATFORM_DEFAULTS.supportPhone}</a>
            </div>
          </div>
          <div className="relative order-1 min-h-[260px] overflow-hidden rounded-3xl shadow-xl lg:order-2 lg:min-h-[380px]">
            <Image src="/images/instructors/marcus-johnson.jpg" alt="Parent and guardian support for career training" fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {user && linkedStudents.length > 0 && (
        <section className="border-b border-brand-blue-100 bg-brand-blue-50 px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-6 text-xl font-black text-slate-950">Your Linked Students</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {linkedStudents.map((student) => (
                <div key={student.id} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-100"><GraduationCap className="h-5 w-5 text-brand-blue-700" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-slate-950">{student.full_name}</p>
                    <p className="truncate text-sm font-medium text-slate-700">{student.program}</p>
                    <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold capitalize text-emerald-800">{student.enrollment_state.replace(/_/g, ' ')}</span>
                  </div>
                  <Link href={`/parent-portal/student/${student.id}`} className="shrink-0 text-brand-blue-700" aria-label={`Open ${student.full_name}'s record`}><ArrowRight className="h-5 w-5" /></Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-black text-slate-950">What You Can Do</h2>
          <p className="mx-auto mb-10 mt-3 max-w-xl text-center font-medium text-slate-700">Each area gives the parent or guardian a clear next step instead of a blank portal shell.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-40 shrink-0">
                    <Image src={feature.image} alt={feature.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                    <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow"><Icon className="h-5 w-5 text-brand-blue-700" /></div>
                  </div>
                  <div className="flex-1 p-5">
                    <h3 className="font-black text-slate-950">{feature.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{feature.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-4xl items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black text-slate-950">How to Get Access</h2>
            <p className="mt-4 font-medium leading-7 text-slate-700">Portal access is for approved parents and guardians linked to an enrolled learner. Sign-in alone does not grant access to a student record.</p>
            <ol className="mt-6 space-y-3 text-sm font-semibold text-slate-800">
              <li>1. The learner must be actively enrolled.</li>
              <li>2. Your account must be linked to that learner.</li>
              <li>3. Sign in and open the secure Parent Dashboard.</li>
            </ol>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-xl bg-brand-blue-700 px-6 py-3 font-black text-white hover:bg-brand-blue-800">Request Access</Link>
              <Link href="/login?redirect=/parent-portal/dashboard" className="rounded-xl border-2 border-slate-800 bg-white px-6 py-3 font-black text-slate-950">Sign In</Link>
            </div>
          </div>
          <div className="relative h-72 overflow-hidden rounded-3xl shadow-lg">
            <Image src="/images/pages/about-supportive-services.webp" alt="Supportive services for learners and families" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
      </section>
    </div>
  );
}
