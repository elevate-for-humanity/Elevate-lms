export type BillingCadence = 'weekly' | 'monthly' | 'quarterly' | 'annual';

export function nextInvoiceDate(current: string, cadence: BillingCadence): string {
  const [year, month, day] = current.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (cadence === 'weekly') date.setUTCDate(date.getUTCDate() + 7);
  if (cadence !== 'weekly') {
    const months = cadence === 'monthly' ? 1 : cadence === 'quarterly' ? 3 : 12;
    const targetMonth = month - 1 + months;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = targetMonth % 12;
    const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
    date.setTime(Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay)));
  }
  return date.toISOString().slice(0, 10);
}
