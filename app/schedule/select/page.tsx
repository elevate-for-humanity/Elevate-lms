import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Calendar, CheckCircle2, ArrowLeft, Clock, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Select Schedule | Elevate for Humanity',
  robots: { index: false, follow: false },
};

async function confirmSchedule(formData: FormData) {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  if (!supabase) throw new Error('Database unavailable');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cohortId = formData.get('cohort_id') as string;

  // Update profile
  await supabase.from('profiles').update({
    enrollment_status: 'active',
    schedule_selected: true,
    selected_cohort: cohortId || 'HVAC-2026-C1',
  }).eq('id', user.id);

  // Ensure training_enrollments row exists (may already exist from approve step)
  const { data: existing } = await supabase
    .from('training_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!existing) {
    // Look up the HVAC course to create enrollment
    const { data: hvacCourse } = await supabase
      .from('training_courses')
      .select('id')
      .ilike('course_name', '%hvac%')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (hvacCourse) {
      await supabase.from('training_enrollments').insert({
        user_id: user.id,
        course_id: hvacCourse.id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      });
    }
  }

  redirect('/onboarding/learner');
}

export default async function SelectSchedulePage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cohorts = [
    {
      id: 'HVAC-2026-C1',
      name: 'HVAC Technician — Cohort 1',
      partner: 'La Plaza',
      startDate: 'February 24, 2026',
      endDate: 'July 10, 2026',
      schedule: 'Monday–Friday, 8:00 AM – 2:30 PM',
      location: 'Indianapolis, IN (hybrid — online RTI + employer OJT sites)',
      seats: '15–20 per cohort',
      status: 'Enrolling Now',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Select Schedule' }]} />
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mt-4 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Onboarding</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Your Schedule</h1>
        <p className="text-sm text-gray-500 mb-6">Choose your cohort and confirm your start date.</p>

        <form action={confirmSchedule} className="space-y-4">
          {cohorts.map((c) => (
            <label key={c.id} className="block bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-brand-blue-300 transition-colors">
              <div className="flex items-start gap-3">
                <input type="radio" name="cohort_id" value={c.id} required className="mt-1" defaultChecked />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{c.name}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{c.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Partner: {c.partner}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {c.startDate} — {c.endDate}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {c.schedule}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 sm:col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {c.location}
                    </div>
                  </div>
                </div>
              </div>
            </label>
          ))}

          <div className="flex justify-end pt-4">
            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <CheckCircle2 className="w-4 h-4" /> Confirm Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
