'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, CreditCard, Award, Trophy } from 'lucide-react';

const navItems = [
  { href: '/student/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/student/hours', icon: Clock, label: 'Hours' },
  { href: '/student/billing', icon: CreditCard, label: 'Billing' },
  { href: '/student/badges', icon: Award, label: 'Badges' },
  { href: '/student/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

export default function StudentNav() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
              isActive 
                ? 'text-blue-600 bg-blue-50 font-medium' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
