import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Clock,
  FileText,
  Award,
  BookOpen,
  ArrowRight,
  Scissors,
  AlertTriangle,
  CreditCard,
  Video,
  Calendar,
  MessageSquare,
  HelpCircle,
  MapPin,
  Target,
  TrendingUp,
  CheckCircle,
  Play,
  Users,
  FileCheck,
  Settings,
  Bell,
  ChevronRight,
  ScissorsIcon,
  Hammer,
  Sparkles,
  User,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apprentice Portal | Indiana Barber Apprenticeship',
  description: 'Track your Indiana barber apprenticeship progress, hours, and certifications.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apprentice',
  },
};

export const dynamic = 'force-dynamic';

// Navigation items for left sidebar
const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/apprentice', icon: GraduationCap, active: true },
  { id: 'workbook', label: 'Workbook', href: '/apprentice/workbook', icon: BookOpen },
  { id: 'course', label: 'Video Training', href: '/apprentice/course', icon: Video },
  { id: 'timeclock', label: 'Clock Hours', href: '/apprentice/timeclock', icon: Clock },
  { id: 'the-bosses', label: 'The Bosses (VR)', href: '/admin/staff-portal/vr', icon: Globe },
  { id: 'competencies', label: 'Skills', href: '/apprentice/competencies', icon: Scissors },
  { id: 'attendance', label: 'Attendance', href: '/apprentice/attendance', icon: Calendar },
  { id: 'documents', label: 'Documents', href: '/apprentice/documents', icon: FileText },
  { id: 'portfolio', label: 'Portfolio', href: '/apprentice/portfolio', icon: Award },
  { id: 'billing', label: 'Payments', href: '/apprentice/billing', icon: CreditCard },
];

const rightNavItems = [
  { id: 'messages', label: 'Messages', href: '/apprentice/messages', icon: MessageSquare },
  { id: 'resources', label: 'Resources', href: '/apprentice/resources', icon: HelpCircle },
  { id: 'profile', label: 'Profile', href: '/apprentice/profile', icon: User },
];

