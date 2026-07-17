import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Trophy, Medal, Flame } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'See top learners and compete for the top spots.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/leaderboard',
  },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  // Fetch via canonical leaderboard API (includes achievements + badges)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  let topLearners: any[] = [];
  try {
    const res = await fetch(`${siteUrl}/api/leaderboard?limit=50`, { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      topLearners = d.leaderboard ?? d.data ?? [];
    }
  } catch {
    // fallback — direct query if API unreachable during SSR
    const supabase = await createClient();
    const db = (await requireAdminClient()) || supabase;
    const { data } = await db.from('user_points').select('*').limit(50);
    topLearners = (data as any[]) || [];
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Leaderboard' }]} />
        </div>
      </div>

      <section className="bg-yellow-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Leaderboard</h1>
          <p className="text-yellow-100">Top learners this month</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Top 3 Podium */}
        <div className="flex justify-center items-end gap-4 mb-12">
          {[topLearners[1], topLearners[0], topLearners[2]].map((learner, i) => (
            <div
              key={i}
              className={`text-center ${i === 1 ? 'order-2' : i === 0 ? 'order-1' : 'order-3'}`}
            >
              <div
                className={`w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  i === 1 ? 'bg-yellow-100' : i === 0 ? 'bg-slate-100' : 'bg-brand-orange-100'
                }`}
              >
                <Medal
                  className={`w-10 h-10 ${i === 1 ? 'text-yellow-600' : i === 0 ? 'text-slate-600' : 'text-brand-orange-600'}`}
                />
              </div>
              <p className="font-bold text-slate-900">{learner?.name ?? '—'}</p>
              <p className="text-2xl font-bold text-slate-900">{(learner?.points ?? 0).toLocaleString()}</p>
              <p className="text-slate-500 text-sm">points</p>
              <div
                className={`mt-2 ${i === 1 ? 'h-32 bg-yellow-500' : i === 0 ? 'h-24 bg-slate-400' : 'h-20 bg-brand-orange-400'} rounded-t-lg w-24`}
              ></div>
            </div>
          ))}
        </div>

        {/* Full List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-slate-900">All Rankings</h2>
          </div>
          <div className="divide-y">
            {topLearners.map((learner, idx) => (
              <div key={learner?.rank ?? idx} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    learner?.rank === 1
                      ? 'bg-yellow-100 text-yellow-700'
                      : learner?.rank === 2
                        ? 'bg-slate-100 text-slate-700'
                        : learner?.rank === 3
                          ? 'bg-brand-orange-100 text-brand-orange-700'
                          : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  {learner?.rank ?? idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{learner?.name ?? '—'}</p>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-brand-orange-500" /> {learner?.streak ?? 0} day
                      streak
                    </span>
                    <span>{learner?.courses ?? 0} courses</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{(learner?.points ?? 0).toLocaleString()}</p>
                  <p className="text-slate-500 text-sm">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
