export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Star,
  Trophy,
  Target,
  BookOpen,
  Flame,
  Zap,
  Heart,
  Users,
  CheckCircle,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/badges',
  },
  title: 'My Badges | Student Portal',
  description: 'View your earned badges and achievements.',
};

// Default badge definitions if none exist in database
const defaultBadges = [
  {
    id: 'first-course',
    name: 'First Steps',
    description: 'Complete your first course',
    icon: 'BookOpen',
    color: 'blue',
    requirement: 'complete_course',
    threshold: 1,
  },
  {
    id: 'course-master',
    name: 'Course Master',
    description: 'Complete 5 courses',
    icon: 'Trophy',
    color: 'yellow',
    requirement: 'complete_course',
    threshold: 5,
  },
  {
    id: 'quiz-ace',
    name: 'Quiz Ace',
    description: 'Score 100% on any quiz',
    icon: 'Target',
    color: 'green',
    requirement: 'perfect_quiz',
    threshold: 1,
  },
  {
    id: 'streak-starter',
    name: 'Streak Starter',
    description: 'Maintain a 7-day learning streak',
    icon: 'Flame',
    color: 'orange',
    requirement: 'streak',
    threshold: 7,
  },
  {
    id: 'fast-learner',
    name: 'Fast Learner',
    description: 'Complete 10 lessons in one day',
    icon: 'Zap',
    color: 'blue',
    requirement: 'lessons_day',
    threshold: 10,
  },
  {
    id: 'community-helper',
    name: 'Community Helper',
    description: 'Help 5 other students in forums',
    icon: 'Heart',
    color: 'pink',
    requirement: 'forum_help',
    threshold: 5,
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Join 3 study groups',
    icon: 'Users',
    color: 'cyan',
    requirement: 'join_groups',
    threshold: 3,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Score 90%+ on 10 quizzes',
    icon: 'Star',
    color: 'amber',
    requirement: 'high_quiz_scores',
    threshold: 10,
  },
];

const iconMap: Record<string, any> = {
  BookOpen,
  Trophy,
  Target,
  Flame,
  Zap,
  Heart,
  Users,
  Star,
  Award,
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-600', border: 'border-brand-blue-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  blue: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-600', border: 'border-brand-blue-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
};

export default async function BadgesPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Badges" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch badges from database
  const { data: dbBadges } = await supabase
    .from('badges')
    .select('*')
    .order('created_at');

  // Fetch user's earned badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('*, badges (*)')
    .eq('user_id', user.id);

  // Fetch user stats for progress calculation
  const { count: completedCourses } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('score')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const { count: forumPosts } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id);

  // Use database badges or defaults
  const badges = dbBadges && dbBadges.length > 0 ? dbBadges : defaultBadges;
  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

  // Calculate progress for each badge
  const calculateProgress = (badge: any) => {
    switch (badge.requirement) {
      case 'complete_course':
        return Math.min(100, ((completedCourses || 0) / badge.threshold) * 100);
      case 'perfect_quiz':
        const perfectQuizzes = quizAttempts?.filter(q => q.score === 100).length || 0;
        return Math.min(100, (perfectQuizzes / badge.threshold) * 100);
      case 'high_quiz_scores':
        const highScores = quizAttempts?.filter(q => q.score >= 90).length || 0;
        return Math.min(100, (highScores / badge.threshold) * 100);
      case 'forum_help':
        return Math.min(100, ((forumPosts || 0) / badge.threshold) * 100);
      default:
        return 0;
    }
  };

  const earnedCount = earnedBadgeIds.size;
  const totalBadges = badges.length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Badges" }]} />
        </div>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Award className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">My Badges</h1>
          <p className="text-slate-600 mt-2">
            Earn badges by completing courses, quizzes, and engaging with the community
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">{earnedCount}</div>
            <div className="text-sm text-slate-600">Badges Earned</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-3xl font-bold text-slate-400">{totalBadges - earnedCount}</div>
            <div className="text-sm text-slate-600">Badges Remaining</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-3xl font-bold text-brand-blue-600">
              {totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0}%
            </div>
            <div className="text-sm text-slate-600">Completion</div>
          </div>
        </div>

        {/* Earned Badges */}
        {earnedCount > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Earned Badges
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {badges
                .filter(badge => earnedBadgeIds.has(badge.id))
                .map(badge => {
                  const IconComponent = iconMap[badge.icon] || Award;
                  const colors = colorMap[badge.color] || colorMap.blue;
                  const earnedBadge = userBadges?.find(ub => ub.badge_id === badge.id);

                  return (
                    <div
                      key={badge.id}
                      className={`bg-white rounded-xl border-2 ${colors.border} p-6 text-center`}
                    >
                      <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent className={`w-8 h-8 ${colors.text}`} />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{badge.name}</h3>
                      <p className="text-sm text-slate-600 mb-3">{badge.description}</p>
                      {earnedBadge && (
                        <p className="text-xs text-green-600 font-medium">
                          Earned {new Date(earnedBadge.earned_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Available Badges */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-400" />
            Available Badges
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges
              .filter(badge => !earnedBadgeIds.has(badge.id))
              .map(badge => {
                const IconComponent = iconMap[badge.icon] || Award;
                const colors = colorMap[badge.color] || colorMap.blue;
                const progress = calculateProgress(badge);

                return (
                  <div
                    key={badge.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 text-center opacity-75 hover:opacity-100 transition"
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                      <IconComponent className="w-8 h-8 text-slate-400" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-700 mb-1">{badge.name}</h3>
                    <p className="text-sm text-slate-500 mb-3">{badge.description}</p>
                    
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bg.replace('100', '500')} rounded-full transition-all`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{Math.round(progress)}% complete</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Empty State */}
        {badges.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Badges Available</h2>
            <p className="text-slate-600 mb-6">
              Complete courses and certifications to earn badges. Your achievements will appear here.
            </p>
            <Link
              href="/lms/courses"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition"
            >
              <BookOpen className="w-5 h-5" />
              Browse Courses
            </Link>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/lms/dashboard" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
