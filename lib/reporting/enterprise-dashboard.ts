/**
 * Enterprise Reporting Dashboard
 * Completions, placements, equity metrics by program/site/funder
 */

export interface DashboardMetrics {
  // Overall metrics
  totalEnrollments: number;
  activeStudents: number;
  completions: number;
  completionRate: number;

  // Placement metrics
  placedInEmployment: number;
  placementRate: number;
  averageWage: number;
  medianWage: number;

  // Retention
  retentionRate: number;
  dropoutRate: number;

  // Time metrics
  averageCompletionTime: number; // days

  // Funding
  totalFundingUsed: number;
  costPerCompletion: number;
}

export interface ProgramMetrics extends DashboardMetrics {
  programId: string;
  programName: string;
}

export interface SiteMetrics extends DashboardMetrics {
  siteId: string;
  siteName: string;
  location: string;
}

export interface FunderMetrics extends DashboardMetrics {
  funderType: 'WIOA' | 'WRG' | 'JRI' | 'SEAL' | 'Apprenticeship' | 'Other';
  funderName: string;
}

export interface EquityMetrics {
  // Demographics
  byGender: { gender: string; count: number; completionRate: number }[];
  byRace: { race: string; count: number; completionRate: number }[];
  byAge: { ageRange: string; count: number; completionRate: number }[];

  // Barriers
  byBarrier: { barrier: string; count: number; completionRate: number }[];

  // Outcomes
  placementRateByDemographic: {
    demographic: string;
    category: string;
    placementRate: number;
  }[];

  // Wage equity
  wageGapAnalysis: {
    demographic: string;
    category: string;
    averageWage: number;
    wageGap: number; // compared to overall average
  }[];
}

export interface TimeSeriesData {
  date: string;
  enrollments: number;
  completions: number;
  placements: number;
}

/**
 * Calculate overall dashboard metrics
 */
export async function calculateOverallMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<DashboardMetrics> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // Get enrollments
  let enrollmentQuery = supabase.from('program_enrollments').select('*');

  if (startDate) {
    enrollmentQuery = enrollmentQuery.gte(
      'enrolled_at',
      startDate.toISOString()
    );
  }
  if (endDate) {
    enrollmentQuery = enrollmentQuery.lte('enrolled_at', endDate.toISOString());
  }

  const { data: enrollments } = await enrollmentQuery;
  const totalEnrollments = enrollments?.length || 0;
  const activeStudents =
    enrollments?.filter((e) => e.status === 'active').length || 0;
  const completions =
    enrollments?.filter((e) => e.status === 'completed').length || 0;
  const completionRate =
    totalEnrollments > 0 ? (completions / totalEnrollments) * 100 : 0;

  // Get employment outcomes
  const { data: outcomes } = await supabase
    .from('employment_outcomes')
    .select('*')
    .eq('employed_at_exit', true);

  const placedInEmployment = outcomes?.length || 0;
  const placementRate =
    completions > 0 ? (placedInEmployment / completions) * 100 : 0;

  const wages = outcomes?.map((o) => o.hourly_wage).filter(Boolean) || [];
  const averageWage =
    wages.length > 0 ? wages.reduce((sum, w) => sum + w, 0) / wages.length : 0;
  const medianWage =
    wages.length > 0
      ? wages.sort((a, b) => a - b)[Math.floor(wages.length / 2)]
      : 0;

  // Calculate retention
  const dropped =
    enrollments?.filter(
      (e) => e.status === 'dropped' || e.status === 'withdrawn'
    ).length || 0;
  const retentionRate =
    totalEnrollments > 0
      ? ((totalEnrollments - dropped) / totalEnrollments) * 100
      : 0;
  const dropoutRate = 100 - retentionRate;

  // Average completion time
  const completedEnrollments =
    enrollments?.filter((e) => e.status === 'completed' && e.completion_date) ||
    [];
  const completionTimes = completedEnrollments.map((e) => {
    const start = new Date(e.enrolled_at);
    const end = new Date(e.completion_date);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
  });
  const averageCompletionTime =
    completionTimes.length > 0
      ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
      : 0;

  // Funding metrics
  const { data: funding } = await supabase
    .from('funding_records')
    .select('amount');

  const totalFundingUsed =
    funding?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
  const costPerCompletion =
    completions > 0 ? totalFundingUsed / completions : 0;

  return {
    totalEnrollments,
    activeStudents,
    completions,
    completionRate,
    placedInEmployment,
    placementRate,
    averageWage,
    medianWage,
    retentionRate,
    dropoutRate,
    averageCompletionTime,
    totalFundingUsed,
    costPerCompletion,
  };
}

