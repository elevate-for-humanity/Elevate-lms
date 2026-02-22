import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { 
  Trophy, 
  Star, 
  Award, 
  Target, 
  Flame, 
  Zap,
  BookOpen,
  Clock,
  Users,
  Lock,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Achievements | Elevate for Humanity',
  description: 'View your earned achievements and badges from your learning journey.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/achievements',
  },
};

export const dynamic = 'force-dynamic';

// Achievement categories with their icons
const achievementIcons: Record<string, any> = {
  'first-login': Star,
  'first-course': BookOpen,
  'course-complete': CheckCircle,
  'perfect-score': Trophy,
  'streak-7': Flame,
  'streak-30': Zap,
  'hours-10': Clock,
  'hours-50': Clock,
  'hours-100': Award,
  'helper': Users,
  'goal-setter': Target,
  default: Trophy,
};

export default async function AchievementsPage() {
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
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    // Show public preview instead of blocking with login
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Breadcrumbs items={[{ label: 'Achievements' }]} />
          </div>
        </div>
        <section className="bg-gradient-to-br from-yellow-500 to-brand-orange-500 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-extrabold mb-4">Earn Achievements & Badges</h1>
            <p className="text-xl text-white/90 mb-8">Complete courses, hit milestones, and earn badges that showcase your skills to employers. Every step of your learning journey is recognized.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/20 rounded-xl p-4"><Star className="w-8 h-8 mx-auto mb-2" /><p className="font-bold">First Steps</p><p className="text-sm text-white/80">Complete your first lesson</p></div>
              <div className="bg-white/20 rounded-xl p-4"><BookOpen className="w-8 h-8 mx-auto mb-2" /><p className="font-bold">Course Complete</p><p className="text-sm text-white/80">Finish an entire course</p></div>
              <div className="bg-white/20 rounded-xl p-4"><Flame className="w-8 h-8 mx-auto mb-2" /><p className="font-bold">Streak Master</p><p className="text-sm text-white/80">7-day learning streak</p></div>
              <div className="bg-white/20 rounded-xl p-4"><Award className="w-8 h-8 mx-auto mb-2" /><p className="font-bold">Certified</p><p className="text-sm text-white/80">Earn a certification</p></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="bg-white text-brand-orange-600 font-bold px-8 py-4 rounded-lg hover:bg-brand-orange-50 transition">Create Free Account</Link>
              <Link href="/programs" className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition">Browse Programs</Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Fetch user's earned achievements
  const { data: earnedAchievements } = await db
    .from('user_achievements')
    .select(`
      id,
      earned_at,
      achievements (
        id,
        name,
        description,
        icon,
        category,
        points
      )
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  // Fetch all available achievements
  const { data: allAchievements } = await db
    .from('achievements')
    .select('*')
    .eq('active', true)
    .order('points', { ascending: true });

  // Get user profile for stats
  const { data: profile } = await db
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Calculate stats
  const earnedIds = new Set(earnedAchievements?.map((ea: any) => ea.achievements?.id) || []);
  const totalPoints = earnedAchievements?.reduce((sum: number, ea: any) => sum + (ea.achievements?.points || 0), 0) || 0;
  const earnedCount = earnedAchievements?.length || 0;
  const totalCount = allAchievements?.length || 0;

  const userName = profile?.full_name || user.email?.split('@')[0] || 'Learner';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Achievements' }]} />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Elevate for Humanity
            </Link>
            <Link href="/learner/dashboard" className="text-sm text-brand-orange-600 hover:text-brand-orange-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
          <p className="text-gray-600">
            Track your progress and earn badges as you complete your learning journey.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Achievements Earned</p>
                <p className="text-2xl font-bold text-gray-900">{earnedCount} / {totalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Points</p>
                <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Earned Achievements */}
        {earnedAchievements && earnedAchievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedAchievements.map((item: any) => {
                const achievement = item.achievements;
                if (!achievement) return null;
                
                const IconComponent = achievementIcons[achievement.icon] || achievementIcons.default;
                
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{achievement.name}</h3>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            Earned {new Date(item.earned_at).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-medium text-brand-orange-600">
                            +{achievement.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Achievements */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Achievements</h2>
          {allAchievements && allAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAchievements.map((achievement: any) => {
                const isEarned = earnedIds.has(achievement.id);
                const IconComponent = achievementIcons[achievement.icon] || achievementIcons.default;
                
                return (
                  <div
                    key={achievement.id}
                    className={`rounded-xl p-6 shadow-sm border transition ${
                      isEarned 
                        ? 'bg-white border-gray-200' 
                        : 'bg-gray-100 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isEarned 
                          ? 'bg-yellow-500' 
                          : 'bg-gray-300'
                      }`}>
                        {isEarned ? (
                          <IconComponent className="w-7 h-7 text-white" />
                        ) : (
                          <Lock className="w-7 h-7 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm mb-2 line-clamp-2 ${isEarned ? 'text-gray-500' : 'text-gray-400'}`}>
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${isEarned ? 'text-brand-green-600 font-medium' : 'text-gray-400'}`}>
                            {isEarned ? '• Earned' : 'Locked'}
                          </span>
                          <span className={`text-xs font-medium ${isEarned ? 'text-brand-orange-600' : 'text-gray-400'}`}>
                            {achievement.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Achievements Available</h3>
              <p className="text-gray-500 mb-4">
                Achievements will appear here as they become available.
              </p>
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange-600 text-white font-medium rounded-lg hover:bg-brand-orange-700 transition"
              >
                Start Learning
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
