import { getAdminClient } from '@/lib/supabase/admin';

export async function getEtplMetrics() {
  const supabase = await getAdminClient();

  // Get apprentice counts by status
  const { data: apprentices } = await supabase
    .from('apprentices')
    .select('status');

  const total = apprentices?.length || 0;
  const active = apprentices?.filter((d) => d.status === 'active').length || 0;
  const completed =
    apprentices?.filter((d) => d.status === 'completed').length || 0;
  const exited = apprentices?.filter((d) => d.status === 'exited').length || 0;

  // Calculate retention rate
  const retention =
    total > 0 ? Math.round(((active + completed) / total) * 100) : 0;

  // Calculate completion rate
  const completionRate =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    active,
    completed,
    exited,
    retention,
    completionRate,
  };
}

export async function getFundingMetrics() {
  const supabase = await getAdminClient();

  const { data: funding } = await supabase.from('funding_cases').select('*');

  const totalCases = funding?.length || 0;
  const approved =
    funding?.filter((f) => f.status === 'approved').length || 0;
  const pending = funding?.filter((f) => f.status === 'pending').length || 0;
  const denied = funding?.filter((f) => f.status === 'denied').length || 0;

  // Group by funding source
  const bySource = funding?.reduce((acc: any, f) => {
    acc[f.funding_source] = (acc[f.funding_source] || 0) + 1;
    return acc;
  }, {});

  // Calculate total approved amount
  const totalApproved = funding
    ?.filter((f) => f.status === 'approved')
    .reduce((sum, f) => sum + (Number(f.approved_amount) || 0), 0);

  return {
    totalCases,
    approved,
    pending,
    denied,
    bySource: bySource || {},
    totalApproved: totalApproved || 0,
  };
}

export async function getEmployerMetrics() {
  const supabase = await getAdminClient();

  const { data: employers } = await supabase
    .from('employer_onboarding')
    .select('*');

  const total = employers?.length || 0;
  const approved =
    employers?.filter((e) => e.status === 'approved').length || 0;
  const pending = employers?.filter((e) => e.status === 'submitted').length || 0;
  const rejected =
    employers?.filter((e) => e.status === 'rejected').length || 0;

  return {
    total,
    approved,
    pending,
    rejected,
  };
}

export async function getRapidsMetrics() {
  const supabase = await getAdminClient();

  const { data: rapids } = await supabase.from('rapids_tracking').select('*');

  const total = rapids?.length || 0;
  const registered =
    rapids?.filter((r) => r.status === 'registered').length || 0;
  const active = rapids?.filter((r) => r.status === 'active').length || 0;
  const completed =
    rapids?.filter((r) => r.status === 'completed').length || 0;

  return {
    total,
    registered,
    active,
    completed,
  };
}

export async function getWotcMetrics() {
  const supabase = await getAdminClient();

  const { data: wotc } = await supabase.from('wotc_tracking').select('*');

  const total = wotc?.length || 0;
  const submitted = wotc?.filter((w) => w.submitted).length || 0;
  const eligible = wotc?.filter((w) => w.eligible).length || 0;

  // Calculate urgent (within 5 days of deadline)
  const urgent =
    wotc?.filter((w) => {
      if (w.submitted) return false;
      const deadline = new Date(w.hire_date);
      deadline.setDate(deadline.getDate() + 28);
      const daysRemaining = Math.ceil(
        (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysRemaining <= 5 && daysRemaining >= 0;
    }).length || 0;

  return {
    total,
    submitted,
    eligible,
    urgent,
  };
}
