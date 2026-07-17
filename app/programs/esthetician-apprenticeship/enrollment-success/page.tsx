import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Flower2, BookOpen, Clock, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrolled | Esthetician Apprenticeship',
  description: 'Your enrollment in the USDOL Registered Esthetician Apprenticeship is confirmed.',
};

export default async function EnrollmentSuccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/programs/esthetician-apprenticeship/enrollment-success');

  let { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment && user.email) {
    const { data: emailMatch } = await supabase
      .from('program_enrollments')
      .select('id, enrolled_at, status, program_id, user_id, programs(name, slug)')
      .ilike('email', user.email.toLowerCase().trim())
      .is('user_id', null)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (emailMatch) {
      await supabase
        .from('program_enrollments')
        .update({ user_id: user.id })
        .eq('id', emailMatch.id);
      enrollment = { ...emailMatch, user_id: user.id };
    }
  }

  if (!enrollment) redirect('/programs/esthetician-apprenticeship');

  if (enrollment.status === 'paid' || enrollment.status === 'approved') {
    await supabase
      .from('program_enrollments')
      .update({ status: 'confirmed', enrollment_confirmed_at: new Date().toISOString() })
      .eq('id', enrollment.id);
  }

  const programName =
    (enrollment.programs as { name?: string })?.name || 'Esthetician Apprenticeship';
  const enrolledDate = enrollment.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
  const daysUntilMonday = (8 - enrolledDate.getDay()) % 7 || 7;
  const startDate = new Date(enrolledDate);
  startDate.setDate(startDate.getDate() + daysUntilMonday);
  const formattedStartDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Flower2 className="w-12 h-12 text-white" />
          </div>
          <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-2">
            USDOL Registered Apprenticeship
          </p>
          <h1 className="text-4xl font-black text-white mb-2">You're officially enrolled.</h1>
          <p className="text-slate-400">Welcome to the Esthetician Apprenticeship program.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-teal-500 px-6 py-3">
            <p className="text-white font-bold text-sm">Enrollment Confirmation</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Program</span>
              <span className="font-bold text-slate-900">{programName}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Status</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-100 text-brand-green-700 rounded-full font-bold text-sm">
                <span className="w-2 h-2 bg-brand-green-500 rounded-full" />
                Active
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Orientation Starts</span>
              <span className="font-bold text-slate-900">{formattedStartDate}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">OJT Hours Required</span>
              <span className="font-bold text-slate-900">2,000 hours</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600">Sponsor</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-500" />
                <span className="font-bold text-slate-900">{PLATFORM_DEFAULTS.orgName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <p className="text-white font-bold mb-4">Your next steps</p>
          <div className="space-y-3">
            {[
              {
                n: 1,
                title: 'Complete orientation',
                desc: 'Sanitation, skin care protocols, and safety — required before hands-on training',
              },
              {
                n: 2,
                title: 'Apply for your Indiana Esthetician License',
                desc: '700 hours required for licensure — we guide you through the PLA application',
              },
              {
                n: 3,
                title: 'Log OJT hours weekly',
                desc: '2,000 hours required — track via your apprentice dashboard',
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{n}</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/login"
          className="block w-full bg-teal-500 hover:bg-teal-600 text-white text-center py-5 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg mb-3"
        >
          Start Orientation →
        </Link>
        <Link
          href="/lms"
          className="block w-full bg-slate-700 hover:bg-slate-600 text-white text-center py-4 rounded-xl font-bold transition-all mb-6"
        >
          <BookOpen className="inline w-4 h-4 mr-2" />
          Open Esthetician App
        </Link>

        <div className="text-center space-y-1">
          <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Questions? Mon–Fri 9am–5pm ET
          </p>
          <a
            href={`tel:${PLATFORM_DEFAULTS.supportPhone}`}
            className="text-teal-400 hover:underline text-sm flex items-center justify-center gap-1"
          >
            <Phone className="w-3 h-3" />
            {PLATFORM_DEFAULTS.supportPhone}
          </a>
        </div>
      </div>
    </div>
  );
}
