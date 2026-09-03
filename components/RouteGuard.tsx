'use client';

import React from 'react';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

export type UserRole = 'student' | 'instructor' | 'admin' | 'program_holder' | 'delegate';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function RouteGuard({
  children,
  requireAuth = true,
  allowedRoles = [],
  redirectTo = '/login',
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // If auth is required and no user, redirect to login
      if (requireAuth && (!user || error)) {
        router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // If no auth required or no role restrictions, allow access
      if (!requireAuth || allowedRoles.length === 0) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Check user role
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const userRole = profile?.role as UserRole;

        // Check if user has required role
        if (userRole && allowedRoles.includes(userRole)) {
          setIsAuthorized(true);
        } else {
          router.push('/unauthorized');
          return;
        }
      }

      setIsLoading(false);
    }

    checkAuth();
  }, [requireAuth, allowedRoles, redirectTo, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

// Specific route guards for common use cases
export function StudentRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth allowedRoles={['student']}>
      {children}
    </RouteGuard>
  );
}

export function InstructorRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth allowedRoles={['instructor', 'admin']}>
      {children}
    </RouteGuard>
  );
}

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth allowedRoles={['admin']}>
      {children}
    </RouteGuard>
  );
}

export function AuthenticatedRouteGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth allowedRoles={[]}>
      {children}
    </RouteGuard>
  );
}