/**
 * Calculate metrics by program
 */
export async function calculateProgramMetrics(): Promise<ProgramMetrics[]> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: programs } = await supabase.from('programs').select('id, name');

  if (!programs) return [];

  const metrics: ProgramMetrics[] = [];

  for (const program of programs) {
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('*')
      .eq('program_id', program.id);

    const totalEnrollments = enrollments?.length || 0;
    const completions =
      enrollments?.filter((e) => e.status === 'completed').length || 0;
    const completionRate =
      totalEnrollments > 0 ? (completions / totalEnrollments) * 100 : 0;

    // Get outcomes for this program
    const studentIds = enrollments?.map((e) => e.student_id) || [];
    const { data: outcomes } = await supabase
      .from('employment_outcomes')
      .select('*')
      .in('participant_id', studentIds)
      .eq('employed_at_exit', true);

    const placedInEmployment = outcomes?.length || 0;
    const placementRate =
      completions > 0 ? (placedInEmployment / completions) * 100 : 0;

    metrics.push({
      programId: program.id,
      programName: program.name,
      totalEnrollments,
      activeStudents:
        enrollments?.filter((e) => e.status === 'active').length || 0,
      completions,
      completionRate,
      placedInEmployment,
      placementRate,
      averageWage: 0, // Calculate from outcomes
      medianWage: 0,
      retentionRate: 0,
      dropoutRate: 0,
      averageCompletionTime: 0,
      totalFundingUsed: 0,
      costPerCompletion: 0,
    });
  }

  return metrics;
}

/**
 * Calculate metrics by site (multi-location tracking)
 */
export async function calculateSiteMetrics(): Promise<SiteMetrics[]> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, location');

  if (!sites) return [];

  const metrics: SiteMetrics[] = [];

  for (const site of sites) {
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('*')
      .eq('site_id', site.id);

    const totalEnrollments = enrollments?.length || 0;
    const activeStudents =
      enrollments?.filter((e) => e.status === 'active').length || 0;
    const completions =
      enrollments?.filter((e) => e.status === 'completed').length || 0;
    const completionRate =
      totalEnrollments > 0 ? (completions / totalEnrollments) * 100 : 0;

    // Get outcomes for this site
    const studentIds = enrollments?.map((e) => e.student_id) || [];
    const { data: outcomes } = await supabase
      .from('employment_outcomes')
      .select('*')
      .in('participant_id', studentIds)
      .eq('employed_at_exit', true);

    const placedInEmployment = outcomes?.length || 0;
    const placementRate =
      completions > 0 ? (placedInEmployment / completions) * 100 : 0;

    // Calculate wages
    const wages = outcomes?.map((o) => o.hourly_wage).filter(Boolean) || [];
    const averageWage =
      wages.length > 0
        ? wages.reduce((sum, w) => sum + w, 0) / wages.length
        : 0;
    const medianWage =
      wages.length > 0
        ? wages.sort((a, b) => a - b)[Math.floor(wages.length / 2)]
        : 0;

    // Calculate retention
    const dropped =
      enrollments?.filter(
        (e) => e.status === 'dropped' || e.status === 'withdrawn'
      ).length || 0;
    const retentionRate =
      totalEnrollments > 0
        ? ((totalEnrollments - dropped) / totalEnrollments) * 100
        : 0;
    const dropoutRate = 100 - retentionRate;

    // Average completion time
    const completedEnrollments =
      enrollments?.filter(
        (e) => e.status === 'completed' && e.completion_date
      ) || [];
    const completionTimes = completedEnrollments.map((e) => {
      const start = new Date(e.enrolled_at);
      const end = new Date(e.completion_date);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    });
    const averageCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, t) => sum + t, 0) /
          completionTimes.length
        : 0;

    // Funding metrics
    const { data: funding } = await supabase
      .from('funding_records')
      .select('amount')
      .eq('site_id', site.id);

    const totalFundingUsed =
      funding?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
    const costPerCompletion =
      completions > 0 ? totalFundingUsed / completions : 0;

    metrics.push({
      siteId: site.id,
      siteName: site.name,
      location: site.location || 'Unknown',
      totalEnrollments,
      activeStudents,
      completions,
      completionRate,
      placedInEmployment,
      placementRate,
      averageWage,
      medianWage,
      retentionRate,
      dropoutRate,
      averageCompletionTime,
      totalFundingUsed,
      costPerCompletion,
    });
  }

  return metrics;
}

/**
 * Calculate metrics by funder (WIOA, WRG, JRI, SEAL, etc.)
 */
