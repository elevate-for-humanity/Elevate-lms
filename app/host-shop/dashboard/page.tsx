import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MessageSquare,
  FileText,
  Award,
  CreditCard,
  Settings,
  Bell,
  ChevronRight,
  User,
  MapPin,
  Star,
  BarChart3,
  DollarSign,
  Shield,
  Video,
  Search,
  BellDot,
  CheckSquare,
  XCircle,
  ArrowRight,
  Briefcase,
  UsersRound,
  ClipboardCheck,
  HelpCircle,
  Activity,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Host Shop Dashboard | Elevate for Humanity',
  description: 'Manage your apprentices, track hours, and review competencies.',
};

export const dynamic = 'force-dynamic';

// Navigation items
const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/host-shop/dashboard', icon: Building2, active: true },
  { id: 'apprentices', label: 'Apprentices', href: '/host-shop/dashboard/apprentices', icon: Users },
  { id: 'hours', label: 'Hours & Attendance', href: '/host-shop/dashboard/hours', icon: Clock },
  { id: 'competencies', label: 'Sign-Offs', href: '/host-shop/dashboard/competencies', icon: CheckCircle },
  { id: 'schedule', label: 'Schedule', href: '/host-shop/dashboard/schedule', icon: Calendar },
  { id: 'reports', label: 'Reports', href: '/host-shop/dashboard/reports', icon: BarChart3 },
];

const secondaryNavItems = [
  { id: 'messages', label: 'Messages', href: '/host-shop/dashboard/messages', icon: MessageSquare },
  { id: 'documents', label: 'Documents', href: '/host-shop/dashboard/documents', icon: FileText },
  { id: 'evaluations', label: 'Evaluations', href: '/host-shop/dashboard/evaluations', icon: ClipboardCheck },
  { id: 'billing', label: 'Billing', href: '/host-shop/dashboard/billing', icon: DollarSign },
  { id: 'profile', label: 'Shop Profile', href: '/host-shop/dashboard/profile', icon: Settings },
];

