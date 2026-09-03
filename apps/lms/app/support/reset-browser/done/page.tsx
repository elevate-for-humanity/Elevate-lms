import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Browser Reset Complete | Elevate for Humanity',
  description: 'Your browser session, cache, and local application state have been cleared.',
};

export default async function ResetBrowserDonePage() {
  const supabase = await createClient();

  try {
    await supabase.from('page_views').insert({ page: 'support_reset_browser_done' }).select();
  } catch {
    // Reset completion must remain usable even if analytics logging is unavailable.
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Support' }, { label: 'Reset Browser', href: '/support/reset-browser' }, { label: 'Done' }]} />
      </div>
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-slate-500 flex-shrink-0">•</span>
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">Browser Reset Complete</h1>
        <p className="text-black mb-6">All cached data, sessions, and service workers have been cleared.</p>
        <Link href="/" className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 transition">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
