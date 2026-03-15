import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireProgramAccess } from '@/lib/auth/require-program-holder';
import {
  LayoutDashboard, Users, GraduationCap, FileText, BarChart3,
  Clock, AlertTriangle, ArrowLeft,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProgramScopedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const { db } = await requireProgramAccess(programId);

  // Fetch program details (access already validated by requireProgramAccess)
  const { data: program } = await db
    .from('programs')
    .select('id, name, title, is_active')
    .eq('id', programId)
    .single();

  if (!program) {
    redirect('/program-holder/programs?error=not-found');
  }

  const programName = program.name || program.title || 'Program';
  const base = `/program-holder/programs/${programId}`;

  const navItems = [
    { href: base, label: 'Overview', icon: LayoutDashboard },
    { href: `${base}/students`, label: 'Students', icon: Users },
    { href: `${base}/students/pending`, label: 'Pending', icon: Clock },
    { href: `${base}/students/at-risk`, label: 'At-Risk', icon: AlertTriangle },
    { href: `${base}/grades`, label: 'Grades', icon: GraduationCap },
    { href: `${base}/reports`, label: 'Reports', icon: FileText },
    { href: `${base}/analytics`, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div>
      {/* Program context bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/program-holder/programs"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Program:</span>
              <span className="font-semibold text-gray-900">{programName}</span>
              {program.is_active ? (
                <span className="text-xs bg-brand-green-100 text-brand-green-800 px-2 py-0.5 rounded">Active</span>
              ) : (
                <span className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded">Inactive</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Program-scoped nav */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 py-1" aria-label="Program navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-blue-600 hover:bg-white rounded-md transition whitespace-nowrap"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {children}
    </div>
  );
}
