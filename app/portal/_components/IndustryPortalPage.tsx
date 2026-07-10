'use client';

import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  BookOpen,
  Award,
  Clock,
  FileText,
  TrendingUp,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

export interface PortalProgram {
  title: string;
  slug: string;
  credential: string;
  progress: number;
  status: 'active' | 'completed' | 'not_started';
}

export interface DashboardStats {
  totalLessons: number;
  completedLessons: number;
  certificatesEarned: number;
  hoursLogged: number;
}

export interface IndustryPortalProps {
  portalKey: string;
  industryLabel: string;
  industryIcon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  userName: string;
  enrolledPrograms: PortalProgram[];
  availablePrograms: PortalProgram[];
  quickLinks: { name: string; href: string; icon: React.ElementType; description: string }[];
  stats?: DashboardStats;
}

export default function IndustryPortalPage({
  portalKey,
  industryLabel,
  industryIcon,
  accentColor,
  accentBg,
  userName,
  enrolledPrograms,
  availablePrograms,
  quickLinks,
  stats,
}: IndustryPortalProps) {
  const activePrograms = enrolledPrograms.filter((p) => p.status === 'active');
  const completedPrograms = enrolledPrograms.filter((p) => p.status === 'completed');
  const overallProgress = activePrograms.length > 0
    ? Math.round(activePrograms.reduce((sum, p) => sum + p.progress, 0) / activePrograms.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${accentBg} rounded-xl flex items-center justify-center`}>
              {industryIcon}
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
                {industryLabel} Portal
              </p>
              <h1 className="text-lg font-bold leading-tight">{`${PLATFORM_DEFAULTS.orgName}}`}</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">Signed in as</p>
            <p className="text-sm font-medium">{userName}</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4 py-3 grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold">{overallProgress}%</p>
              <p className="text-xs text-slate-400">Overall Progress</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{stats?.completedLessons ?? 0}/{stats?.totalLessons ?? 0}</p>
              <p className="text-xs text-slate-400">Lessons</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{stats?.certificatesEarned ?? 0}</p>
              <p className="text-xs text-slate-400">Certificates</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{stats?.hoursLogged ?? 0}</p>
              <p className="text-xs text-slate-400">Hours Logged</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Active enrollments */}
        {activePrograms.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Active Programs</h2>
            <div className="space-y-4">
              {activePrograms.map((program) => (
                <Link
                  key={program.slug}
                  href={`/lms/courses/${program.slug}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${accentBg} rounded-lg flex items-center justify-center`}>
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{program.title}</p>
                      <p className="text-xs text-slate-500">{program.credential}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{program.progress}%</p>
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${accentBg} rounded-full`}
                          style={{ width: `${program.progress}%` }}
                        />
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No enrollments state */}
        {activePrograms.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className={`w-14 h-14 ${accentBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <GraduationCap aria-label="graduationcap" className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Welcome to {industryLabel}
            </h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              You're enrolled in the {industryLabel} portal. Browse available programs below
              or continue your coursework.
            </p>
            <Link
              href="/lms/programs"
              className={`inline-flex items-center gap-2 ${accentBg} text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition text-sm`}
            >
              <BookOpen className="w-4 h-4" /> Browse Programs
            </Link>
          </div>
        )}

        {/* Completed programs */}
        {completedPrograms.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Completed
            </h3>
            <div className="space-y-3">
              {completedPrograms.map((program) => (
                <div key={program.slug} className="flex items-center justify-between p-3 rounded-lg bg-brand-green-50 border border-brand-green-100">
                  <div className="flex items-center gap-3">
                    <Award aria-label="award" className="w-5 h-5 text-brand-green-600" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{program.title}</p>
                      <p className="text-xs text-brand-green-700">{program.credential}</p>
                    </div>
                  </div>
                  <Link
                    href={`/lms/certificates`}
                    className="text-xs font-medium text-brand-green-700 hover:underline"
                  >
                    View Certificate →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Quick Access
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-slate-200 transition group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition shrink-0">
                    <link.icon className={`w-4 h-4 ${accentColor}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{link.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{link.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Available programs */}
        {availablePrograms.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Available {industryLabel} Programs
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {availablePrograms.map((program) => (
                <Link
                  key={program.slug}
                  href={`/programs/${program.slug}`}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition group"
                >
                  <p className="font-semibold text-slate-900 text-sm group-hover:text-slate-700">
                    {program.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{program.credential}</p>
                  <p className={`text-xs font-medium ${accentColor} mt-2`}>Learn more →</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 pb-6 flex flex-wrap gap-4 text-sm text-slate-400">
          <Link href="/learner/dashboard" className="hover:text-slate-600 transition">
            ← Student Dashboard
          </Link>
          <Link href="/lms/programs" className="hover:text-slate-600 transition">
            All Programs
          </Link>
          <Link href="/help" className="hover:text-slate-600 transition">
            Help Center
          </Link>
        </div>
      </main>
    </div>
  );
}
