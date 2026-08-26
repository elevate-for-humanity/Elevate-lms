import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Flower2, BookOpen, Clock, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrolled | Esthetician Apprenticeship Pathway',
  description: 'Your Esthetician Apprenticeship Pathway enrollment confirmation and next steps.',
};

export default async function EnrollmentSuccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/programs/esthetician-apprenticeship/enrollment-success');

  const { data: canonicalProgram } = await supabase
    .from('programs')
    .select('id,title,slug')
    .eq('slug', 'esthetician-apprenticeship')
    .eq('published', true)
    .eq('is_active', true)
    .maybeSingle();

  if (!canonicalProgram) redirect('/programs/esthetician-apprenticeship');

  let { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, enrolled_at, status, program_id, program_slug, user_id, title')
    .eq('user_id', user.id)
    .eq('program_id', canonicalProgram.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment && user.email) {
    const { data: emailMatch } = await supabase
      .from('program_enrollments')
      .select('id, enrolled_at, status, program_id, program_slug, user_id, title')
      .ilike('email', user.email.toLowerCase().trim())
      .eq('program_id', canonicalProgram.id)
      .is('user_id', null)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (emailMatch) {
      const { error: linkError } = await supabase
        .from('program_enrollments')
        .update({ user_id: user.id, program_slug: 'esthetician-apprenticeship' })
        .eq('id', emailMatch.id)
        .is('user_id', null);
      if (!linkError) enrollment = { ...emailMatch, user_id: user.id, program_slug: 'esthetician-apprenticeship' };
    }
  }

  if (!enrollment) redirect('/programs/esthetician-apprenticeship');

  if (enrollment.status === 'paid' || enrollment.status === 'approved') {
    await supabase
      .from('program_enrollments')
      .update({
        status: 'confirmed',
        program_slug: 'esthetician-apprenticeship',
        enrollment_confirmed_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id)
      .eq('program_id', canonicalProgram.id);
  }

  const programName = canonicalProgram.title || 'Esthetician Apprenticeship Pathway';
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
            Indiana Esthetics Pathway
          </p>
          <h1 className="text-4xl font-black text-white mb-2">You&apos;re enrolled.</h1>
          <p className="text-slate-400">Welcome to the Esthetician Apprenticeship Pathway.</p>
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
                Confirmed
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Orientation Target</span>
              <span className="font-bold text-slate-900">{formattedStartDate}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Indiana Education Requirement</span>
              <span className="font-bold text-slate-900">700 hours</span>
            </div>
            <div className="py-3 text-sm text-slate-600">
              Federal Registered Apprenticeship status is not currently published for this occupation in Elevate&apos;s canonical RAPIDS registry. Licensing is controlled by the applicable Indiana authority.
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
                desc: 'Review sanitation, client safety, supervised-practice expectations, documentation, and payment terms.',
              },
              {
                n: 2,
                title: 'Complete required education and supervised practice',
                desc: 'Indiana currently publishes a 700-hour minimum education requirement for esthetician applicants.',
              },
              {
                n: 3,
                title: 'Prepare for the Indiana licensing process',
                desc: 'Current examination, application, and licensing requirements are controlled by the Indiana Professional Licensing Agency.',
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
          href="/programs/esthetician-apprenticeship/orientation"
          className="block w-full bg-teal-500 hover:bg-teal-600 text-white text-center py-5 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg mb-3"
        >
          Start Orientation →
        </Link>
        <Link
          href="https://app.elevateforhumanity.org/lms"
          className="block w-full bg-slate-700 hover:bg-slate-600 text-white text-center py-4 rounded-xl font-bold transition-all mb-6"
        >
          <BookOpen className="inline w-4 h-4 mr-2" />
          Open Student Portal
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
