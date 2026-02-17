import { Trophy, Star, Target, Award, TrendingUp } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  points: number;
}

interface ProgressTrackerProps {
  currentPoints: number;
  totalPoints: number;
  level: number;
  milestones: Milestone[];
  programName: string;
}

export function ProgressTracker({
  currentPoints,
  totalPoints,
  level,
  milestones,
  programName,
}: ProgressTrackerProps) {
  const progressPercentage = (currentPoints / totalPoints) * 100;

  return (
    <div className="bg-white rounded-2xl border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-black">Your Progress</h3>
          <p className="text-sm text-black">{programName}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-orange-50 rounded-full">
          <Trophy className="w-5 h-5 text-brand-orange-600" />
          <span className="font-bold text-brand-orange-600">Level {level}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-black">Overall Progress</span>
          <span className="text-sm font-bold text-black">
            {currentPoints} / {totalPoints} points
          </span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900   transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h4 className="text-sm font-semibold text-black mb-3">Milestones</h4>
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                milestone.completed
                  ? 'bg-brand-green-50 border-brand-green-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  milestone.completed
                    ? 'bg-brand-green-500 text-white'
                    : 'bg-slate-300 text-black'
                }`}
              >
                {milestone.completed ? (
                  <Award className="w-4 h-4" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-black">{milestone.title}</h5>
                  <span className="text-xs font-bold text-brand-orange-600">
                    +{milestone.points} pts
                  </span>
                </div>
                <p className="text-sm text-black mt-1">{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-black">
          <TrendingUp className="w-4 h-4 text-brand-green-600" />
          <span>Keep going! Complete all milestones to complete your training.</span>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="pt-4 border-t">
        <p className="text-xs text-slate-500">
          <strong>Note:</strong> Progress tracking is for motivational purposes.
          Actual program completion requires meeting all DOL and state licensing requirements,
          including minimum hours, assessments, and competency demonstrations.
        </p>
      </div>
    </div>
  );
}

// Leaderboard Component (Anonymized for FERPA Compliance)
export function Leaderboard() {
  const topPerformers = [
    { rank: 1, initials: 'J.S.', points: 2450, level: 8 },
    { rank: 2, initials: 'M.R.', points: 2380, level: 8 },
    { rank: 3, initials: 'A.T.', points: 2290, level: 7 },
    { rank: 4, initials: 'K.L.', points: 2150, level: 7 },
    { rank: 5, initials: 'D.W.', points: 2080, level: 7 },
  ];

  return (
    <div className="bg-white rounded-2xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-bold text-black">Top Performers This Month</h3>
      </div>

      <div className="space-y-2">
        {topPerformers.map((performer) => (
          <div
            key={performer.rank}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  performer.rank === 1
                    ? 'bg-yellow-400 text-yellow-900'
                    : performer.rank === 2
                    ? 'bg-slate-300 text-black'
                    : performer.rank === 3
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 text-black'
                }`}
              >
                {performer.rank}
              </div>
              <div>
                <div className="font-semibold text-black">{performer.initials}</div>
                <div className="text-xs text-slate-500">Level {performer.level}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-brand-orange-600">{performer.points}</div>
              <div className="text-xs text-slate-500">points</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-slate-500">
          <strong>Privacy Notice:</strong> Leaderboard displays anonymized initials only to protect student privacy
          in compliance with FERPA regulations. Full names are never displayed publicly.
        </p>
      </div>
    </div>
  );
}

// Achievement Badges
export function AchievementBadges({ badges }: { badges: string[] }) {
  const badgeIcons: Record<string, { icon: any; color: string; label: string }> = {
    'first-day': { icon: Star, color: 'bg-brand-blue-500', label: 'First Day Complete' },
    'week-one': { icon: Target, color: 'bg-brand-green-500', label: 'Week 1 Champion' },
    'perfect-attendance': { icon: Award, color: 'bg-purple-500', label: 'Perfect Attendance' },
    'skills-master': { icon: Trophy, color: 'bg-yellow-500', label: 'Skills Master' },
    'mentor': { icon: TrendingUp, color: 'bg-indigo-500', label: 'Peer Mentor' },
  };

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h3 className="text-lg font-bold text-black mb-4">Your Achievements</h3>
      <div className="grid grid-cols-3 gap-4">
        {badges.map((badgeId) => {
          const badge = badgeIcons[badgeId];
          if (!badge) return null;
          const Icon = badge.icon;
          return (
            <div key={badgeId} className="flex flex-col items-center gap-2">
              <div className={`w-16 h-16 rounded-full ${badge.color} flex items-center justify-center`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <span className="text-xs text-center font-medium text-black">{badge.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
