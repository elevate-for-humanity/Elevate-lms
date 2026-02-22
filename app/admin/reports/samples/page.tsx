import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, Users, Award, DollarSign, ArrowLeft, Download, BarChart3, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sample Reports | Admin',
  description: 'Generate sample reports from live platform data.',
  robots: { index: false, follow: false },
};

export default async function SampleReportsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) {
    return <div className="p-8 text-center text-gray-600">Database unavailable.</div>;
  }

  const [students, enrollments, certificates, completions, programs, courses] = await Promise.all([
    db.from('profiles').select('id, full_name, email, role, enrollment_status, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(20),
    db.from('program_enrollments').select('id, status, created_at, program_id').order('created_at', { ascending: false }).limit(20),
    db.from('certificates').select('id, status, created_at').order('created_at', { ascending: false }).limit(20),
    db.from('completions').select('id, created_at').order('created_at', { ascending: false }).limit(20),
    db.from('programs').select('id, name, status', { count: 'exact' }),
    db.from('training_courses').select('id, course_name, is_active', { count: 'exact' }),
  ]);

  const reportSections = [
    {
      title: 'Student Roster',
      icon: Users,
      count: students.data?.length ?? 0,
      color: 'brand-blue',
      rows: (students.data ?? []).map((s: any) => ({
        cols: [s.full_name || s.email || 'Unknown', s.role, s.enrollment_status || 'pending', s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'],
      })),
      headers: ['Name', 'Role', 'Status', 'Registered'],
    },
    {
      title: 'Enrollment Report',
      icon: GraduationCap,
      count: enrollments.data?.length ?? 0,
      color: 'emerald',
      rows: (enrollments.data ?? []).map((e: any) => ({
        cols: [e.id.slice(0, 8), e.status || 'active', e.program_id?.slice(0, 8) || '—', e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'],
      })),
      headers: ['ID', 'Status', 'Program', 'Date'],
    },
    {
      title: 'Certificates Issued',
      icon: Award,
      count: certificates.data?.length ?? 0,
      color: 'purple',
      rows: (certificates.data ?? []).map((c: any) => ({
        cols: [c.id.slice(0, 8), c.status || 'issued', c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'],
      })),
      headers: ['ID', 'Status', 'Issued'],
    },
    {
      title: 'Program Summary',
      icon: BarChart3,
      count: programs.count ?? 0,
      color: 'amber',
      rows: (programs.data ?? []).map((p: any) => ({
        cols: [p.name || 'Unnamed', p.status || '—'],
      })),
      headers: ['Program', 'Status'],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Reports', href: '/admin/reports' },
            { label: 'Sample Reports' },
          ]} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/reporting" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Reports
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Sample Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Live data snapshots from the platform (most recent 20 records per section)</p>
          </div>
        </div>

        <div className="space-y-6">
          {reportSections.map((section) => (
            <div key={section.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <section.icon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h2 className="font-semibold text-gray-900">{section.title}</h2>
                    <p className="text-xs text-gray-500">{section.count} records</p>
                  </div>
                </div>
              </div>
              {section.rows.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-500">No data available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {section.headers.map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {section.rows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {row.cols.map((col: string, j: number) => (
                            <td key={j} className="px-6 py-3 text-sm text-gray-700">{col}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
