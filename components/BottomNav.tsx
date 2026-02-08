"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Users, Award, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: BookOpen, label: 'Courses', href: '/lms/courses' },
    { icon: Users, label: 'Groups', href: '/study-groups' },
    { icon: Award, label: 'Awards', href: '/achievements' },
    { icon: User, label: 'Profile', href: '/profile' },
  ];

  return (
    <nav role="navigation" aria-label="Main navigation" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 transition ${
                isActive
                  ? 'text-brand-blue-600'
                  : 'text-gray-600 hover:text-brand-blue-600'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
