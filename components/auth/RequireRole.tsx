'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RequireRoleProps {
  role: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ role, children, fallback }: RequireRoleProps) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const roles = Array.isArray(role) ? role : [role];
    const roleParam = roles[0]; // Check first role, backend will check admin/super_admin too

    fetch(`/api/auth/check-role?role=${roleParam}`)
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        
        if (!data.hasRole) {
          router.push('/');
          return;
        }
        
        setHasAccess(true);
        setAuthChecked(true);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [role, router]);

  if (!authChecked) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
