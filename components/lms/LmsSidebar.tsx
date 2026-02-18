'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Users,
  TrendingUp,
  MessageCircle,
  FileText,
  Award,
  Calendar,
  Settings,
  Clock,
  ExternalLink,
} from 'lucide-react';

const navItems = [
  { href: '/lms/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lms/progress', label: 'My Progress', icon: TrendingUp },
  { href: '/lms/courses', label: 'My Courses', icon: BookOpen },
  { href: '/lms/assignments', label: 'Assignments', icon: FileText },
  { href: '/lms/quizzes', label: 'Quizzes', icon: FileText },
  { href: '/lms/grades', label: 'Grades', icon: Award },
  { href: '/lms/certificates', label: 'Certificates', icon: Award },
  { href: '/lms/certification', label: 'Certification', icon: Award },
  { href: '/lms/schedule', label: 'Schedule', icon: Calendar },
  { href: '/lms/calendar', label: 'Calendar', icon: Calendar },
  { href: '/lms/attendance', label: 'Attendance', icon: Clock },
  { href: '/apprentice/hours', label: 'Log Hours', icon: Clock },
];

const learnItems = [
  { href: '/lms/chat', label: 'AI Tutor Chat', icon: MessageCircle },
  { href: '/lms/ai-tutor', label: 'AI Tutor', icon: MessageCircle },
  { href: '/lms/adaptive', label: 'Adaptive Learning', icon: TrendingUp },
  { href: '/lms/learning-paths', label: 'Learning Paths', icon: BookOpen },
  { href: '/lms/library', label: 'Library', icon: BookOpen },
  { href: '/lms/scorm', label: 'SCORM Modules', icon: BookOpen },
  { href: '/lms/video', label: 'Video Lessons', icon: BookOpen },
  { href: '/lms/builder', label: 'Course Builder', icon: FileText },
  { href: '/lms/courses/new', label: 'New Course', icon: BookOpen },
  { href: '/lms/courses/healthcare-fundamentals', label: 'Healthcare Fundamentals', icon: BookOpen },
  { href: '/lms/peer-review', label: 'Peer Review', icon: Users },
  { href: '/lms/study-groups', label: 'Study Groups', icon: Users },
];

const communityItems = [
  { href: '/lms/forums', label: 'Forums', icon: MessageSquare },
  { href: '/lms/community', label: 'Community', icon: Users },
  { href: '/lms/social', label: 'Social Feed', icon: Users },
  { href: '/lms/social/connections', label: 'Connections', icon: Users },
  { href: '/lms/social/groups', label: 'Groups', icon: Users },
  { href: '/lms/social/groups/career', label: 'Career Group', icon: Users },
  { href: '/lms/social/groups/healthcare', label: 'Healthcare Group', icon: Users },
  { href: '/lms/social/groups/trades', label: 'Trades Group', icon: Users },
  { href: '/lms/social/trending', label: 'Trending', icon: TrendingUp },
  { href: '/lms/messages', label: 'Messages', icon: MessageSquare },
  { href: '/lms/leaderboard', label: 'Leaderboard', icon: Award },
  { href: '/lms/groups', label: 'My Groups', icon: Users },
];

const toolsItems = [
  { href: '/lms/resources', label: 'Resources', icon: FileText },
  { href: '/lms/files', label: 'Files', icon: FileText },
  { href: '/lms/collaborate', label: 'Collaborate', icon: Users },
  { href: '/lms/collaborate/documents', label: 'Shared Docs', icon: FileText },
  { href: '/lms/collaborate/meetings', label: 'Meetings', icon: Calendar },
  { href: '/lms/notifications', label: 'Notifications', icon: MessageCircle },
  { href: '/lms/portfolio', label: 'Portfolio', icon: FileText },
  { href: '/lms/integrations', label: 'Integrations', icon: ExternalLink },
  { href: '/lms/settings/profile', label: 'Edit Profile', icon: Users },
  { href: '/lms/payments/checkout', label: 'Payments', icon: ExternalLink },
];

const careerItems = [
  { href: '/lms/achievements', label: 'Achievements', icon: Award },
  { href: '/lms/badges', label: 'Badges', icon: Award },
  { href: '/lms/placement', label: 'Job Placement', icon: ExternalLink },
  { href: '/lms/alumni', label: 'Alumni Network', icon: Users },
  { href: '/lms/analytics', label: 'My Analytics', icon: TrendingUp },
  { href: '/lms/apply', label: 'Apply', icon: FileText },
  { href: '/lms/apply/status', label: 'Application Status', icon: FileText },
  { href: '/lms/enroll', label: 'Enroll', icon: BookOpen },
  { href: '/lms/orientation', label: 'Orientation', icon: BookOpen },
  { href: '/lms/profile', label: 'Profile', icon: Users },
  { href: '/lms/settings', label: 'Settings', icon: Settings },
  { href: '/lms/help', label: 'Help', icon: ExternalLink },
];

const externalLinks = [
  { 
    href: 'https://www.miladytraining.com', 
    label: 'Milady Theory', 
    icon: ExternalLink,
    description: 'Access your RTI coursework'
  },
];

export function LmsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white/80 backdrop-blur-sm h-screen sticky top-0">
      <div className="p-4 border-b">
        <Link
          href="/lms/dashboard"
          aria-label="Link"
          className="flex items-center gap-2"
        >
          <div className="h-9 w-9 rounded-xl    flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          <div>
            <div className="font-semibold text-sm text-black">
              Elevate For Humanity
            </div>
            <div className="text-xs text-slate-500">Workforce LMS</div>
          </div>
        </Link>
      </div>

      <nav
        role="navigation"
        aria-label="Main navigation"
        className="p-2 space-y-1 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
      >
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-brand-blue-600 text-white shadow-sm'
                  : 'text-black hover:bg-gray-50 hover:text-brand-blue-700'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Learning Section */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Learning</div>
          {learnItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all', active ? 'bg-brand-blue-600 text-white shadow-sm' : 'text-black hover:bg-gray-50 hover:text-brand-blue-700')}>
                <Icon className="w-4 h-4" /><span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Community Section */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Community</div>
          {communityItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all', active ? 'bg-brand-blue-600 text-white shadow-sm' : 'text-black hover:bg-gray-50 hover:text-brand-blue-700')}>
                <Icon className="w-4 h-4" /><span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Tools Section */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Tools</div>
          {toolsItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all', active ? 'bg-brand-blue-600 text-white shadow-sm' : 'text-black hover:bg-gray-50 hover:text-brand-blue-700')}>
                <Icon className="w-4 h-4" /><span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Career Section */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Career</div>
          {careerItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={clsx('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all', active ? 'bg-brand-blue-600 text-white shadow-sm' : 'text-black hover:bg-gray-50 hover:text-brand-blue-700')}>
                <Icon className="w-4 h-4" /><span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* External Links Section */}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
            External Resources
          </div>
          {externalLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-black hover:bg-gray-50 hover:text-brand-blue-700 transition-all"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
        <Link
          href="/lms/support"
          className="flex items-center gap-2 text-sm text-black hover:text-black"
        >
          <Settings className="w-4 h-4" />
          <span>Settings & Support</span>
        </Link>
      </div>
    </aside>
  );
}
