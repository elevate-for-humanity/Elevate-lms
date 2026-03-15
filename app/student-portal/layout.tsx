import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'Student Portal | Elevate for Humanity',
    template: '%s | Student Portal',
  },
  description: 'Access your courses, assignments, and academic resources.',
  robots: { index: false, follow: false },
};

const navItems = [
  { href: '/student-portal', label: 'Dashboard' },
  { href: '/lms/courses', label: 'Courses' },
  { href: '/student-portal/assignments', label: 'Assignments' },
  { href: '/student-portal/grades', label: 'Grades' },
  { href: '/student-portal/schedule', label: 'Schedule' },
  { href: '/student-portal/announcements', label: 'Announcements' },
  { href: '/student-portal/resources', label: 'Resources' },
  { href: '/student-portal/handbook/acknowledge', label: 'Handbook' },
  { href: '/student-portal/onboarding/documents', label: 'Documents' },
  { href: '/student-portal/onboarding/agreements', label: 'Agreements' },
];

export default function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/student-portal" className="text-lg font-bold text-brand-blue-700">Student Portal</Link>
              <div className="hidden md:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="text-sm text-gray-600 hover:text-brand-blue-700">{item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
