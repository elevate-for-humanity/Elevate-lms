import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Target,
  BookOpen,
  Wrench,
  ArrowLeft,
} from 'lucide-react';
import IepStatusButton from './IepStatusButton';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `IEP ${id.slice(0, 8)} | Admin`,
  };
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-700' },
  active:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

function Section({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-slate-400 block mb-0.5">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value ?? '—'}</span>
    </div>
  );
}

function TagList({ items }: { items: unknown }) {
  const arr = Array.isArray(items) ? items : [];
  if (arr.length === 0) return <span className="text-sm text-slate-400">None recorded</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {arr.map((item, i) => (
        <span
          key={i}
          className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full"
        >
          {String(item)}
        </span>
      ))}
    </div>
  );
}

export default async function IepDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['admin', 'staff', 'advisor']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: iep, error } = await db
    .from('individual_employment_plans')
    .select(`
      *,
      participant:profiles!individual_employment_plans_user_id_fkey(
        full_name, email, phone
      ),
      case_manager:profiles!individual_employment_plans_case_manager_id_fkey(
        full_name, email
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !iep) notFound();

  const status = iep.status ?? 'draft';
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  const participant = iep.participant as { full_name?: string; email?: string; phone?: string } | null;
  const caseManager = iep.case_manager as { full_name?: string; email?: string } | null;
  const milestones = Array.isArray(iep.milestones) ? iep.milestones as Array<{
    title: string; due_date?: string; completed?: boolean;
  }> : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-3">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'WIOA', href: '/admin/wioa' },
            { label: 'Employment Plans', href: '/admin/wioa/iep' },
            { label: participant?.full_name ?? id.slice(0, 8) },
          ]}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link
                href="/admin/wioa/iep"
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl font-bold text-slate-900">
                {participant?.full_name ?? 'Unknown participant'}
              </h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 ml-7">
              Individual Employment Plan · Created{' '}
              {iep.created_at ? new Date(iep.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
          <IepStatusButton iepId={id} currentStatus={status} />
        </div>

        <div className="space-y-4">
          {/* Participant info */}
          <Section title="Participant" icon={<User className="w-4 h-4 text-slate-400" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Name" value={participant?.full_name} />
              <Field label="Email" value={participant?.email} />
              <Field label="Phone" value={participant?.phone} />
              <Field label="Case manager" value={caseManager?.full_name} />
              <Field
                label="Reviewed"
                value={iep.reviewed_at ? new Date(iep.reviewed_at).toLocaleDateString() : null}
              />
            </div>
          </Section>

          {/* Goals */}
          <Section title="Goals" icon={<Target className="w-4 h-4 text-slate-400" />}>
            <div className="space-y-3">
              <Field label="Career goal" value={iep.career_goal ?? iep.primary_career_goal} />
              <Field label="Employment goal" value={iep.employment_goal} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <Field label="Target occupation" value={iep.target_occupation} />
                <Field label="Target industry" value={iep.target_industry} />
                <Field
                  label="Target wage"
                  value={iep.target_wage ? `$${iep.target_wage}/hr` : null}
                />
                <Field
                  label="Target completion"
                  value={
                    iep.target_completion_date
                      ? new Date(iep.target_completion_date).toLocaleDateString()
                      : null
                  }
                />
              </div>
            </div>
          </Section>

          {/* Background */}
          <Section title="Background" icon={<BookOpen className="w-4 h-4 text-slate-400" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Education level" value={iep.education_level} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1.5">Barriers</span>
                <TagList items={iep.barriers ?? iep.identified_barriers} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1.5">Skills</span>
                <TagList items={iep.skills} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1.5">Strengths</span>
                <TagList items={iep.strengths} />
              </div>
            </div>
          </Section>

          {/* Services */}
          <Section title="Services & Training" icon={<Wrench className="w-4 h-4 text-slate-400" />}>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 block mb-1.5">Training needs</span>
                <TagList items={iep.training_needs ?? iep.training_services_needed} />
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1.5">Support services needed</span>
                <TagList items={iep.support_services_needed ?? iep.supportive_services_needed} />
              </div>
            </div>
          </Section>

          {/* Milestones */}
          <Section title="Milestones" icon={<CheckCircle className="w-4 h-4 text-slate-400" />}>
            {milestones.length === 0 ? (
              <p className="text-sm text-slate-400">No milestones recorded.</p>
            ) : (
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                      m.completed
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {m.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-sm flex-1">{m.title}</span>
                    {m.due_date && (
                      <span className="text-xs text-slate-400">
                        Due {new Date(m.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Notes */}
          {iep.notes && (
            <Section title="Case notes" icon={<AlertTriangle className="w-4 h-4 text-slate-400" />}>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{iep.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
