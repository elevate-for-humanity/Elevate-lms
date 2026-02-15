import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Trophy, Medal, Flame } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard | Elevate For Humanity',
  description: 'See top learners and compete for the top spots.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/leaderboard',
  },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const topLearners = [
  { rank: 1, name: 'Sarah M.', points: 12450, streak: 45, courses: 8 },
  { rank: 2, name: 'Michael R.', points: 11200, streak: 32, courses: 7 },
  { rank: 3, name: 'Emily K.', points: 10800, streak: 28, courses: 6 },
  { rank: 4, name: 'David L.', points: 9500, streak: 21, courses: 5 },
  { rank: 5, name: 'Jessica T.', points: 8900, streak: 18, courses: 5 },
];

export default async function LeaderboardPage() {

  return (
    <div className="min-h-screen bg-gray-50">
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
            <div key={i} className={`text-center ${i === 1 ? 'order-2' : i === 0 ? 'order-1' : 'order-3'}`}>
              <div className={`w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center ${
                i === 1 ? 'bg-yellow-100' : i === 0 ? 'bg-gray-100' : 'bg-orange-100'
              }`}>
                <Medal className={`w-10 h-10 ${i === 1 ? 'text-yellow-600' : i === 0 ? 'text-gray-600' : 'text-orange-600'}`} />
              </div>
              <p className="font-bold text-gray-900">{learner.name}</p>
              <p className="text-2xl font-bold text-gray-900">{learner.points.toLocaleString()}</p>
              <p className="text-gray-500 text-sm">points</p>
              <div className={`mt-2 ${i === 1 ? 'h-32 bg-yellow-500' : i === 0 ? 'h-24 bg-gray-400' : 'h-20 bg-orange-400'} rounded-t-lg w-24`}></div>
            </div>
          ))}
        </div>

        {/* Full List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">All Rankings</h2>
          </div>
          <div className="divide-y">
            {topLearners.map((learner) => (
              <div key={learner.rank} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  learner.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                  learner.rank === 2 ? 'bg-gray-100 text-gray-700' :
                  learner.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-600'
                }`}>{learner.rank}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{learner.name}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> {learner.streak} day streak</span>
                    <span>{learner.courses} courses</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{learner.points.toLocaleString()}</p>
                  <p className="text-gray-500 text-sm">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
