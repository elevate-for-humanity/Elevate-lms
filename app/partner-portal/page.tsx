import Image from 'next/image';
import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Users, Clock, FileText, ClipboardList, Settings,
  ArrowRight, AlertCircle, CheckCircle, BarChart3,
  Scissors, Calendar, Upload, DollarSign,
} from 'lucide-react';
import { MOUStatusBadge, MOUStatusAlert } from '@/components/MOUStatusBadge';
import { requirePartnerIdentity } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Dashboard | Partner Portal',
  description: 'Manage your partnership with Elevate for Humanity.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PartnerPortalPage() {
  // Identity guard: verifies auth → profiles → partner_users → partners
  // Redirects to /partner/login?error=... if any link is broken
  const { user, org, partnerId } = await requirePartnerIdentity();

  const db = createAdminClient();

  let mouStatus = 'not_sent';
  const stats = {
    activeApprentices: 0,
    pendingHours: 0,
    pendingDocuments: 0,
    totalCompletions: 0,
    attendanceThisWeek: 0,
  };
  let recentActivity: any[] = [];

  try {
    if (db) {
      const orgId = partnerId;

      if (orgId) {
        // Active apprentices
        const { count: apprenticeCount } = await db
          .from('partner_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', orgId)
          .eq('status', 'active');
        stats.activeApprentices = apprenticeCount || 0;

        // Pending hours (by user_id of students in this org's enrollments)
        const { data: enrolledStudents } = await db
          .from('partner_enrollments')
          .select('student_id')
          .eq('partner_id', orgId);
        const studentIds = (enrolledStudents || []).map((e: any) => e.student_id);
        if (studentIds.length > 0) {
          const { count: pendingHoursCount } = await db
            .from('hour_entries')
            .select('*', { count: 'exact', head: true })
            .in('user_id', studentIds)
            .eq('status', 'pending');
          stats.pendingHours = pendingHoursCount || 0;
        }

        // Pending documents
        const { count: pendingDocsCount } = await db
          .from('partner_documents')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('status', 'pending');
        stats.pendingDocuments = pendingDocsCount || 0;

        // Completions
        const { count: completionCount } = await db
          .from('partner_completions')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', user.id);
        stats.totalCompletions = completionCount || 0;

        // Attendance this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (studentIds.length > 0) {
          const { count: attendanceCount } = await db
            .from('partner_attendance')
            .select('*', { count: 'exact', head: true })
            .in('student_id', studentIds);
          stats.attendanceThisWeek = attendanceCount || 0;
        }

        // Recent audit log
        const { data: auditData } = await db
          .from('partner_audit_log')
          .select('id, action, entity_type, created_at')
          .eq('partner_id', orgId)
          .order('created_at', { ascending: false })
          .limit(5);
        recentActivity = auditData || [];

        // MOU status
        const { data: mou } = await db
          .from('partner_mous')
          .select('status')
          .eq('partner_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (mou && mou.length > 0) {
          mouStatus = mou[0].status === 'signed' ? 'fully_executed' : mou[0].status;
        }
      }
    }
  } catch {
    // Tables may not exist yet
  }

  return (
    <div>

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/partner-portal-page-1.jpg" alt="Partner portal" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {org.name} &middot; {org.city || 'Indianapolis'}, {org.state || 'IN'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MOUStatusBadge status={mouStatus} />
          <Link href="/partner/reports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition text-sm font-medium">
            <BarChart3 className="w-4 h-4" /> Reports
          </Link>
        </div>
      </div>

      {/* MOU Alert */}
      {mouStatus !== 'fully_executed' && (
        <div className="mb-6">
          <MOUStatusAlert status={mouStatus} />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Active Apprentices', value: stats.activeApprentices, icon: Users, color: 'text-brand-blue-600 bg-brand-blue-50' },
          { label: 'Pending Hours', value: stats.pendingHours, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Pending Documents', value: stats.pendingDocuments, icon: FileText, color: 'text-pink-600 bg-pink-50' },
          { label: 'Completions', value: stats.totalCompletions, icon: CheckCircle, color: 'text-brand-green-600 bg-brand-green-50' },
          { label: 'Attendance', value: stats.attendanceThisWeek, icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { title: 'Log Hours', href: '/partner/hours', icon: Clock, description: 'Submit apprentice training hours', color: 'border-l-brand-blue-500' },
          { title: 'Record Attendance', href: '/partner/attendance/record', icon: ClipboardList, description: 'Mark daily attendance', color: 'border-l-brand-green-500' },
          { title: 'Upload Documents', href: '/partner/documents', icon: Upload, description: 'Submit required documents', color: 'border-l-amber-500' },
          { title: 'View Apprentices', href: '/partner/programs/barber', icon: Scissors, description: 'Manage current apprentices', color: 'border-l-pink-500' },
          { title: 'MOU Agreement', href: '/docs/Indiana-Barbershop-Apprenticeship-MOU', icon: FileText, description: 'View or download your Memorandum of Understanding', color: 'border-l-gray-500' },
          { title: 'Payroll & Payouts', href: '/onboarding/payroll-setup', icon: DollarSign, description: 'Set up pay method, W-9, and view earnings', color: 'border-l-brand-green-500' },
          { title: 'Settings', href: '/partner/settings', icon: Settings, description: 'Manage shop profile and contacts', color: 'border-l-slate-400' },
        ].map((action) => (
          <Link key={action.title} href={action.href}
            className={`bg-white rounded-xl border border-l-4 ${action.color} p-5 hover:shadow-md transition`}>
            <action.icon className="w-6 h-6 text-gray-700 mb-3" />
            <h3 className="font-bold mb-1">{action.title}</h3>
            <p className="text-gray-500 text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((item: any) => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium capitalize">{item.action.replace(/_/g, ' ')}</p>
                  <p className="text-gray-500 text-xs">{item.entity_type}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm mb-3">No activity yet.</p>
            <Link href="/partner/onboarding" className="text-brand-blue-600 text-sm font-medium hover:underline inline-flex items-center gap-1">
              Start onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
