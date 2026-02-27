import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ShieldAlert, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Unauthorized Access | Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/unauthorized',
  },
};

export default async function UnauthorizedPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  
  // Log unauthorized access attempt
  await db.from('audit_logs').insert({ action: 'unauthorized_access', event_type: 'security' }).select();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-lg p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-red-100 rounded-full mb-6">
          <ShieldAlert className="w-10 h-10 text-brand-red-600" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
          Access Denied
        </h1>

        <p className="text-lg text-black mb-8">
          You don't have permission to access this page. This area is restricted
          to specific user roles.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Return Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-white border-2 border-slate-300 text-black font-semibold rounded-lg hover:border-slate-400 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
