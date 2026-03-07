import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Calendar, CheckCircle2, ArrowLeft, Clock, MapPin, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Select Schedule | Elevate for Humanity',
  robots: { index: false, follow: false },
};

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

  const cohortId = formData.get('cohort_id') as string;

  await db.from('profiles').update({
    schedule_selected: true,
    selected_cohort: cohortId,
  }).eq('id', user.id);

  const { data: existing } = await db
    .from('training_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await db.from('training_enrollments').insert({
      user_id: user.id,
      course_id: 'f0593164-55be-5867-98e7-8a86770a8dd0',
      status: 'pending_approval',
      enrolled_at: new Date().toISOString(),
    });
  }

  redirect('/onboarding/learner');
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default async function SelectSchedulePage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const db = admin || supabase;
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: dbCohorts } = await db
    .from('cohorts')
    .select('id, name, code, start_date, end_date, max_capacity, status, location, delivery_window_text, partner_name, notes')
    .ilike('name', '%hvac%')
    .eq('status', 'active')
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true });

  const cohorts = dbCohorts || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Select Schedule' }]} />
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mt-4 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Your Schedule</h1>
        <p className="text-sm text-gray-500 mb-6">
          Choose the cohort that fits your schedule. All cohorts are held at the Elevate Training Center in Indianapolis.
          WIOA and Workforce Ready Grant funding covers tuition for eligible students.
        </p>

        {cohorts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">No upcoming cohorts scheduled yet.</p>
            <p className="text-sm text-gray-400">Contact us at (317) 760-7908 to be added to the waitlist.</p>
          </div>
        ) : (
          <form action={confirmSchedule} className="space-y-4">
            {cohorts.map((c, i) => (
              <label key={c.id} className="block bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-brand-blue-300 transition-colors">
                <div className="flex items-start gap-3">
                  <input type="radio" name="cohort_id" value={c.id} required className="mt-1" defaultChecked={i === 0} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold text-gray-900">{c.name}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Enrolling Now</span>
                    </div>
                    {c.partner_name && <div className="text-xs text-gray-500 mb-2">Partner: {c.partner_name}</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {formatDate(c.start_date)} — {formatDate(c.end_date)}
                      </div>
                      {c.delivery_window_text && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {c.delivery_window_text}
                        </div>
                      )}
                      {c.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {c.location}
                        </div>
                      )}
                      {c.max_capacity && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          Up to {c.max_capacity} students per cohort
                        </div>
                      )}
                    </div>
                    {c.notes && <p className="text-xs text-gray-500 mt-2 italic">{c.notes}</p>}
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
        )}
      </div>
    </div>
  );
}
