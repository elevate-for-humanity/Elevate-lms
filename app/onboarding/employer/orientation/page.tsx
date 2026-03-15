import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Onboarding | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function OnboardingStepPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Onboarding Step</h1>
          <p className="text-gray-600 mb-8">Complete this step to continue your onboarding process.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700">
            Continue <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
