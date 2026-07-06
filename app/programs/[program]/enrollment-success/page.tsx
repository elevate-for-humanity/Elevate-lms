import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, BookOpen, Clock, Phone, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBeautyProgram, colorClasses } from '@/lib/programs/beauty-programs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ program: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { program } = await params;
  const cfg = getBeautyProgram(program);
  if (!cfg) return { robots: { index: false, follow: false } };
  return {
    title: `Enrolled | ${cfg.title} | ${PLATFORM_DEFAULTS.orgName}`,
    description: `Your enrollment in the ${cfg.title} is confirmed.`,
    robots: { index: false, follow: false },
  };
}

export default async function BeautyEnrollmentSuccessPage({ params }: Props) {
  const { program } = await params;
  const cfg = getBeautyProgram(program);
  if (!cfg) return notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/programs/${cfg.slug}/enrollment-success`);

  // Find enrollment — try by user_id first, then by email for pre-auth enrollments
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

  if (!enrollment) redirect(`/programs/${cfg.slug}`);

  // Confirm enrollment status
  if (enrollment.status === 'paid' || enrollment.status === 'approved') {
    await supabase
      .from('program_enrollments')
      .update({ status: 'confirmed', enrollment_confirmed_at: new Date().toISOString() })
      .eq('id', enrollment.id);
  }

  const programName = (enrollment.programs as { name?: string })?.name || cfg.title;
  const enrolledDate = enrollment.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
  const daysUntilMonday = (8 - enrolledDate.getDay()) % 7 || 7;
  const startDate = new Date(enrolledDate);
  startDate.setDate(startDate.getDate() + daysUntilMonday);
  const formattedStartDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const c = colorClasses(cfg.color);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className={`w-24 h-24 ${c.bg} rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <p className={`${c.text} font-bold text-sm uppercase tracking-widest mb-2`}>
            USDOL Registered Apprenticeship
          </p>
          <h1 className="text-4xl font-black text-white mb-2">You&apos;re officially enrolled.</h1>
          <p className="text-slate-400">Welcome to the {cfg.title} program.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className={`${c.bg} px-6 py-3`}>
            <p className="text-white font-bold text-sm">Enrollment Confirmation</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Program', value: programName },
              { label: 'Status', value: null },
              { label: 'Orientation Starts', value: formattedStartDate },
              { label: 'OJT Hours Required', value: `${cfg.ojtHours.toLocaleString()} hours` },
              { label: 'Sponsor', value: null, isSponsor: true },
            ].map(({ label, value, isSponsor }, i, arr) => (
              <div key={label} className={`flex justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <span className="text-slate-600">{label}</span>
                {label === 'Status' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-100 text-brand-green-700 rounded-full font-bold text-sm">
                    <span className="w-2 h-2 bg-brand-green-500 rounded-full" />
                    Active
                  </span>
                ) : isSponsor ? (
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${c.text}`} />
                    <span className="font-bold text-slate-900">{PLATFORM_DEFAULTS.orgName}</span>
                  </div>
                ) : (
                  <span className="font-bold text-slate-900">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <p className="text-white font-bold mb-4">Your next steps</p>
          <div className="space-y-3">
            {cfg.nextSteps.map(({ title, desc }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 ${c.bg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-white text-xs font-bold">{i + 1}</span>
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
          className={`block w-full ${c.bg} ${c.hover} text-white text-center py-5 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg mb-3`}
        >
          Start Orientation →
        </Link>
        <Link
          href="/lms"
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
            className={`${c.text} hover:underline text-sm flex items-center justify-center gap-1`}
          >
            <Phone className="w-3 h-3" />
            {PLATFORM_DEFAULTS.supportPhone}
          </a>
        </div>
      </div>
    </div>
  );
}
