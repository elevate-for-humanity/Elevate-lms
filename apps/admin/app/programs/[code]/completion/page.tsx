import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardCheck, CheckCircle } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Completion Rules | Elevate Admin' };

const ruleLabels: Record<string, string> = {
  all_courses: 'All program courses completed',
  required_courses: 'All required program courses completed',
  min_courses: 'Minimum number of courses completed',
  all_lessons: 'All course lessons completed',
  required_lessons: 'All required lessons completed',
  min_score: 'Minimum assessment score met',
};

export default async function ProgramCompletionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireAdmin();
  const db = await requireAdminClient();

  const { data: program } = await db
    .from('programs')
    .select('id,title')
    .or(`code.eq.${code},slug.eq.${code}`)
    .maybeSingle();
  if (!program) return <div className="p-8"><h1 className="text-2xl font-bold">Program not found</h1></div>;

  const { data: rules, error } = await db
    .from('completion_rules')
    .select('id,rule_type,config,is_active')
    .eq('entity_type', 'program')
    .eq('entity_id', program.id)
    .eq('is_active', true)
    .order('created_at');
  if (error) throw error;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-600"><Link href="/programs" className="hover:underline">Programs</Link><span className="px-2">/</span><Link href={`/programs/${code}/dashboard`} className="hover:underline">{program.title}</Link><span className="px-2">/</span><span>Completion Rules</span></nav>
      <h1 className="mb-6 text-2xl font-bold text-slate-950">Completion Rules — {program.title}</h1>
      <div className="rounded-lg border bg-white p-6">
        {!rules?.length ? (
          <div className="py-8 text-center">
            <ClipboardCheck className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h2 className="mb-2 text-lg font-medium text-slate-900">Default completion rule</h2>
            <p className="text-slate-600">All required courses attached to the program must be completed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-medium text-slate-900">Active rules</h2>
            {rules.map((rule) => {
              const config = (rule.config ?? {}) as Record<string, unknown>;
              return (
                <div key={rule.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-medium text-slate-900">{ruleLabels[rule.rule_type] || rule.rule_type}</p>
                    {config.min_score !== undefined ? <p className="text-sm text-slate-600">Minimum score: {String(config.min_score)}%</p> : null}
                    {config.count !== undefined ? <p className="text-sm text-slate-600">Required courses: {String(config.count)}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
