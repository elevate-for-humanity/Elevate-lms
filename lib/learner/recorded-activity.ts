export type RecordedActivity = { activity_date: string | null; created_at?: string | null; seconds_watched: number | null };

export function summarizeRecordedActivity(rows: RecordedActivity[], now = new Date()) {
  const dates = new Set<string>();
  const secondsByDate = new Map<string, number>();
  for (const row of rows) {
    const date = (row.activity_date || row.created_at || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) continue;
    dates.add(date);
    const seconds = Number(row.seconds_watched);
    secondsByDate.set(date, (secondsByDate.get(date) ?? 0) + (Number.isFinite(seconds) && seconds > 0 ? seconds : 0));
  }
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today); day.setUTCDate(day.getUTCDate() - 6 + index);
    const date = day.toISOString().slice(0, 10);
    return { date, minutes: (secondsByDate.get(date) ?? 0) / 60 };
  });
  let activeStreakDays = 0;
  const day = new Date(today);
  if (!dates.has(day.toISOString().slice(0, 10))) day.setUTCDate(day.getUTCDate() - 1);
  while (dates.has(day.toISOString().slice(0, 10))) { activeStreakDays++; day.setUTCDate(day.getUTCDate() - 1); }
  return { last7Days, activeStreakDays, averageTimePerWeekHours: last7Days.reduce((sum, day) => sum + day.minutes, 0) / 60 };
}