export async function calculateFunderMetrics(): Promise<FunderMetrics[]> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const funderTypes = [
    'WIOA',
    'WRG',
    'JRI',
    'SEAL',
    'Apprenticeship',
    'Other',
  ] as const;
  const metrics: FunderMetrics[] = [];

  for (const funderType of funderTypes) {
    // Get funding records for this funder type
    const { data: fundingRecords } = await supabase
      .from('funding_records')
      .select('*, enrollments(*)')
      .eq('funder_type', funderType);

    if (!fundingRecords || fundingRecords.length === 0) continue;

    // Get all enrollments funded by this funder
    const enrollmentIds = fundingRecords
      .map((f) => f.enrollment_id)
      .filter(Boolean);
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('*')
      .in('id', enrollmentIds);

    const totalEnrollments = enrollments?.length || 0;
    const activeStudents =
      enrollments?.filter((e) => e.status === 'active').length || 0;
    const completions =
      enrollments?.filter((e) => e.status === 'completed').length || 0;
    const completionRate =
      totalEnrollments > 0 ? (completions / totalEnrollments) * 100 : 0;

    // Get outcomes
    const studentIds = enrollments?.map((e) => e.student_id) || [];
    const { data: outcomes } = await supabase
      .from('employment_outcomes')
      .select('*')
      .in('participant_id', studentIds)
      .eq('employed_at_exit', true);

    const placedInEmployment = outcomes?.length || 0;
    const placementRate =
      completions > 0 ? (placedInEmployment / completions) * 100 : 0;

    // Calculate wages
    const wages = outcomes?.map((o) => o.hourly_wage).filter(Boolean) || [];
    const averageWage =
      wages.length > 0
        ? wages.reduce((sum, w) => sum + w, 0) / wages.length
        : 0;
    const medianWage =
      wages.length > 0
        ? wages.sort((a, b) => a - b)[Math.floor(wages.length / 2)]
        : 0;

    // Calculate retention
    const dropped =
      enrollments?.filter(
        (e) => e.status === 'dropped' || e.status === 'withdrawn'
      ).length || 0;
    const retentionRate =
      totalEnrollments > 0
        ? ((totalEnrollments - dropped) / totalEnrollments) * 100
        : 0;
    const dropoutRate = 100 - retentionRate;

    // Average completion time
    const completedEnrollments =
      enrollments?.filter(
        (e) => e.status === 'completed' && e.completion_date
      ) || [];
    const completionTimes = completedEnrollments.map((e) => {
      const start = new Date(e.enrolled_at);
      const end = new Date(e.completion_date);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    });
    const averageCompletionTime =
      completionTimes.length > 0
        ? completionTimes.reduce((sum, t) => sum + t, 0) /
          completionTimes.length
        : 0;

    // Funding metrics
    const totalFundingUsed = fundingRecords.reduce(
      (sum, f) => sum + (f.amount || 0),
      0
    );
    const costPerCompletion =
      completions > 0 ? totalFundingUsed / completions : 0;

    metrics.push({
      funderType,
      funderName: funderType,
      totalEnrollments,
      activeStudents,
      completions,
      completionRate,
      placedInEmployment,
      placementRate,
      averageWage,
      medianWage,
      retentionRate,
      dropoutRate,
      averageCompletionTime,
      totalFundingUsed,
      costPerCompletion,
    });
  }

  return metrics;
}

/**
 * Calculate equity metrics
 */
