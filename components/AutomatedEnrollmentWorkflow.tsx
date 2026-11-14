'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

interface WorkflowStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed' | 'skipped';
  automated: boolean;
  completed_at?: string;
}
interface EnrollmentData {
  id: string;
  user_id: string;
  program_id?: string | null;
  course_id?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  student?: { full_name: string | null; email: string | null } | null;
  program?: { name: string | null } | null;
  course?: { title: string | null } | null;
}
interface Props {
  enrollmentId?: string;
  showStats?: boolean;
  onStepComplete?: (step: WorkflowStep) => void;
  onWorkflowComplete?: (enrollment: EnrollmentData) => void;
}

const STEP_DEFS = [
  ['Application Received', 'Application record exists and is ready for review'],
  ['Eligibility / Funding Review', 'Funding or self-pay evidence is reviewed'],
  ['Document Collection', 'Required enrollment documents are complete'],
  ['Approval', 'Program admission decision is recorded'],
  ['Payment / Authorization', 'Payment or workforce authorization is verified'],
  ['Course Access', 'LMS access is provisioned'],
  ['Orientation', 'Orientation and next steps are completed'],
  ['Enrollment Complete', 'Learner is active and ready to begin'],
] as const;

function deriveWorkflow(status: string): WorkflowStep[] {
  const normalized = status || 'pending';
  let completedThrough = 0;
  let current = 1;
  if (['submitted', 'pending', 'in_review', 'pending_admin_review'].includes(normalized)) { completedThrough = 1; current = 2; }
  else if (['documents_pending'].includes(normalized)) { completedThrough = 2; current = 3; }
  else if (['approved'].includes(normalized)) { completedThrough = 4; current = 5; }
  else if (['payment_pending'].includes(normalized)) { completedThrough = 4; current = 5; }
  else if (['enrolled', 'active', 'completed'].includes(normalized)) { completedThrough = 8; current = 8; }
  else if (['rejected', 'cancelled', 'revoked'].includes(normalized)) { completedThrough = 2; current = 0; }

  return STEP_DEFS.map(([title, description], index) => {
    const stepNumber = index + 1;
    const isTerminalFailure = ['rejected', 'cancelled', 'revoked'].includes(normalized);
    const stepStatus: WorkflowStep['status'] = stepNumber <= completedThrough
      ? 'completed'
      : isTerminalFailure
        ? 'skipped'
        : stepNumber === current
          ? 'in_progress'
          : 'pending';
    return {
      id: `step-${stepNumber}`,
      step_number: stepNumber,
      title,
      description,
      status: stepStatus,
      automated: [1, 5, 6, 8].includes(stepNumber),
      completed_at: stepStatus === 'completed' ? new Date().toISOString() : undefined,
    };
  });
}

