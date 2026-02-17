
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LMSNavigation } from '@/components/lms/LMSNavigation';
import { AIInstructorWidget } from '@/components/AIInstructorWidget';
import { LogoStamp } from '@/components/layout/LogoBanner';
import { canAccessRoute, getUnauthorizedRedirect } from '@/lib/auth/lms-routes';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';

function LmsAppLayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    // NO DEMO MODE BYPASS - All users must authenticate
    const supabase = createClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data?.user) {
        router.push('/login?next=/lms/dashboard');
        return;
      }

      setUser(data.user);

      supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profileData }) => {
          setProfile(profileData);
          
          // Check role-based access
          if (profileData?.role && !canAccessRoute(pathname, profileData.role)) {
            setAuthorized(false);
            router.push(getUnauthorizedRedirect(profileData.role));
            return;
          }
          
          setLoading(false);
        });
    });
  }, [router, pathname]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">{!authorized ? 'Redirecting...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <IdleTimeoutGuard />
      <LMSNavigation user={user} profile={profile} />
      <main id="main-content" role="main" aria-label="LMS content" tabIndex={-1}>{children}</main>
      {/* Logo stamp for brand recognition */}
      <LogoStamp />
      {/* AI Instructor Widget - Available on all LMS pages */}
      <AIInstructorWidget context="lesson" />
    </div>
  );
}

export default function LmsAppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <LmsAppLayoutInner>{children}</LmsAppLayoutInner>
    </Suspense>
  );
}
