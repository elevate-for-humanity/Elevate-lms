import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock, FileText, Video, Users, Circle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Staff Onboarding | Elevate For Humanity',
  description: 'Complete your staff onboarding process.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const steps = [
  { title: 'Welcome Video', description: 'Watch the welcome message from leadership', icon: Video, status: 'complete' },
  { title: 'Policies & Procedures', description: 'Review and acknowledge company policies', icon: FileText, status: 'current' },
  { title: 'Team Introduction', description: 'Meet your team members', icon: Users, status: 'pending' },
  { title: 'System Training', description: 'Learn to use our platforms', icon: Circle, status: 'pending' },
];

export default async function StaffOnboardingPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/staff');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding' }, { label: 'Staff' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Elevate!</h1>
        <p className="text-gray-600 mb-8">Complete the following steps to finish your onboarding.</p>

        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {steps.map((step, i) => (
            <div key={i} className="p-6 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step.status === 'complete' ? 'bg-brand-green-100' : step.status === 'current' ? 'bg-brand-blue-100' : 'bg-gray-100'
              }`}>
                {step.status === 'complete' ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
                ) : step.status === 'current' ? (
                  <Clock className="w-6 h-6 text-brand-blue-600" />
                ) : (
                  <step.icon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
              {step.status === 'current' && (
                <Link href={`/onboarding/staff/${step.title.toLowerCase().replace(/\s+/g, '-')}`} className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
                  Continue
                </Link>
              )}
              {step.status === 'complete' && (
                <span className="text-brand-green-600 text-sm font-medium">Completed</span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-brand-blue-50 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 text-sm mb-4">Contact HR if you have questions about onboarding.</p>
          <Link href="/contact" className="text-brand-blue-600 hover:underline font-medium">Contact HR →</Link>
        </div>
      </div>
    </div>
  );
}
