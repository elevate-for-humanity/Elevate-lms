import { describe, expect, it } from 'vitest';
import {
  getCanonicalPublicProgramSlug,
  getPublicProgramCategoryLabel,
  PUBLIC_PROGRAM_ALIASES,
} from '../../lib/programs/public-programs-page';

describe('public program canonicalization', () => {
  it('consolidates duplicate business pathway slugs to the detail-route canonical slug', () => {
    expect(getCanonicalPublicProgramSlug('business')).toBe('business');
    expect(getCanonicalPublicProgramSlug('business-administration')).toBe('business');
    expect(getCanonicalPublicProgramSlug('business-operations')).toBe('business');
    expect(getCanonicalPublicProgramSlug('entrepreneurship')).toBe('business-startup');
    expect(getCanonicalPublicProgramSlug('entrepreneurship-small-business')).toBe('business-startup');
  });

  it('preserves richer static public program ownership before thin registry aliases', () => {
    expect(getCanonicalPublicProgramSlug('nail-technician-apprenticeship')).toBe(
      'nail-technician-apprenticeship',
    );
  });

  it('consolidates bookkeeping variants without merging financial literacy', () => {
    expect(getCanonicalPublicProgramSlug('bookkeeping-fundamentals')).toBe('bookkeeping');
    expect(getCanonicalPublicProgramSlug('finance-bookkeeping-accounting')).toBe('bookkeeping');
    expect(getCanonicalPublicProgramSlug('financial-literacy')).toBe('financial-literacy');
  });

  it('never emits known detail-route aliases from public catalog canonicalization', () => {
    expect(getCanonicalPublicProgramSlug('it-support-specialist')).toBe('it-help-desk');
    expect(getCanonicalPublicProgramSlug('forklift-operator')).toBe('forklift');
    expect(getCanonicalPublicProgramSlug('peer-support')).toBe('peer-recovery-specialist');
    expect(getCanonicalPublicProgramSlug('recovery-coach')).toBe('peer-recovery-specialist');
  });

  it('keeps public consolidation aliases explicit and deterministic', () => {
    expect(PUBLIC_PROGRAM_ALIASES['customer-service-pro']).toBe('customer-service-representative');
    expect(PUBLIC_PROGRAM_ALIASES['it-support-specialist']).toBe('it-help-desk');
    expect(PUBLIC_PROGRAM_ALIASES['forklift-operator']).toBe('forklift');
  });

  it('normalizes public category labels', () => {
    expect(getPublicProgramCategoryLabel('business')).toBe('Business & Financial');
    expect(getPublicProgramCategoryLabel('trades')).toBe('Skilled Trades');
    expect(getPublicProgramCategoryLabel('technology')).toBe('Technology');
    expect(getPublicProgramCategoryLabel('healthcare')).toBe('Healthcare');
  });
});
