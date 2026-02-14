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
  { href: '/apprentice/hours', label: 'Log Hours', icon: Clock },
  { href: '/lms/chat', label: 'AI Tutor Chat', icon: MessageCircle },
  { href: '/lms/assignments', label: 'Assignments', icon: FileText },
  { href: '/lms/certificates', label: 'Certificates', icon: Award },
  { href: '/lms/calendar', label: 'Calendar', icon: Calendar },
  { href: '/lms/forums', label: 'Forums', icon: MessageSquare },
  { href: '/lms/resources', label: 'Resources', icon: FileText },
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
