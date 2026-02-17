import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Trophy, 
  Calendar,
  ArrowRight,
  Zap
} from 'lucide-react';
import AutomationFeed from '@/components/hub/AutomationFeed';
import EnrollmentState from '@/components/hub/EnrollmentState';
import CohortView from '@/components/hub/CohortView';
import { HubNavigation } from '@/components/navigation/HubNavigation';

export const metadata: Metadata = {
  title: 'Hub | Elevate for Humanity',
  description: 'Your operational command center - track progress, view automation, and manage your journey.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/hub',
  },
};

export const dynamic = 'force-dynamic';

const navItems = [
  { name: 'Classroom', href: '/hub/classroom', icon: BookOpen, description: 'Continue learning' },
  { name: 'Leaderboard', href: '/hub/leaderboard', icon: Trophy, description: 'See rankings' },
  { name: 'Members', href: '/hub/members', icon: Users, description: 'Connect with peers' },
  { name: 'Calendar', href: '/hub/calendar', icon: Calendar, description: 'Upcoming events' },
];

export default async function HubPage() {
  const supabase = await createClient();
  
  if (!supabase) redirect('/hub/welcome');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/hub/welcome');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, points, onboarding_completed')
    .eq('id', user.id)
    .single();

  // Redirect to onboarding if not completed
  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  // Check if user is admin/staff for cohort view
  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff' || profile?.role === 'program_holder';

  return (
    <div className="min-h-screen bg-slate-50">
      <HubNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-slate-700 text-sm mb-2">
            <LayoutDashboard className="w-4 h-4" />
            <span>Command Center</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-700 mt-1">
            Track your progress and see what's happening in the system.
          </p>
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-brand-green-300 transition group"
            >
              <item.icon className="w-6 h-6 text-slate-400 group-hover:text-brand-green-600 mb-2" />
              <h3 className="font-medium text-slate-900">{item.name}</h3>
              <p className="text-sm text-slate-700">{item.description}</p>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column - Enrollment State */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Your Status
              </h2>
              <EnrollmentState userId={user.id} />
            </div>

            {/* Cohort View for Admins */}
            {isAdmin && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-blue-500" />
                  Cohort Overview
                </h2>
                <CohortView />
              </div>
            )}
          </div>

          {/* Sidebar - Automation Feed */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              System Activity
            </h2>
            <AutomationFeed limit={15} />
          </div>
        </div>
      </div>
    </div>
  );
}
