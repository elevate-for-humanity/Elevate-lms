import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Scissors, GraduationCap } from 'lucide-react';
import ApprenticeLoginForm from './ApprenticeLoginForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Apprentice Login — ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Sign in to your apprenticeship portal. Track hours, competencies, and training progress.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeLoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/portal/apprentice');
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Apprentice Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Registered Apprenticeship Program
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <GraduationCap aria-label="graduationcap" className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium uppercase tracking-widest">
              DOL Registered
            </span>
          </div>
        </div>

        <ApprenticeLoginForm />

        <div className="mt-6 text-center space-y-2">
          <Link
            href="/login"
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            Not an apprentice? Sign in as a different role →
          </Link>
          <p className="text-xs text-slate-600">
            Need help?{' '}
            <Link href="/contact" className="text-amber-400 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
