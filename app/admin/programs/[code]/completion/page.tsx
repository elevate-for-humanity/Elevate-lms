import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { ClipboardCheck, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = { title: 'Completion Rules | Elevate Admin' };

export default async function ProgramCompletionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: program } = await supabase
    .from('programs')
    .select('id, title, completion_criteria')
    .or(`code.eq.${code},slug.eq.${code}`)
    .maybeSingle();
  if (!program)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Program not found</h1>
      </div>
    );

  const criteria = program.completion_criteria as any;
  const rules = criteria?.rules || [];

  const ruleLabels: Record<string, string> = {
    lessons_complete: 'All required lessons completed',
    quizzes_passed: 'All quizzes passed with minimum score',
    min_hours: 'Minimum training hours met',
    external_modules: 'External certifications completed',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-4">
        <ol className="flex items-center space-x-2 text-slate-700">
          <li>
            <Link href="/admin/programs" className="hover:text-brand-blue-600">
              Programs
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/admin/programs/${code}/dashboard`} className="hover:text-brand-blue-600">
              {program.title}
            </Link>
          </li>
          <li>/</li>
          <li className="text-slate-900 font-medium">Completion Rules</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Completion Rules — {program.title}</h1>

      <div className="bg-white rounded-lg border p-6">
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardCheck className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Default completion rules</h3>
            <p className="text-slate-700 mb-4">
              This program uses the default rule: all required lessons must be completed.
            </p>
            <p className="text-sm text-slate-700">
              To configure custom rules, update the{' '}
              <code className="bg-slate-100 px-1 rounded">completion_criteria</code> field in the
              programs table via the Supabase Dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-medium text-slate-900">Active Rules</h3>
            {rules.map((rule: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">{ruleLabels[rule.type] || rule.type}</p>
                  {rule.minScore && (
                    <p className="text-sm text-slate-700">Minimum score: {rule.minScore}%</p>
                  )}
                  {rule.hours && (
                    <p className="text-sm text-slate-700">Required hours: {rule.hours}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
