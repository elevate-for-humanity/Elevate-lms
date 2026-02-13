import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronRight, Zap } from 'lucide-react';
import SupersonicForm from './SupersonicForm';

export const metadata: Metadata = {
  title: 'Fast Cash Application | Supersonic | Elevate For Humanity',
  description: 'Apply for a tax refund advance.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SupersonicApplyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let existingProfile = null;
  let existingApplication = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    existingProfile = profile;

    // Check for existing application
    const { data: application } = await supabase
      .from('refund_advance_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    existingApplication = application;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic", href: "/supersonic" }, { label: "Apply" }]} />
      </div>
<div className="max-w-3xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/supersonic" className="hover:text-orange-600">Supersonic</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Fast Cash Application</span>
        </nav>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full mb-4">
            <Zap className="w-4 h-4" />
            <span className="font-medium">Get your refund in as little as 24 hours</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supersonic Fast Cash</h1>
          <p className="text-gray-600">Quick tax refund advance application</p>
        </div>

        {existingApplication && existingApplication.status !== 'rejected' ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              existingApplication.status === 'approved' ? 'bg-green-100' :
              existingApplication.status === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'
            }`}>
              <Zap className={`w-8 h-8 ${
                existingApplication.status === 'approved' ? 'text-green-600' :
                existingApplication.status === 'pending' ? 'text-yellow-600' : 'text-blue-600'
              }`} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Application {existingApplication.status}</h2>
            <p className="text-gray-600 mb-4">
              {existingApplication.status === 'approved' 
                ? 'Your refund advance has been approved!'
                : existingApplication.status === 'pending'
                ? 'Your application is being reviewed.'
                : 'Your application is being processed.'}
            </p>
            {existingApplication.estimated_amount && (
              <p className="text-3xl font-bold text-green-600 mb-4">
                ${existingApplication.estimated_amount.toLocaleString()}
              </p>
            )}
            <Link href="/supersonic/status" className="text-orange-600 hover:text-orange-700">
              View Application Status →
            </Link>
          </div>
        ) : (
          <SupersonicForm 
            userId={user?.id}
            existingProfile={existingProfile}
          />
        )}
      </div>
    </div>
  );
}
