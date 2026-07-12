'use client';

import Link from 'next/link';
import { GraduationCap, ClipboardCheck, DollarSign, BookOpen, Calendar, MessageCircle } from 'lucide-react';

const STUDENT_NAV_ITEMS = [
  {
    icon: GraduationCap,
    label: 'Find Programs',
    href: '/programs',
    desc: 'Explore training programs',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: ClipboardCheck,
    label: 'Apply Now',
    href: '/apply',
    desc: 'Start your application',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: DollarSign,
    label: 'Check Funding',
    href: '/eligibility',
    desc: 'WIOA, grants & scholarships',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: BookOpen,
    label: 'Student Portal',
    href: '/lms/dashboard',
    desc: 'Access your courses',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Calendar,
    label: 'Book Testing',
    href: '/testing/book',
    desc: 'Schedule certification exams',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: MessageCircle,
    label: 'Get Help',
    href: '/contact',
    desc: 'Talk to an advisor',
    color: 'bg-teal-50 text-teal-600',
  },
];

export function StudentQuickNav() {
  return (
    <section className="py-12 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Looking for Training?
          </h2>
          <p className="text-slate-600">
            Navigate to the right place for your workforce development journey
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STUDENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-center"
              >
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">
                  {item.label}
                </h3>
                <p className="text-xs text-slate-500">
                  {item.desc}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Are you an organization looking to license our platform?{' '}
            <Link href="/store" className="text-brand-red-600 hover:underline font-medium">
              View platform plans →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default StudentQuickNav;