// Stat card component
function StatCard({ icon: Icon, label, value, trend, trendValue, color, href }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:border-brand-blue-200 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-7 h-7" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          }`}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Apprentice card component
function ApprenticeCard({ name, program, progress, hours, lastClockIn, status, avatar }: {
  name: string;
  program: string;
  progress: number;
  hours: number;
  lastClockIn: string;
  status: 'on-track' | 'needs-attention' | 'ahead';
  avatar?: string;
}) {
  const statusColors = {
    'on-track': { bg: 'bg-green-100', text: 'text-green-700', label: 'On Track' },
    'needs-attention': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Needs Attention' },
    'ahead': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Ahead' },
  };
  const statusStyle = statusColors[status];

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full rounded-xl object-cover" />
          ) : (
            <User className="w-6 h-6 text-brand-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-slate-900 truncate">{name}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-3">{program}</p>
          
          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Progress</span>
              <span className="font-medium text-slate-700">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {hours} hrs
            </span>
            <span>Last: {lastClockIn}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Action card component
function ActionCard({ icon: Icon, title, description, href, color, badge }: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:border-brand-blue-200 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
          {badge && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

// Competency item component
function CompetencyItem({ name, category, student, status, dueDate }: {
  name: string;
  category: string;
  student: string;
  status: 'pending' | 'approved' | 'needs-review';
  dueDate: string;
}) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    'needs-review': { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  };
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm">{name}</p>
        <p className="text-xs text-slate-500">{student} • {category}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500">Due: {dueDate}</p>
      </div>
      <Link href="/host-shop/dashboard/competencies" className="p-2 hover:bg-white rounded-lg transition">
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </Link>
    </div>
  );
}

export default async function HostShopDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/host-shop/dashboard');
  }

  // Demo data for the visual dashboard
  const shopInfo = {
    name: 'Elevate Barbershop',
    logo: null,
    address: '123 Main St, Indianapolis, IN 46201',
    activeApprentices: 5,
    complianceStatus: 'good',
    nextEvaluation: 'Dec 15, 2024',
  };

  // Real database stats for the host shop
  const { data: apprenticeCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('host_shop_id', user.id);

  const { data: pendingHours } = await supabase
    .from('hour_entries')
    .select('id', { count: 'exact' })
    .eq('status', 'pending');

  const stats = {
    activeApprentices: apprenticeCount?.length || 0,
    pendingHours: pendingHours?.length || 0,
    competencySignoffs: 8,
    graduatedThisYear: 2,
    totalHoursThisMonth: 340,
    attendanceRate: 94,
  };

  const apprentices = [
    { name: 'Marcus Johnson', program: 'Barber Apprenticeship', progress: 68, hours: 1350, lastClockIn: '2 days ago', status: 'on-track' as const },
    { name: 'DeShawn Williams', program: 'Barber Apprenticeship', progress: 45, hours: 890, lastClockIn: 'Today', status: 'ahead' as const },
    { name: 'Terrence Brown', program: 'Barber Apprenticeship', progress: 32, hours: 640, lastClockIn: '1 week ago', status: 'needs-attention' as const },
    { name: 'Jaylen Davis', program: 'Cosmetology', progress: 78, hours: 1560, lastClockIn: '3 days ago', status: 'on-track' as const },
  ];

  const pendingCompetencies = [
    { name: 'Fade Haircut', category: 'Haircutting', student: 'Marcus J.', status: 'pending' as const, dueDate: 'Nov 30' },
    { name: 'Beard Design', category: 'Grooming', student: 'DeShawn W.', status: 'needs-review' as const, dueDate: 'Dec 5' },
    { name: 'Sanitation Protocol', category: 'Safety', student: 'Terrence B.', status: 'approved' as const, dueDate: 'Completed' },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Review 3 pending hour logs', type: 'hours', urgent: true },
    { id: 2, title: 'Sign off on 2 competencies', type: 'competency', urgent: false },
    { id: 3, title: 'Monthly evaluation - Marcus J.', type: 'evaluation', urgent: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Host Shop</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Search apprentices, hours, tasks..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-brand-blue-500 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-xl hover:bg-slate-100 transition">
                <BellDot className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Link href="/host-shop/dashboard/profile" className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition">
                <div className="w-8 h-8 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-brand-blue-600" />
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
                {mainNavItems.map((item) => (
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
                <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Management</p>
                {secondaryNavItems.map((item) => (
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
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold">{shopInfo.name}</h1>
                        <p className="text-white/80 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {shopInfo.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Good Standing
                      </span>
                      <span className="text-sm text-white/80">
                        <strong>{shopInfo.activeApprentices}</strong> Active Apprentices
                      </span>
                      <span className="text-sm text-white/80">
                        Next Evaluation: <strong>{shopInfo.nextEvaluation}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/host-shop/dashboard/apprentices" className="bg-white text-brand-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition shadow-lg flex items-center justify-center gap-2">
                      <Users className="w-5 h-5" />
                      Manage Apprentices
                    </Link>
                    <Link href="/host-shop/dashboard/hours" className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5" />
                      Review Hours
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <StatCard icon={Users} label="Active Apprentices" value={stats.activeApprentices} trend="up" trendValue="+1" color="bg-blue-100 text-blue-600" href="/host-shop/dashboard/apprentices" />
              <StatCard icon={Clock} label="Pending Hours" value={stats.pendingHours} color="bg-amber-100 text-amber-600" href="/host-shop/dashboard/hours" />
              <StatCard icon={CheckCircle} label="Sign-offs Pending" value={stats.competencySignoffs} color="bg-green-100 text-green-600" href="/host-shop/dashboard/competencies" />
              <StatCard icon={Award} label="Graduated" value={stats.graduatedThisYear} color="bg-purple-100 text-purple-600" />
              <StatCard icon={Activity} label="Hours This Month" value={stats.totalHoursThisMonth} color="bg-cyan-100 text-cyan-600" />
              <StatCard icon={TrendingUp} label="Attendance" value={`${stats.attendanceRate}%`} trend="up" trendValue="+2%" color="bg-indigo-100 text-indigo-600" />
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ActionCard icon={Clock} title="Review Hours" description="Approve pending hours" href="/host-shop/dashboard/hours" color="bg-amber-100 text-amber-600" badge="12" />
                    <ActionCard icon={CheckCircle} title="Sign Off" description="Verify competencies" href="/host-shop/dashboard/competencies" color="bg-green-100 text-green-600" badge="8" />
                    <ActionCard icon={Users} title="Add Apprentice" description="New enrollment" href="/host-shop/dashboard/apprentices/new" color="bg-blue-100 text-blue-600" />
                    <ActionCard icon={Calendar} title="Schedule" description="Set evaluations" href="/host-shop/dashboard/schedule" color="bg-purple-100 text-purple-600" />
                  </div>
                </div>

                {/* Your Apprentices */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Your Apprentices</h2>
                    <Link href="/host-shop/dashboard/apprentices" className="text-sm text-brand-blue-600 font-medium hover:underline flex items-center gap-1">
                      View All <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {apprentices.slice(0, 4).map((apprentice, idx) => (
                      <ApprenticeCard key={idx} {...apprentice} />
                    ))}
                  </div>
                </div>

                {/* Reports Section */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Reports & Analytics</h2>
                    <Link href="/host-shop/dashboard/reports" className="text-sm text-brand-blue-600 font-medium hover:underline flex items-center gap-1">
                      View All <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <BarChart3 className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 mb-1">Total Hours</p>
                      <p className="text-lg font-bold text-slate-900">4,440</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 mb-1">Avg Progress</p>
                      <p className="text-lg font-bold text-slate-900">56%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 mb-1">Competencies</p>
                      <p className="text-lg font-bold text-slate-900">127</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <Star className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 mb-1">Grad Rate</p>
                      <p className="text-lg font-bold text-slate-900">85%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Urgent Tasks */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Action Required</h2>
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                      {upcomingTasks.filter(t => t.urgent).length} Urgent
                    </span>
                  </div>
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl ${
                        task.urgent ? 'bg-red-50 border border-red-200' : 'bg-slate-50'
                      }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          task.urgent ? 'bg-red-100' : 'bg-slate-200'
                        }`}>
                          {task.type === 'hours' && <Clock className={`w-4 h-4 ${task.urgent ? 'text-red-600' : 'text-slate-600'}`} />}
                          {task.type === 'competency' && <CheckCircle className={`w-4 h-4 ${task.urgent ? 'text-red-600' : 'text-slate-600'}`} />}
                          {task.type === 'evaluation' && <ClipboardCheck className={`w-4 h-4 ${task.urgent ? 'text-red-600' : 'text-slate-600'}`} />}
                        </div>
                        <p className={`text-sm font-medium flex-1 ${task.urgent ? 'text-red-900' : 'text-slate-700'}`}>
                          {task.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Competencies */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Competency Sign-offs</h2>
                    <Link href="/host-shop/dashboard/competencies" className="text-sm text-brand-blue-600 font-medium hover:underline">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {pendingCompetencies.map((comp, idx) => (
                      <CompetencyItem key={idx} {...comp} />
                    ))}
                  </div>
                </div>

                {/* Compliance Status */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-bold text-green-900">Compliance Status</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-800">Overall Status</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Good Standing</span>
                    </div>
                    <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }} />
                    </div>
                    <p className="text-xs text-green-700">Next audit: February 2025</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Recent Messages</h2>
                    <Link href="/host-shop/dashboard/messages" className="text-sm text-brand-blue-600 font-medium hover:underline">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">Marcus Johnson</p>
                        <p className="text-xs text-slate-500 truncate">Submitted hours for review...</p>
                      </div>
                      <span className="text-xs text-slate-400">2h</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">System</p>
                        <p className="text-xs text-slate-500 truncate">Weekly report ready</p>
                      </div>
                      <span className="text-xs text-slate-400">1d</span>
                    </div>
                  </div>
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
