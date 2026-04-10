import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'You Are Enrolled | Esthetician Apprenticeship | Elevate for Humanity',
  description: 'Your enrollment in the Esthetician Apprenticeship program is confirmed.',
};

export default async function EstheticianEnrollmentSuccessPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/programs/esthetician/enrollment-success');

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, enrolled_at, status, program_id, programs(name, slug)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .single();

  if (!enrollment) redirect('/programs/esthetician');

  if (enrollment.status === 'paid' || enrollment.status === 'approved') {
    await supabase
      .from('program_enrollments')
      .update({ status: 'confirmed', enrollment_confirmed_at: new Date().toISOString() })
      .eq('id', enrollment.id);
  }

  const programName = (enrollment.programs as { name?: string })?.name || 'Esthetician Apprenticeship';

  const enrolledDate = enrollment?.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Shield className="w-12 h-12 text-rose-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            You are now officially enrolled.
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-black">Program</span>
              <span className="font-bold text-slate-900">{programName}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-black">Status</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Active
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-black">Start Date</span>
              <span className="font-bold text-slate-900">{formattedStartDate}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-black">Sponsor</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900">Elevate for Humanity</span>
              </div>
            </div>
            <div className="text-xs text-black text-center pt-2">
              USDOL Registered Apprenticeship Program
            </div>
          </div>
        </div>

        <Link
          href={`/lms/program/${enrollment.program_id}`}
          className="block w-full bg-rose-600 hover:bg-rose-700 text-white text-center py-5 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg"
        >
          Go to My Program Dashboard
        </Link>

        <p className="text-black text-sm text-center mt-4">
          View your courses, track progress, and start learning.
        </p>
      </div>
    </div>
  );
}
