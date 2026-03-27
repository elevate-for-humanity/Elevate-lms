import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wrench, Users, MessageSquare, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Skilled Trades Network | Groups | LMS | Elevate For Humanity',
  description: 'Connect with electricians, plumbers, HVAC techs, and construction professionals. Share tips, job leads, and industry knowledge.',
};

export default async function GroupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/social/groups');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'LMS', href: '/lms/dashboard' },
            { label: 'Social', href: '/lms/social' },
            { label: 'Groups', href: '/lms/social/groups' },
            { label: 'Skilled Trades Network' },
          ]} />
        </div>
      </div>

      <div className="bg-gradient-to-r from-brand-orange-600 to-yellow-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wrench className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Skilled Trades Network</h1>
              <p className="text-white/80 mt-2 max-w-xl">Connect with electricians, plumbers, HVAC techs, and construction professionals. Share tips, job leads, and industry knowledge.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-slate-700 mb-2">Discussions</h2>
              <p className="text-slate-500 text-sm">
                Group discussions are not yet available. Check back soon.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Group Resources</h3>
              <div className="space-y-3">
                <div key="Apprenticeship Guide" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"><BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" /><div><div className="font-medium text-gray-900 text-sm">Apprenticeship Guide</div><div className="text-xs text-gray-500">How to start your trade career</div></div></div>
                <div key="Tool Reviews" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"><BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" /><div><div className="font-medium text-gray-900 text-sm">Tool Reviews</div><div className="text-xs text-gray-500">Community-recommended tools</div></div></div>
                <div key="Job Board" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"><BookOpen className="w-5 h-5 text-brand-blue-600 flex-shrink-0" /><div><div className="font-medium text-gray-900 text-sm">Job Board</div><div className="text-xs text-gray-500">Local trade job listings</div></div></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Related Groups</h3>
              <div className="space-y-3">
                <Link href="/lms/social/groups/career" className="block p-3 bg-white rounded-lg hover:shadow-sm"><div className="font-medium text-gray-900 text-sm">Career Changers</div></Link>
                <Link href="/lms/social/groups/healthcare" className="block p-3 bg-white rounded-lg hover:shadow-sm"><div className="font-medium text-gray-900 text-sm">Healthcare Professionals</div></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
