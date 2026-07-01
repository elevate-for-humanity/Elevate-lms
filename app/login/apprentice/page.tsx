import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { GraduationCap, Scissors } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ApprenticeLoginForm from './ApprenticeLoginForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { resolveStudentHomePath } from '@/lib/portal/resolve-student-home';
import { validateRedirect } from '@/lib/auth/validate-redirect';

export const metadata: Metadata = {
  title: `Apprentice Login — ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Sign in to your apprenticeship portal. Track hours, competencies, timeclock, and training progress.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; next?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = validateRedirect(params.redirect ?? params.next, '');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('portal_type')
      .eq('id', user.id)
      .maybeSingle();
    const home = await resolveStudentHomePath(supabase, user.id, profile?.portal_type);
    // Apprentice login page: never fall through to generic learner dashboard
    const dest = home === '/learner/dashboard' ? '/apprentice' : home;
    redirect(redirectTo || dest);
  }

  return (
    <>
      <section className="relative h-[200px] w-full overflow-hidden">
        <Image
          src="/images/beauty/hero-program-barber.webp"
          alt="Barber and beauty apprenticeship training"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </section>

      <section className="py-10 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-6 h-6 text-white" aria-hidden />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Apprentice Portal</h1>
              <p className="text-slate-600 text-sm mt-1">Registered Apprenticeship Program</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <GraduationCap className="w-4 h-4 text-amber-600" aria-hidden />
                <span className="text-xs text-amber-700 font-semibold uppercase tracking-widest">
                  DOL Registered
                </span>
              </div>
            </div>

            <ApprenticeLoginForm redirectTo={redirectTo || undefined} />

            <div className="mt-6 text-center space-y-2 text-sm">
              <Link href="/login" className="text-slate-500 hover:text-slate-800 block">
                Not an apprentice? Sign in as a different role →
              </Link>
              <p className="text-slate-500">
                Need help?{' '}
                <Link href="/contact" className="text-brand-blue-600 hover:underline font-medium">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
