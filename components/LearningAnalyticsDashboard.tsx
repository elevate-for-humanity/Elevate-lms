'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui/Card';

type RiskFactor = {
  factor?: string;
  days?: number;
  pct?: number;
  count?: number;
};

type RiskResult = {
  status: string;
  score: number;
  days: number;
  progress: number;
  overdue: number;
  factors: RiskFactor[];
};

type Intervention = {
  id: string;
  intervention_type: string;
  status: string;
  notes: string | null;
  outcome: string | null;
  due_at: string | null;
  completed_at: string | null;
};

function factorLabel(factor: RiskFactor) {
  if (factor.factor === 'inactivity') return `No recorded learning activity for ${factor.days ?? 0} days`;
  if (factor.factor === 'low_progress') return `Active-enrollment progress is ${Math.round(factor.pct ?? 0)}%`;
  if (factor.factor === 'overdue_requirements') return `${factor.count ?? 0} required item(s) are overdue`;
  return 'Documented risk factor';
}

export default function LearningAnalyticsDashboard() {
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Sign in to view learning analytics.');
        setLoading(false);
        return;
      }

      try {
        const { data: riskData, error: riskError } = await supabase.rpc('calculate_student_risk_status', {
          p_student_id: user.id,
        });
        if (riskError) throw riskError;

        const parsed = riskData && typeof riskData === 'object' ? riskData as Record<string, unknown> : {};
        setRisk({
          status: typeof parsed.status === 'string' ? parsed.status : 'unknown',
          score: Number(parsed.score ?? 0),
          days: Number(parsed.days ?? 0),
          progress: Number(parsed.progress ?? 0),
          overdue: Number(parsed.overdue ?? 0),
          factors: Array.isArray(parsed.factors) ? parsed.factors as RiskFactor[] : [],
        });

        const { data: interventionRows, error: interventionError } = await supabase
          .from('student_interventions')
          .select('id, intervention_type, status, notes, outcome, due_at, completed_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (interventionError) throw interventionError;
        setInterventions((interventionRows ?? []) as Intervention[]);
      } catch (err) {
        logger.error('Error loading canonical learning risk analytics', err);
        setError('Learning analytics are temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-950 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-3xl font-bold md:text-4xl">Learning Risk & Progress</h1>
          <p className="mt-2 text-slate-200">
            Evidence-based indicators calculated from recorded activity, enrollment progress, and overdue requirements.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {loading && <p className="text-slate-600">Calculating current status…</p>}
        {error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">{error}</p>}

        {!loading && !error && risk && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-slate-600">Risk status</h2>
                <p className="mt-2 text-3xl font-bold capitalize text-slate-950">{risk.status.replace('_', ' ')}</p>
                <p className="mt-2 text-sm text-slate-500">Calculated by the canonical student-risk rules engine.</p>
              </Card>
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-slate-600">Risk score</h2>
                <p className="mt-2 text-3xl font-bold text-slate-950">{Math.round(risk.score)}/100</p>
                <p className="mt-2 text-sm text-slate-500">Higher scores indicate more documented risk factors.</p>
              </Card>
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-slate-600">Active progress</h2>
                <p className="mt-2 text-3xl font-bold text-slate-950">{Math.round(risk.progress)}%</p>
                <p className="mt-2 text-sm text-slate-500">Average progress across active program enrollments.</p>
              </Card>
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-slate-600">Overdue requirements</h2>
                <p className="mt-2 text-3xl font-bold text-slate-950">{risk.overdue}</p>
                <p className="mt-2 text-sm text-slate-500">Required items currently past their recorded due date.</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-950">Documented risk factors</h2>
                <p className="mt-1 text-sm text-slate-500">No invented confidence values or sample activity are used here.</p>
                <div className="mt-5 space-y-3">
                  {risk.factors.length === 0 ? (
                    <p className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900">No current rule-based risk factors were detected.</p>
                  ) : risk.factors.map((factor, index) => (
                    <div key={`${factor.factor ?? 'factor'}-${index}`} className="rounded-xl border border-slate-200 p-4 text-sm text-slate-800">
                      {factorLabel(factor)}
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs text-slate-500">Last inactivity measure: {risk.days} day(s). Risk scoring supports staff intervention; it does not guarantee completion or placement outcomes.</p>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold text-slate-950">Interventions</h2>
                <p className="mt-1 text-sm text-slate-500">Actions recorded in the canonical student-intervention workflow.</p>
                <div className="mt-5 space-y-3">
                  {interventions.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">No interventions are currently recorded for this learner.</p>
                  ) : interventions.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-slate-950">{item.intervention_type}</p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{item.status}</span>
                      </div>
                      {item.notes && <p className="mt-2 text-sm text-slate-700">{item.notes}</p>}
                      {item.outcome && <p className="mt-2 text-sm text-slate-700"><strong>Outcome:</strong> {item.outcome}</p>}
                      {item.due_at && <p className="mt-2 text-xs text-slate-500">Due: {new Date(item.due_at).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
