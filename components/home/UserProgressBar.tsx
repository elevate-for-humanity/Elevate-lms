'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  courses?: { title: string; slug: string };
}

// Check for Supabase session cookie without a network request.
// Supabase sets sb-<project>-auth-token; if absent the user is definitely logged out.
function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('sb-') && document.cookie.includes('-auth-token');
}

export default function UserProgressBar() {
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => {
    // Skip all network requests if no session cookie — user is logged out
    if (!hasSessionCookie()) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Fire both requests in parallel instead of sequentially
    Promise.all([
      fetch('/api/auth/me', { credentials: 'include', signal: controller.signal }),
      fetch('/api/student/enrollments', { credentials: 'include', signal: controller.signal }),
    ])
      .then(async ([authRes, enrollRes]) => {
        if (!authRes.ok) return; // not logged in — render nothing
        const enrollData = enrollRes.ok ? await enrollRes.json() : null;
        const active = enrollData?.enrollments?.find((e: Enrollment) => e.status === 'active');
        if (active) setActiveEnrollment(active);
      })
      .catch(() => {
        /* network error or abort — render nothing */
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  if (!activeEnrollment) return null;

  return (
    <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-brand-green-50 to-brand-blue-50 border-b border-brand-green-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              Your Learning Progress
            </h2>
            <p className="text-sm text-slate-600">
              {activeEnrollment.courses?.title || 'Current Program'} •{' '}
              {activeEnrollment.progress || 0}% complete
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-48 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green-500 rounded-full transition-all duration-500"
                style={{ width: `${activeEnrollment.progress || 0}%` }}
              />
            </div>
            <Link
              href="https://app.elevateforhumanity.org/lms/dashboard"
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