export default function AutomatedEnrollmentWorkflow({ enrollmentId, showStats = true, onStepComplete, onWorkflowComplete }: Props) {
  const [workflow, setWorkflow] = useState<WorkflowStep[]>(deriveWorkflow('pending'));
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [counts, setCounts] = useState({ active: 0, pending: 0, failed: 0, today: 0 });
  const [loading, setLoading] = useState(Boolean(enrollmentId));
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<number | null>(null);

  const loadEnrollment = useCallback(async () => {
    if (!enrollmentId) {
      setWorkflow(deriveWorkflow('pending'));
      setLoading(false);
      return;
    }
    const supabase = createClient();
    try {
      const { data, error: queryError } = await supabase
        .from('program_enrollments')
        .select('id,user_id,program_id,course_id,status,created_at,updated_at,profiles:user_id(full_name,email),training_programs:program_id(name),courses:course_id(title)')
        .eq('id', enrollmentId)
        .maybeSingle();
      if (queryError || !data) throw queryError || new Error('Enrollment not found');
      const row = data as any;
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const program = Array.isArray(row.training_programs) ? row.training_programs[0] : row.training_programs;
      const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
      const normalized: EnrollmentData = {
        id: row.id,
        user_id: row.user_id,
        program_id: row.program_id,
        course_id: row.course_id,
        status: row.status || 'pending',
        created_at: row.created_at,
        updated_at: row.updated_at,
        student: profile ?? null,
        program: program ?? null,
        course: course ?? null,
      };
      setEnrollment(normalized);
      setWorkflow(deriveWorkflow(normalized.status));
      setError(null);
    } catch (loadError) {
      logger.error('[enrollment-workflow] failed to load enrollment', loadError instanceof Error ? loadError : new Error(String(loadError)));
      setError('Enrollment workflow data is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  const loadStats = useCallback(async () => {
    if (!showStats) return;
    const supabase = createClient();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [active, pending, failed, createdToday] = await Promise.all([
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).in('status', ['active', 'enrolled', 'completed']),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).in('status', ['pending', 'submitted', 'in_review', 'documents_pending', 'payment_pending']),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).in('status', ['rejected', 'cancelled', 'revoked']),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    ]);
    setCounts({ active: active.count ?? 0, pending: pending.count ?? 0, failed: failed.count ?? 0, today: createdToday.count ?? 0 });
  }, [showStats]);

  useEffect(() => { void Promise.all([loadEnrollment(), loadStats()]); }, [loadEnrollment, loadStats]);

  useEffect(() => {
    if (!enrollmentId) return;
    const supabase = createClient();
    const channel = supabase.channel(`program-enrollment-${enrollmentId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'program_enrollments', filter: `id=eq.${enrollmentId}` }, (payload: any) => {
      const status = payload.new?.status;
      if (status) {
        setWorkflow(deriveWorkflow(status));
        setEnrollment((current) => current ? { ...current, status } : current);
      }
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [enrollmentId]);

  async function completeStep(stepNumber: number) {
    if (!enrollmentId || !enrollment) return;
    setProcessingStep(stepNumber);
    try {
      const statusMap: Record<number, string> = { 2: 'documents_pending', 3: 'in_review', 4: 'approved', 5: 'approved', 6: 'enrolled', 7: 'active', 8: 'active' };
      const nextStatus = statusMap[stepNumber] || enrollment.status;
      const supabase = createClient();
      const { error: updateError } = await supabase.from('program_enrollments').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', enrollmentId);
      if (updateError) throw updateError;
      const nextWorkflow = deriveWorkflow(nextStatus);
      setWorkflow(nextWorkflow);
      const completed = nextWorkflow.find((step) => step.step_number === stepNumber);
      if (completed) onStepComplete?.(completed);
      const nextEnrollment = { ...enrollment, status: nextStatus };
      setEnrollment(nextEnrollment);
      if (stepNumber === 8) onWorkflowComplete?.(nextEnrollment);
    } catch (stepError) {
      logger.error('[enrollment-workflow] step update failed', stepError instanceof Error ? stepError : new Error(String(stepError)));
      setError('Could not update this enrollment step.');
    } finally {
      setProcessingStep(null);
    }
  }

  const completeCount = useMemo(() => workflow.filter((step) => step.status === 'completed').length, [workflow]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-brand-blue-700" /></div>;

  return (
    <section className="space-y-5">
      {showStats && <div className="grid gap-3 sm:grid-cols-4">{[
        ['Active', counts.active], ['Pending', counts.pending], ['Exceptions', counts.failed], ['Created today', counts.today],
      ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>)}</div>}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black text-slate-950">Enrollment Workflow</h2><p className="text-sm text-slate-600">{enrollment ? `${enrollment.student?.full_name || enrollment.student?.email || 'Learner'} · ${enrollment.program?.name || enrollment.course?.title || 'Program'}` : 'Select an enrollment to inspect its live workflow.'}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{completeCount}/{workflow.length} complete</span></div>
        {error && <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900"><AlertCircle className="h-4 w-4" />{error}</div>}
        <div className="mt-5 space-y-3">{workflow.map((step) => <div key={step.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"><div>{step.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : step.status === 'in_progress' ? <Loader2 className="h-5 w-5 animate-spin text-brand-blue-600" /> : <Circle className="h-5 w-5 text-slate-400" />}</div><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{step.step_number}. {step.title}</p><p className="text-xs text-slate-500">{step.description}</p></div>{enrollmentId && step.status === 'in_progress' && <button type="button" disabled={processingStep === step.step_number} onClick={() => void completeStep(step.step_number)} className="rounded-lg bg-brand-blue-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{processingStep === step.step_number ? 'Saving…' : 'Complete step'}</button>}</div>)}</div>
      </div>
    </section>
  );
}