// Progress card component
function ProgressCard({ icon: Icon, label, value, total, color, suffix = '' }: {
  icon: React.ElementType;
  label: string;
  value: number;
  total?: number;
  color: string;
  suffix?: string;
}) {
  const percent = total ? Math.min(Math.round((value / total) * 100), 100) : null;
  
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">
            {value.toLocaleString()}{total !== undefined && ` / ${total.toLocaleString()}`}{suffix}
          </p>
          {percent !== null && (
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${color.replace('100', '500').replace('bg-', 'bg-')}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick action card
function QuickAction({ icon: Icon, label, description, href, color }: {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:border-brand-blue-200 transition-all">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">{label}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

// Skill progress card
function SkillProgress({ name, icon: Icon, percent, color }: {
  name: string;
  icon: React.ElementType;
  percent: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-900 text-sm">{name}</p>
          <p className="text-xs text-slate-500">{percent}% complete</p>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default async function ApprenticePortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  // Real database stats for the apprentice
  const { data: hourStats } = await supabase
    .from('hour_entries')
    .select('hours_claimed, accepted_hours, status')
    .eq('user_id', user.id);

  const hoursCompleted = hourStats?.reduce((sum, h) => sum + (Number(h.accepted_hours) || 0), 0) || 0;
  const pendingHours = hourStats?.filter(h => h.status === 'pending').length || 0;

  const stats = {
    hoursCompleted,
    hoursRequired: 2000,
    attendancePercent: 92,
    skillsMastered: 12,
    skillsTotal: 45,
    certificationsEarned: 2,
    rtiHours: 36,
    rtiRequired: 144,
  };

  const nextAction = {
    label: 'Complete Orientation',
    time: 'Today',
    description: 'Finish your apprenticeship orientation module'
  };

  const upcomingTasks = [
    { id: 1, title: 'Watch RTI Module 5', due: 'Today', type: 'video' },
    { id: 2, title: 'Log 4 hours at shop', due: 'Tomorrow', type: 'hours' },
    { id: 3, title: 'Practice fade technique', due: 'This week', type: 'skill' },
  ];

  const skills = [
    { name: 'Haircutting', icon: ScissorsIcon, percent: 80, color: 'bg-blue-100 text-blue-600' },
    { name: 'Color Theory', icon: Sparkles, percent: 60, color: 'bg-purple-100 text-purple-600' },
    { name: 'Sanitation', icon: CheckCircle, percent: 100, color: 'bg-green-100 text-green-600' },
    { name: 'Shaving', icon: Hammer, percent: 45, color: 'bg-amber-100 text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue-500/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Apprentice Portal</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Search courses, skills, tasks..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-brand-blue-500 text-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-xl hover:bg-slate-100 transition">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Link href="/apprentice/profile" className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition">
                <div className="w-8 h-8 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-blue-600" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="bg-white rounded-2xl border border-slate-100 p-4 sticky top-24">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      item.active 
                        ? 'bg-brand-blue-50 text-brand-blue-700' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {item.active && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Support</p>
                {rightNavItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Welcome Hero Banner */}
            <div className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-600 to-indigo-700 rounded-3xl p-8 mb-6 text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="absolute top-8 right-8 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <p className="text-brand-blue-200 text-sm font-medium mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || 'Apprentice'}</p>
                    <h1 className="text-4xl font-bold mb-3">{programName}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        {programLevel}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {instructorName}
                      </span>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                        License Goal: Indiana Barber
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                      <p className="text-sm text-white/70">Next Action</p>
                      <p className="font-semibold">{nextAction.label}</p>
                      <p className="text-xs text-white/70">{nextAction.time}</p>
                    </div>
                    <button className="bg-white text-brand-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition shadow-lg flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Continue Learning
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <ProgressCard 
                icon={Clock} 
                label="Hours Completed" 
                value={stats.hoursCompleted} 
                total={stats.hoursRequired}
                color="bg-blue-100 text-blue-600"
                suffix=" hrs"
              />
              <ProgressCard 
                icon={Target} 
                label="Hours Remaining" 
                value={stats.hoursRequired - stats.hoursCompleted}
                total={stats.hoursRequired}
                color="bg-amber-100 text-amber-600"
                suffix=" hrs"
              />
              <ProgressCard 
                icon={Calendar} 
                label="Attendance" 
                value={stats.attendancePercent}
                color="bg-green-100 text-green-600"
                suffix="%"
              />
              <ProgressCard 
                icon={TrendingUp} 
                label="Skills Mastered" 
                value={stats.skillsMastered}
                total={stats.skillsTotal}
                color="bg-purple-100 text-purple-600"
              />
              <ProgressCard 
                icon={Award} 
                label="Certifications" 
                value={stats.certificationsEarned}
                color="bg-indigo-100 text-indigo-600"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Quick Actions & Skills */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickAction icon={Clock} label="Clock In/Out" description="Log work hours" href="/apprentice/timeclock" color="bg-green-100 text-green-600" />
                    <QuickAction icon={Video} label="Watch Video" description="RTI training" href="/apprentice/course" color="bg-cyan-100 text-cyan-600" />
                    <QuickAction icon={FileCheck} label="Submit Work" description="Upload assignments" href="/apprentice/workbook" color="bg-violet-100 text-violet-600" />
                    <QuickAction icon={Calendar} label="Schedule" description="Book practical" href="/apprentice/attendance" color="bg-rose-100 text-rose-600" />
                  </div>
                </div>

                {/* Skills Progress */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Skills Progress</h2>
                    <Link href="/apprentice/competencies" className="text-sm text-brand-blue-600 font-medium hover:underline">
                      View All
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {skills.map((skill) => (
                      <SkillProgress key={skill.name} {...skill} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Tasks & Compliance */}
              <div className="space-y-6">
                {/* Today's Tasks */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Today's Tasks</h2>
                    <span className="text-sm text-slate-500">{upcomingTasks.length} tasks</span>
                  </div>
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          task.type === 'video' ? 'bg-cyan-100' :
                          task.type === 'hours' ? 'bg-green-100' : 'bg-amber-100'
                        }`}>
                          {task.type === 'video' && <Video className="w-5 h-5 text-cyan-600" />}
                          {task.type === 'hours' && <Clock className="w-5 h-5 text-green-600" />}
                          {task.type === 'skill' && <Scissors className="w-5 h-5 text-amber-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{task.title}</p>
                          <p className="text-xs text-slate-500">{task.due}</p>
                        </div>
                        <button className="p-2 hover:bg-white rounded-lg transition">
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indiana Compliance Widget */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-bold text-amber-900">Indiana Requirements</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-amber-800">OJL Hours</span>
                      <span className="text-sm font-semibold text-amber-900">{Math.round(stats.hoursCompleted / stats.hoursRequired * 100)}%</span>
                    </div>
                    <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.hoursCompleted / stats.hoursRequired * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-amber-800">RTI Training</span>
                      <span className="text-sm font-semibold text-amber-900">{Math.round(stats.rtiHours / stats.rtiRequired * 100)}%</span>
                    </div>
                    <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.rtiHours / stats.rtiRequired * 100}%` }} />
                    </div>
                    <p className="text-xs text-amber-700 pt-2">
                      <strong>Required:</strong> 2,000 OJL + 144 RTI hours/year
                    </p>
                  </div>
                </div>

                {/* Motivational Message */}
                <div className="bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                  <Sparkles className="w-6 h-6 mb-3 opacity-80" />
                  <p className="text-lg font-medium mb-1">Keep Going!</p>
                  <p className="text-sm text-white/80">
                    You're {Math.round(stats.hoursCompleted / stats.hoursRequired * 100)}% toward your goal. 
                    Every hour counts toward your future as a licensed barber.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white w-14 h-14 rounded-full shadow-lg shadow-brand-blue-500/30 flex items-center justify-center transition-all hover:scale-110">
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
