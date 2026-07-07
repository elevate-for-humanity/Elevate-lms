import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Log | Elevate for Humanity',
  description: 'Log page content.',
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
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Log</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}

export default function LogCompetencyPage() {
  return <LogCompetencyForm />;
}
