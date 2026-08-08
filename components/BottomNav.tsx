'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, CalendarDays, GraduationCap, Home, TrendingUp, Users } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/lms/dashboard' },
  { icon: Users, label: 'Community', href: '/lms/community' },
  { icon: GraduationCap, label: 'Learn', href: '/lms/courses' },
  { icon: CalendarDays, label: 'Events', href: '/lms/events' },
  { icon: TrendingUp, label: 'Progress', href: '/lms/progress' },
  { icon: Bot, label: 'AI Team', href: '/lms/ai-team' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav role="navigation" aria-label="Learner navigation" className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white lg:hidden">
      <div className="grid grid-cols-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={`flex min-w-0 flex-col items-center gap-1 px-1 py-2 transition ${active ? 'text-brand-blue-700' : 'text-slate-600 hover:text-brand-blue-700'}`}>
              <Icon className="h-5 w-5" />
              <span className="w-full truncate text-center text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
