import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'You Are Enrolled | Barber Apprenticeship | Elevate for Humanity',
  description: 'Your enrollment in the Barber Apprenticeship program is confirmed.',
};

export default async function EnrollmentSuccessPage() {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/error?message=service-unavailable');
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/programs/barber-apprenticeship/enrollment-success');
  }

  // Get enrollment to verify and get start date
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, enrolled_at, status, program_id, programs(name, slug)')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .single();

  // Redirect if no enrollment or already completed orientation
  if (!enrollment) {
    redirect('/programs/barber-apprenticeship');
  }

  // Mark enrollment as confirmed if not already
  if (enrollment.status === 'paid' || enrollment.status === 'approved') {
    await supabase
      .from('enrollments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', enrollment.id);
  }

  // Get program name from DB
  const programName = (enrollment.programs as { name?: string })?.name || 'Barber Apprenticeship';

  // Calculate start date (next Monday after enrollment)
  const enrolledDate = enrollment?.enrolled_at ? new Date(enrollment.enrolled_at) : new Date();
  const daysUntilMonday = (8 - enrolledDate.getDay()) % 7 || 7;
  const startDate = new Date(enrolledDate);
  startDate.setDate(startDate.getDate() + daysUntilMonday);
  const formattedStartDate = startDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-brand-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          
          <h1 className="text-4xl font-black text-white mb-2">
            You are now officially enrolled.
          </h1>
        </div>

        {/* Enrollment Details Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Program</span>
              <span className="font-bold text-slate-900">{programName}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Status</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-100 text-brand-green-700 rounded-full font-bold text-sm">
                <span className="w-2 h-2 bg-brand-green-500 rounded-full"></span>
                Active
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Start Date</span>
              <span className="font-bold text-slate-900">{formattedStartDate}</span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600">Sponsor</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-blue-600" />
                <span className="font-bold text-slate-900">Elevate for Humanity</span>
              </div>
            </div>
            
            <div className="text-xs text-slate-500 text-center pt-2">
              USDOL Registered Apprenticeship Program
            </div>
          </div>
        </div>

        {/* Single CTA */}
        <Link
          href="/programs/barber-apprenticeship/orientation"
          className="block w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-center py-5 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg"
        >
          Start Orientation
        </Link>

        <p className="text-slate-400 text-sm text-center mt-4">
          Complete orientation to access your program dashboard.
        </p>
      </div>
    </div>
  );
}
