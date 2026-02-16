import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reset Done | Elevate For Humanity',
  description: 'Elevate For Humanity - Reset Done page',
};

export default async function ResetDonePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Log reset completion
  await supabase.from('page_views').insert({ page: 'reset_done' }).select();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Reset", href: "/reset" }, { label: "Done" }]} />
      </div>
<div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-slate-400 flex-shrink-0">•</span>
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">
          Browser Reset Complete
        </h1>
        <p className="text-black mb-6">
          All cached data, sessions, and service workers have been cleared.
        </p>
        <a
          href="/"
          className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 transition"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}
