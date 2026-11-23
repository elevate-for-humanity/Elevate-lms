import { describe, expect, it } from 'vitest';
import { CLEANING_MEMBERSHIP, cleaningQuote, parseHourlyRate } from '@/lib/cleaning/pricing';

describe('cleaning pricing', () => {
  it('parses money exactly and rejects unsupported inputs', () => {
    expect(parseHourlyRate('30.01')).toBe(3001);
    for (const value of ['-30','1e2','30.001','Infinity','14.99','200.01','']) expect(parseHourlyRate(value)).toBeNull();
  });
  it('protects provider pay and uses a margin rather than a markup', () => {
    expect(cleaningQuote({ providerHourlyCents: 3000, cleanerHours: 3, member: false })).toEqual({
      providerPayCents: 9000, basePriceCents: 12000, discountCents: 0, customerPriceCents: 12000, platformGrossCents: 3000,
    });
    const member = cleaningQuote({ providerHourlyCents: 3000, cleanerHours: 3, member: true });
    expect(member.providerPayCents).toBe(9000);
    expect(member.customerPriceCents).toBe(10800);
    expect(member.platformGrossCents).toBe(1800);
  });
  it('caps savings across bookings and never grants a negative discount', () => {
    expect(cleaningQuote({ providerHourlyCents: 3000, cleanerHours: 3, member: true, usedSavingsCents: 4900 }).discountCents).toBe(100);
    expect(cleaningQuote({ providerHourlyCents: 3000, cleanerHours: 3, member: true, usedSavingsCents: 7000 }).discountCents).toBe(0);
  });
  it('counts total labor hours, not elapsed crew time', () => {
    expect(cleaningQuote({ providerHourlyCents: 3000, cleanerHours: 6, member: false }).providerPayCents).toBe(18000);
  });
  it('rounds in cents without underpaying or overspending the cap', () => {
    const quote = cleaningQuote({ providerHourlyCents: 3001, cleanerHours: 2.25, member: true });
    expect(quote.providerPayCents).toBe(6752);
    expect(quote.customerPriceCents + quote.discountCents).toBe(quote.basePriceCents);
    expect(quote.platformGrossCents).toBeGreaterThanOrEqual(0);
  });
  it('rejects invalid hours, cents and savings inputs', () => {
    for (const hours of [NaN,Infinity,0,1,2.1,201]) expect(() => cleaningQuote({ providerHourlyCents: 3000, cleanerHours: hours, member: false })).toThrow();
    expect(() => cleaningQuote({ providerHourlyCents: 3000.1, cleanerHours: 3, member: false })).toThrow();
    expect(() => cleaningQuote({ providerHourlyCents: 3000, cleanerHours: 3, member: true, usedSavingsCents: -1 })).toThrow();
  });
  it('uses the corrected owner-approved membership economics', () => {
    expect(CLEANING_MEMBERSHIP.monthlyPriceCents).toBe(1900);
    expect(CLEANING_MEMBERSHIP.monthlySavingsCapCents).toBe(5000);
    expect(CLEANING_MEMBERSHIP.discountBps).toBe(1000);
  });
});
