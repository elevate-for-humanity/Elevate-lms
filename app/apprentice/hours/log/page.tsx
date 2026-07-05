'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  History,
  Save,
  Scissors,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/client';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';

type Skill = {
  id: string;
  name: string;
  description: string | null;
  category_name: string;
  is_rti: boolean;
};

async function resolveClientProgramId(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('program_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (apprentice?.program_id) return apprentice.program_id;
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('program_id')
    .eq('user_id', userId)
    .in('status', ['active', 'enrolled', 'in_progress'])
    .order('created_at', { ascending: false })
    .maybeSingle();
  return enrollment?.program_id ?? null;
}

function LogCompetencyForm() {
  const router = useRouter();
  const searchParams = useSafeSearchParams();
  const preselectedSkillId = searchParams.get('skill') ?? '';
  const supabase = createClient();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    skillId: preselectedSkillId,
    workDate: new Date().toISOString().split('T')[0],
    serviceCount: '1',
    hoursCredited: '0.5',
    supervisorName: '',
    notes: '',
  });

  useEffect(() => {
    async function loadSkills() {
      if (!supabase) return;

      setLoadingSkills(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setSkills([]);
          return;
        }

        const programId = await resolveClientProgramId(supabase, user.id);

        if (!programId) {
          setSkills([]);
          return;
        }

        const { data: cats } = await supabase
          .from('skill_categories')
          .select('id, name, order')
          .eq('program_id', programId)
          .order('order', { ascending: true });

        const { data: rawSkills } = await supabase
          .from('apprentice_skills')
          .select('id, category_id, name, description, order')
          .eq('program_id', programId)
          .order('order', { ascending: true });

        const catMap: Record<string, { name: string; order: number }> = {};
        for (const c of cats ?? []) {
          const row = c as any;
          catMap[row.id] = { name: row.name, order: row.order };
        }

        const enriched: Skill[] = (rawSkills ?? []).map((skill: any) => ({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          category_name: catMap[skill.category_id]?.name ?? 'Other',
          is_rti: catMap[skill.category_id]?.order === 7,
        }));

        setSkills(enriched);
      } finally {
        setLoadingSkills(false);
      }
    }

    loadSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSkill = skills.find((skill) => skill.id === formData.skillId);
  const isRTI = selectedSkill?.is_rti ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.skillId) {
      setError('Please select a competency.');
      return;
    }
    if (!formData.workDate) {
      setError('Please enter the date.');
      return;
    }

    const count = parseInt(formData.serviceCount, 10);
    const hours = parseFloat(formData.hoursCredited);

    if (Number.isNaN(count) || count < 1) {
      setError('Service count must be at least 1.');
      return;
    }
    if (!isRTI && (Number.isNaN(hours) || hours < 0)) {
      setError('Please enter valid hours.');
      return;
    }

    setSubmitting(true);
    try {
      if (!supabase) throw new Error('Not connected');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=/apprentice/competencies/log');
        return;
      }

      const programId = await resolveClientProgramId(supabase, user.id);

      if (!programId) {
        setError('No active apprenticeship program found for this account.');
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase.from('competency_log').insert({
        apprentice_id: user.id,
        skill_id: formData.skillId,
        program_id: programId,
        work_date: formData.workDate,
        service_count: count,
        hours_credited: isRTI ? 0 : hours,
        supervisor_name: formData.supervisorName.trim() || null,
        notes: formData.notes.trim() || null,
        status: 'pending',
        supervisor_verified: false,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => router.push('/apprentice/competencies'), 1800);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save. Please try again.');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 text-center max-w-sm w-full">
          <span className="w-14 h-14 rounded-full bg-brand-green-500 inline-block flex-shrink-0 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Entry Saved</h2>
          <p className="text-slate-500 text-sm">
            Your competency entry has been submitted for supervisor verification.
          </p>
          <p className="text-xs text-slate-400 mt-3">Redirecting…</p>
        </div>
      </div>
    );
  }

  const grouped: Record<string, Skill[]> = {};
  for (const skill of skills) {
    if (!grouped[skill.category_name]) grouped[skill.category_name] = [];
    grouped[skill.category_name].push(skill);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Apprentice Portal', href: '/apprentice' },
              { label: 'Competency Progress', href: '/apprentice/competencies' },
              { label: 'Log Service' },
            ]}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/apprentice/competencies"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Competencies
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/apprentice/timeclock"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition"
            >
              <Clock className="w-3.5 h-3.5" /> Timeclock
            </Link>
            <Link
              href="/apprentice/hours"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition"
            >
              <History className="w-3.5 h-3.5" /> Hours
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-brand-blue-50 rounded-xl flex items-center justify-center">
              <Scissors className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Log Competency Entry</h1>
              <p className="text-sm text-slate-500">
                Indiana WPS — record a service or RTI module completed
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Competency / Service <span className="text-red-500">*</span>
              </label>
              {loadingSkills ? (
                <div className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm">
                  Loading competencies…
                </div>
              ) : (
                <select
                  required
                  value={formData.skillId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, skillId: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-sm"
                >
                  <option value="">— Select a competency —</option>
                  {Object.entries(grouped).map(([catName, catSkills]) => (
                    <optgroup key={catName} label={catName}>
                      {catSkills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
              {selectedSkill?.description && (
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {selectedSkill.description}
                </p>
              )}
              {isRTI && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2">
                  RTI theory module — no OJL hours credited. Mark complete when you finish this
                  module in your coursework.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Date Performed <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.workDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, workDate: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Times Performed <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={formData.serviceCount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, serviceCount: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-sm"
                  placeholder="1"
                />
                <p className="text-xs text-slate-400 mt-1">How many clients / repetitions today</p>
              </div>

              {!isRTI && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    OJL Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.5"
                    max="12"
                    step="0.5"
                    value={formData.hoursCredited}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, hoursCredited: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-sm"
                    placeholder="0.5"
                  />
                  <p className="text-xs text-slate-400 mt-1">Hours toward 2,000 OJL requirement</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Supervising Barber Name
              </label>
              <input
                type="text"
                value={formData.supervisorName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supervisorName: e.target.value }))
                }
                placeholder="Name of licensed supervising barber"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                Your supervisor will be asked to verify this entry. Required for DOL audit.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes / Description</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Describe what you practiced, any techniques used, client feedback…"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-sm resize-none"
              />
            </div>

            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
              <p className="text-xs text-brand-blue-800 leading-relaxed">
                <strong>DOL Compliance:</strong> All entries are submitted as <em>pending</em> until
                your supervising barber verifies them. Only verified entries count toward your
                official 2,000-hour OJL record in the federal RAPIDS system.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/apprentice/competencies"
                className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || loadingSkills}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>Saving…</>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Entry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LogCompetencyPage() {
  return <LogCompetencyForm />;
}
