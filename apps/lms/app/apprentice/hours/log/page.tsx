'use client';

import Link from 'next/link';

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Log Competency</h1>
              <p className="text-slate-600 mt-1">Record your work hours and competency completion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Skill Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Competency/Skill *
              </label>
              {loadingSkills ? (
                <div className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50">
                  Loading skills...
                </div>
              ) : skills.length === 0 ? (
                <div className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500">
                  No competencies available for your program.
                </div>
              ) : (
                <select
                  value={formData.skillId}
                  onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a competency...</option>
                  {Object.entries(grouped).map(([category, categorySkills]) => (
                    <optgroup key={category} label={category}>
                      {categorySkills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>

            {/* Work Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date of Work *
              </label>
              <input
                type="date"
                value={formData.workDate}
                onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Hours and Service Count */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Hours Worked
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.hoursCredited}
                  onChange={(e) => setFormData({ ...formData, hoursCredited: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  disabled={isRTI}
                />
                {isRTI && (
                  <p className="text-xs text-slate-500 mt-1">RTI hours calculated automatically</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Services Performed
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.serviceCount}
                  onChange={(e) => setFormData({ ...formData, serviceCount: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Supervisor Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Supervisor Name
              </label>
              <input
                type="text"
                value={formData.supervisorName}
                onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="Enter supervisor name (optional)"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                placeholder="Add any notes about this work experience..."
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || loadingSkills}
                className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Entry'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function LogCompetencyPage() {
  return <LogCompetencyForm />;
}