export async function calculateEquityMetrics(): Promise<EquityMetrics> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // Get all participants with demographics
  const { data: participants } = await supabase.from('wioa_participants')
    .select(`
      *,
      enrollments(status, completion_date),
      employment_outcomes(employed_at_exit, hourly_wage)
    `);

  if (!participants) {
    return {
      byGender: [],
      byRace: [],
      byAge: [],
      byBarrier: [],
      placementRateByDemographic: [],
      wageGapAnalysis: [],
    };
  }

  // By gender
  const genderGroups = groupBy(participants, 'gender');
  const byGender = Object.entries(genderGroups).map(([gender, group]: any) => ({
    gender,
    count: group.length,
    completionRate: calculateCompletionRate(group),
  }));

  // By race
  const raceGroups = groupBy(participants, 'race');
  const byRace = Object.entries(raceGroups).map(([race, group]: any) => ({
    race,
    count: group.length,
    completionRate: calculateCompletionRate(group),
  }));

  // By age
  const byAge = [
    { ageRange: '14-17', count: 0, completionRate: 0 },
    { ageRange: '18-24', count: 0, completionRate: 0 },
    { ageRange: '25-34', count: 0, completionRate: 0 },
    { ageRange: '35-44', count: 0, completionRate: 0 },
    { ageRange: '45-54', count: 0, completionRate: 0 },
    { ageRange: '55+', count: 0, completionRate: 0 },
  ];

  // By barrier
  const barrierCounts: Record<string, any[]> = {};
  participants.forEach((p) => {
    p.eligibility_barriers?.forEach((barrier: any) => {
      if (!barrierCounts[barrier.type]) {
        barrierCounts[barrier.type] = [];
      }
      barrierCounts[barrier.type].push(p);
    });
  });

  const byBarrier = Object.entries(barrierCounts).map(([barrier, group]: any) => ({
    barrier,
    count: group.length,
    completionRate: calculateCompletionRate(group),
  }));

  // Placement rates by demographic
  const placementRateByDemographic = [
    ...byGender.map((g) => ({
      demographic: 'gender',
      category: g.gender,
      placementRate: calculatePlacementRate(genderGroups[g.gender]),
    })),
    ...byRace.map((r) => ({
      demographic: 'race',
      category: r.race,
      placementRate: calculatePlacementRate(raceGroups[r.race]),
    })),
  ];

  // Wage gap analysis
  const overallAvgWage = calculateAverageWage(participants);
  const wageGapAnalysis = [
    ...byGender.map((g) => ({
      demographic: 'gender',
      category: g.gender,
      averageWage: calculateAverageWage(genderGroups[g.gender]),
      wageGap: calculateAverageWage(genderGroups[g.gender]) - overallAvgWage,
    })),
    ...byRace.map((r) => ({
      demographic: 'race',
      category: r.race,
      averageWage: calculateAverageWage(raceGroups[r.race]),
      wageGap: calculateAverageWage(raceGroups[r.race]) - overallAvgWage,
    })),
  ];

  return {
    byGender,
    byRace,
    byAge,
    byBarrier,
    placementRateByDemographic,
    wageGapAnalysis,
  };
}

/**
 * Get time series data
 */
export async function getTimeSeriesData(
  startDate: Date,
  endDate: Date,
  interval: 'day' | 'week' | 'month' = 'month'
): Promise<TimeSeriesData[]> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // This would use SQL date_trunc for efficient grouping
  // Simplified version here
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('enrolled_at, status, completion_date')
    .gte('enrolled_at', startDate.toISOString())
    .lte('enrolled_at', endDate.toISOString());

  const { data: outcomes } = await supabase
    .from('employment_outcomes')
    .select('exit_date, employed_at_exit')
    .gte('exit_date', startDate.toISOString())
    .lte('exit_date', endDate.toISOString());

  // Group by interval
  const timeSeriesMap: Record<string, TimeSeriesData> = {};

  enrollments?.forEach((e) => {
    const date = truncateDate(new Date(e.enrolled_at), interval);
    if (!timeSeriesMap[date]) {
      timeSeriesMap[date] = {
        date,
        enrollments: 0,
        completions: 0,
        placements: 0,
      };
    }
    timeSeriesMap[date].enrollments++;
    if (e.status === 'completed') {
      timeSeriesMap[date].completions++;
    }
  });

  outcomes?.forEach((o) => {
    const date = truncateDate(new Date(o.exit_date), interval);
    if (!timeSeriesMap[date]) {
      timeSeriesMap[date] = {
        date,
        enrollments: 0,
        completions: 0,
        placements: 0,
      };
    }
    if (o.employed_at_exit) {
      timeSeriesMap[date].placements++;
    }
  });

  return Object.values(timeSeriesMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

// Helper functions
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const value = String(item[key]);
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

function calculateCompletionRate(participants: any[]): number {
  const completed = participants.filter((p) =>
    p.enrollments?.some((e: any) => e.status === 'completed')
  ).length;
  return participants.length > 0 ? (completed / participants.length) * 100 : 0;
}

function calculatePlacementRate(participants: any[]): number {
  const placed = participants.filter((p) =>
    p.employment_outcomes?.some((o: any) => o.employed_at_exit)
  ).length;
  return participants.length > 0 ? (placed / participants.length) * 100 : 0;
}

function calculateAverageWage(participants: any[]): number {
  const wages = participants
    .flatMap((p) => p.employment_outcomes || [])
    .map((o: any) => o.hourly_wage)
    .filter(Boolean);
  return wages.length > 0
    ? wages.reduce((sum: number, w: number) => sum + w, 0) / wages.length
    : 0;
}

function truncateDate(date: Date, interval: 'day' | 'week' | 'month'): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  switch (interval) {
    case 'day':
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'week':
      const weekStart = new Date(date);
      weekStart.setDate(day - date.getDay());
      return weekStart.toISOString().split('T')[0];
    case 'month':
      return `${year}-${String(month + 1).padStart(2, '0')}`;
  }
}
