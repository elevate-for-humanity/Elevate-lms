/** Shared integer-cent pricing. Provider pay is never reduced by member savings. */
export const CLEANING_MEMBERSHIP = Object.freeze({
  id: 'platinum-monthly', name: 'Platinum Cleaning Membership',
  monthlyPriceCents: 1900, discountBps: 1000, monthlySavingsCapCents: 5000,
  platformShareBps: 2500,
});
export function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
export function parseHourlyRate(value: string): number | null {
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, decimal = ''] = value.trim().split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  return cents >= 1500 && cents <= 20000 ? cents : null;
}
export function cleaningQuote(input: {
  providerHourlyCents: number; cleanerHours: number;
  member: boolean; usedSavingsCents?: number;
}) {
  const { providerHourlyCents, cleanerHours, member, usedSavingsCents = 0 } = input;
  if (!Number.isSafeInteger(providerHourlyCents) || providerHourlyCents < 1500 || providerHourlyCents > 20000)
    throw new Error('Choose an hourly rate from $15 to $200.');
  if (!Number.isFinite(cleanerHours) || cleanerHours < 2 || cleanerHours > 200 || !Number.isInteger(cleanerHours * 4))
    throw new Error('Enter 2 to 200 cleaner-hours in quarter-hour increments.');
  if (!Number.isSafeInteger(usedSavingsCents) || usedSavingsCents < 0)
    throw new Error('Invalid membership savings balance.');
  const providerPayCents = Math.round(providerHourlyCents * cleanerHours);
  const basePriceCents = Math.ceil(providerPayCents * 10000 / (10000 - CLEANING_MEMBERSHIP.platformShareBps));
  const discountCents = member ? Math.min(
    Math.floor(basePriceCents * CLEANING_MEMBERSHIP.discountBps / 10000),
    Math.max(0, CLEANING_MEMBERSHIP.monthlySavingsCapCents - usedSavingsCents),
  ) : 0;
  const customerPriceCents = basePriceCents - discountCents;
  return { providerPayCents, basePriceCents, discountCents, customerPriceCents,
    platformGrossCents: customerPriceCents - providerPayCents };
}
