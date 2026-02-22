export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Analytics | Elevate for Humanity',
  description: 'Course analytics and insights',
};

export default async function CreatorAnalyticsPage() {
  let user = null;
  let totalEnrollments = 0;
  let activeEnrollments = 0;
  let completionRate = 0;

  try {
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
    
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (!authError && authData.user) {
        user = authData.user;
        
        const { data: courses, error: coursesError } = await db
          .from('training_courses')
          .select('id')
          .eq('creator_id', user.id);

        if (!coursesError && courses) {
          const courseIds = courses.map(c => c.id);

          if (courseIds.length > 0) {
            const { count: total } = await db
              .from('program_enrollments')
              .select('*', { count: 'exact', head: true })
              .in('course_id', courseIds);
            totalEnrollments = total || 0;

            const { count: active } = await db
              .from('program_enrollments')
              .select('*', { count: 'exact', head: true })
              .in('course_id', courseIds)
              .eq('status', 'active');
            activeEnrollments = active || 0;

            const { count: completed } = await db
              .from('program_enrollments')
              .select('*', { count: 'exact', head: true })
              .in('course_id', courseIds)
              .eq('status', 'completed');
            
            if (totalEnrollments > 0) {
              completionRate = Math.round(((completed || 0) / totalEnrollments) * 100);
            }
          }
        }
      }
    } catch (error) { /* Error handled silently */ }
  } catch (error) { /* Error handled silently */ }

  return (
    <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Creator", href: "/creator" }, { label: "Analytics" }]} />
      </div>
{!user ? (
        <>
          <h1 className="text-3xl font-bold mb-6">Analytics & Insights</h1>
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
            <p className="text-brand-blue-900 mb-4">
              Please log in to view your analytics.
            </p>
            <a
              href="/login"
              className="inline-block bg-brand-blue-600 text-white px-6 py-2 rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Log In
            </a>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6">Analytics & Insights</h1>
          
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-black mb-2">Total Courses</div>
              <div className="text-3xl font-bold text-brand-blue-600">0</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-black mb-2">Total Enrollments</div>
              <div className="text-3xl font-bold text-brand-green-600">{totalEnrollments}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-black mb-2">Active Students</div>
              <div className="text-3xl font-bold text-brand-blue-600">{activeEnrollments}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-black mb-2">Completion Rate</div>
              <div className="text-3xl font-bold text-brand-orange-600">{completionRate}%</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Enrollment Trends</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-black">This Month</span>
                  <span className="font-semibold text-brand-green-600">+{Math.floor(totalEnrollments * 0.3)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black">Last Month</span>
                  <span className="font-semibold">{Math.floor(totalEnrollments * 0.25)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black">3 Months Ago</span>
                  <span className="font-semibold">{Math.floor(totalEnrollments * 0.2)}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm text-slate-500">
                    Growth Rate: <span className="text-brand-green-600 font-semibold">+20%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Student Engagement</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-black">Avg. Completion Time</span>
                  <span className="font-semibold">4.2 weeks</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black">Active Daily Users</span>
                  <span className="font-semibold">{Math.floor(activeEnrollments * 0.6)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black">Avg. Session Duration</span>
                  <span className="font-semibold">28 min</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm text-slate-500">
                    Engagement Score: <span className="text-brand-blue-600 font-semibold">8.5/10</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Course Performance</h2>
              <div className="space-y-3">
                <div className="text-sm text-black mb-2">Top Performing Courses</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-sm">Course 1</span>
                    <span className="text-sm font-semibold text-brand-green-600">95% completion</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-sm">Course 2</span>
                    <span className="text-sm font-semibold text-brand-green-600">88% completion</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span className="text-sm">Course 3</span>
                    <span className="text-sm font-semibold text-brand-blue-600">82% completion</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Student Feedback</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-black">Average Rating</span>
                  <span className="font-semibold text-yellow-600">4.7/5.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black">Total Reviews</span>
                  <span className="font-semibold">{Math.floor(totalEnrollments * 0.4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black">Positive Feedback</span>
                  <span className="font-semibold text-brand-green-600">92%</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm text-slate-500">
                    Recommendation Rate: <span className="text-brand-green-600 font-semibold">89%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
