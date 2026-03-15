'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  courses?: { title: string; slug: string };
}

export default function UserProgressBar() {
  const [user, setUser] = useState<{ id?: string } | null>(null);
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const checkAuth = async () => {
      try {
        const authRes = await fetch('/api/auth/me', {
          credentials: 'include',
          signal: controller.signal,
        });
        
        if (authRes.ok) {
          const data = await authRes.json();
          if (data?.user) {
            setUser(data.user);
            
            try {
              const enrollRes = await fetch('/api/student/enrollments', {
                credentials: 'include',
              });
              if (enrollRes.ok) {
                const enrollData = await enrollRes.json();
                const active = enrollData?.enrollments?.find((e: Enrollment) => e.status === 'active');
                setActiveEnrollment(active || null);
              }
            } catch {
              // Enrollment fetch failed
            }
          }
        }
      } catch {
        // Auth check failed
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    checkAuth();
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  if (isLoading || !user || !activeEnrollment) return null;

  return (
    <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-brand-green-50 to-brand-blue-50 border-b border-brand-green-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              Your Learning Progress
            </h2>
            <p className="text-sm text-slate-600">
              {activeEnrollment.courses?.title || 'Current Program'} • {activeEnrollment.progress || 0}% complete
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-48 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${activeEnrollment.progress || 0}%` }}
              />
            </div>
            <Link
              href="/learner/dashboard"
              className="inline-flex items-center justify-center bg-brand-green-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-brand-green-700 transition-colors text-sm"
            >
              Continue Learning
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
