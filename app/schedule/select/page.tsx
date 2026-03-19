import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import { CheckCircle2, ArrowLeft, Clock, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Select Schedule | Elevate for Humanity',
  robots: { index: false, follow: false },
};

const SCHEDULE_OPTIONS = [
  {
    id: 'day',
    image: '/images/pages/schedule-consultation-page-1.jpg',
    imageAlt: 'Students in daytime HVAC training class',
    label: 'Day Classes',
    hours: 'Monday – Friday, 8:00 AM – 2:30 PM',
    location: 'Elevate Training Center, Indianapolis, IN',
    description: 'Full-time daytime schedule. Complete the program in 12 weeks.',
    badge: 'Most Popular',
    badgeColor: 'bg-brand-blue-100 text-brand-blue-700',
  },
  {
    id: 'evening',
    image: '/images/pages/admin-apprenticeships-classroom.jpg',
    imageAlt: 'Evening HVAC training class',
    label: 'Evening Classes',
    hours: 'Monday – Thursday, 5:30 PM – 9:00 PM',
    location: 'Elevate Training Center, Indianapolis, IN',
    description: 'For working adults. Program runs approximately 16 weeks.',
    badge: 'Flexible',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'self-paced',
    image: '/images/pages/admin-analytics-learning-hero.jpg',
    imageAlt: 'Student learning online at their own pace',
    label: 'Self-Paced Online',
    hours: 'Anytime — complete lessons on your own schedule',
    location: 'Online via Elevate LMS',
    description: 'Online coursework only. Hands-on labs scheduled separately at the training center.',
    badge: 'Online',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
];

async function confirmSchedule(formData: FormData) {
  'use server';
  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const { createAdminClient: createAdmin } = await import('@/lib/supabase/admin');
  const supabase = await createServerClient();
  const admin = createAdmin();
  const db = admin || supabase;
  if (!supabase) throw new Error('Database unavailable');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const scheduleType = formData.get('schedule_type') as string;

  await db.from('profiles').update({
    schedule_selected: true,
    selected_cohort: scheduleType,
  }).eq('id', user.id);

  // Ensure training_enrollments row exists
  const { data: existing } = await db
    .from('training_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await db.from('training_enrollments').insert({
      user_id: user.id,
      course_id: '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0',
      status: 'pending_approval',
      enrolled_at: new Date().toISOString(),
    });
  }

  redirect('/onboarding/learner');
}

export default async function SelectSchedulePage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white">

      {/* VIDEO HERO — getting started, full bleed */}
      <div className="relative w-full" style={{ height: '55vh', minHeight: 280, maxHeight: 480 }}>
        <video
          src="/videos/getting-started-hero.mp4"
          autoPlay
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="pt-6 pb-2">
          <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Select Schedule' }]} />
          <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mt-3 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Onboarding
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Select Your Schedule</h1>
        <p className="text-sm text-gray-500 mb-8">
          Choose the schedule that works best for you. Your enrollment coordinator will confirm your exact start date after your application is approved.
        </p>

        <form action={confirmSchedule} className="space-y-4">
          {SCHEDULE_OPTIONS.map((opt, i) => (
            <label
              key={opt.id}
              className="block bg-white rounded-xl border-2 border-gray-200 cursor-pointer hover:border-brand-blue-300 transition-colors overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Photo */}
                <div className="relative w-full sm:w-44 h-36 sm:h-auto flex-shrink-0">
                  <Image
                    src={opt.image}
                    alt={opt.imageAlt}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Content */}
                <div className="flex items-start gap-3 p-5 flex-1">
                  <input
                    type="radio"
                    name="schedule_type"
                    value={opt.id}
                    required
                    defaultChecked={i === 0}
                    className="mt-1 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{opt.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{opt.description}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {opt.hours}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {opt.location}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </label>
          ))}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
