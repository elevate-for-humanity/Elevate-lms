import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, Users, BookOpen, Star, TrendingUp } from 'lucide-react';
import InstructorPerformanceClient from './InstructorPerformanceClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Instructor Performance | Admin | Elevate For Humanity' };

export default async function InstructorPerformancePage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  // Load instructors with their profiles and assignment counts
  const [{ data: instructors }, { count: totalInstructors }, { count: activeAssignments }] =
    await Promise.all([
      db
        .from('instructor_profiles')
        .select(`
          id, bio, specializations, certifications, hourly_rate, active, created_at,
          profiles:user_id(id, full_name, email, avatar_url)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(50),
      db.from('instructor_profiles').select('*', { count: 'exact', head: true }).eq('active', true),
      db.from('instructor_assignments').select('*', { count: 'exact', head: true }).eq('active', true),
    ]);

  // Load assignment counts per instructor
  const { data: assignmentCounts } = await db
    .from('instructor_assignments')
    .select('instructor_id')
    .eq('active', true);

  const countMap: Record<string, number> = {};
  (assignmentCounts ?? []).forEach((a: any) => {
    countMap[a.instructor_id] = (countMap[a.instructor_id] ?? 0) + 1;
  });

  const stats = [
    { label: 'Active Instructors', value: totalInstructors ?? 0, icon: Users, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
    { label: 'Active Assignments', value: activeAssignments ?? 0, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Avg Assignments', value: totalInstructors ? Math.round((activeAssignments ?? 0) / totalInstructors) : 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/staff" className="hover:text-slate-700">Staff</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Instructor Performance</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Instructor Performance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Active instructors, course assignments, and program-level completion rates
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Course completion rates from API */}
      <InstructorPerformanceClient />

      {/* Instructor roster */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Active Instructors</h2>
        </div>
        {!instructors?.length ? (
          <p className="text-sm text-slate-400 text-center py-10">No active instructors</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Instructor', 'Specializations', 'Assignments', 'Rate'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {instructors.map((inst: any) => (
                <tr key={inst.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">{inst.profiles?.full_name ?? '—'}</p>
                    <p className="text-xs text-slate-400">{inst.profiles?.email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(inst.specializations ?? []).slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {(inst.specializations ?? []).length === 0 && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700 tabular-nums">
                    {countMap[inst.profiles?.id] ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {inst.hourly_rate ? `$${inst.hourly_rate}/hr` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
