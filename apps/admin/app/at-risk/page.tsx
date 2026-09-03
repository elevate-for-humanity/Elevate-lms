import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { AlertTriangle, Clock, ChevronRight, ArrowRight, Brain, BookOpen, Phone, Mail, MessageSquare, TrendingDown, Users, Zap } from 'lucide-react';
import { AssignAICounselorButton } from './AssignAICounselorButton';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Student Success | Admin',
};

const RISK_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-600',
};

// Coaching intervention types
const INTERVENTIONS = [
  { id: 'tutor', label: 'Schedule Tutoring', icon: BookOpen, href: '/appointments' },
  { id: 'call', label: 'Phone Outreach', icon: Phone, href: '/crm' },
  { id: 'email', label: 'Send Email', icon: Mail, href: '/email-marketing/campaigns/new' },
  { id: 'sms', label: 'SMS Reminder', icon: MessageSquare, href: '/operations/sms-logs' },
  { id: 'coach', label: 'AI Coaching', icon: Brain, href: '#flagged-learners' },
];

// RTI Tiers
const RTI_TIERS = [
  { tier: 1, label: 'Universal', color: 'bg-green-100 text-green-800', intervention: 'Core instruction + progress monitoring' },
  { tier: 2, label: 'Targeted', color: 'bg-amber-100 text-amber-800', intervention: 'Small group intervention + weekly check-ins' },
  { tier: 3, label: 'Intensive', color: 'bg-red-100 text-red-800', intervention: 'Individual intervention + daily support' },
];

export default async function AtRiskPage() {
  await requireRole(['admin', 'staff']);
  const adminDb = await requireAdminClient();
  if (!adminDb) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">Service unavailable — admin client could not be initialized.</p>
      </div>
    );
  }
  const db = adminDb;
  const inactive14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [flaggedRes, inactiveEnrollRes] = await Promise.all([
    db
      .from('at_risk_students')
      .select('id, user_id, risk_level, reason, created_at, resolved, notes', { count: 'exact' })
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('program_enrollments')
      .select('id, user_id, enrolled_at, enrollment_state', { count: 'exact' })
      .eq('enrollment_state', 'active')
      .lte('enrolled_at', inactive14)
      .order('enrolled_at', { ascending: true })
      .limit(50),
  ]);

  const flagged = flaggedRes.data ?? [];
  const flaggedCount = flaggedRes.count ?? 0;
  const inactiveEnrollments = inactiveEnrollRes.data ?? [];
  const inactiveCount = inactiveEnrollRes.count ?? 0;

  const flaggedUserIds = [...new Set(flagged.map((r: any) => r.user_id).filter(Boolean))];
  const { data: flaggedProfiles } = flaggedUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', flaggedUserIds)
    : { data: [] };
  const flaggedProfileMap = Object.fromEntries((flaggedProfiles ?? []).map((p: any) => [p.id, p]));

  const inactiveUserIds = [
    ...new Set(inactiveEnrollments.map((e: any) => e.user_id).filter(Boolean)),
  ];
  const { data: inactiveProfiles } = inactiveUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', inactiveUserIds)
    : { data: [] };
  const inactiveProfileMap = Object.fromEntries(
    (inactiveProfiles ?? []).map((p: any) => [p.id, p]),
  );

  // Calculate RTI stats
  const criticalCount = flagged.filter((f: any) => f.risk_level === 'high').length;
  const mediumCount = flagged.filter((f: any) => f.risk_level === 'medium').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Student Success</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Student Success & RTI</h1>
        <p className="text-sm text-slate-500 mt-1">
          Response to Intervention (RTI) tracking, coaching workflows, and AI-powered student support
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Quick Intervention Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Intervention Actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {INTERVENTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <Icon className="h-6 w-6 text-indigo-700" />
                  <span className="text-xs font-medium text-slate-700">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* RTI Tiers Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-slate-600" />
            Response to Intervention (RTI) Tiers
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {RTI_TIERS.map((tier) => (
              <div key={tier.tier} className={`rounded-xl p-4 ${tier.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold">Tier {tier.tier}</span>
                  <span className="text-xs font-semibold">{tier.label}</span>
                </div>
                <p className="text-xs opacity-80">{tier.intervention}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Critical Risk', value: criticalCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Medium Risk', value: mediumCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Inactive (14d+)', value: inactiveCount, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'Total Flagged', value: flaggedCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Student Tables */}
        <div className="grid grid-cols-1 gap-6">
          <div id="flagged-learners" className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Flagged for Intervention</h2>
            <span className="text-xs text-slate-400">{flaggedCount} students</span>
          </div>
          {flagged.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No flagged students</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Student', 'Risk Level', 'Reason', 'Flagged', 'Action'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {flagged.map((r: any) => {
                  const p = flaggedProfileMap[r.user_id];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{p?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{p?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${RISK_STYLES[r.risk_level] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {r.risk_level ?? 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate">
                        {r.reason ?? r.notes ?? '—'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {p?.id ? <div className="flex items-center justify-end gap-2"><Link href={`/students/${p.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">View <ArrowRight className="w-3 h-3" /></Link><AssignAICounselorButton userId={p.id} riskId={r.id} learnerName={p.full_name || p.email || 'learner'} reason={r.reason || r.notes} /></div> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">
              Enrolled 14+ Days — No Recent Activity
            </h2>
            <span className="text-xs text-slate-400">{inactiveCount} students</span>
          </div>
          {inactiveEnrollments.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All active students have recent activity</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Student', 'Enrolled', 'Days Since Enrolled', 'Action'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inactiveEnrollments.map((e: any) => {
                  const p = inactiveProfileMap[e.user_id];
                  const days = e.enrolled_at
                    ? Math.floor((Date.now() - new Date(e.enrolled_at).getTime()) / 86400000)
                    : null;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{p?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{p?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        {days !== null && (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${days > 30 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
                          >
                            {days}d
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {p?.id ? <div className="flex items-center justify-end gap-2"><Link href={`/students/${p.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">View <ArrowRight className="w-3 h-3" /></Link><AssignAICounselorButton userId={p.id} learnerName={p.full_name || p.email || 'learner'} reason={`No recent activity for ${days ?? 14} days`} /></div> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
