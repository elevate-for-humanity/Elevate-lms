import { describe, expect, it } from 'vitest';
import {
  mapProgramsRowToCatalog,
  mapProgramsRowToListing,
} from '@/lib/programs/load-program-catalog';
import {
  normalizeProgramSectionKey,
  resolveCredentialLabel,
} from '@/lib/programs/category-normalize';

describe('resolveCredentialLabel', () => {
  it('prefers credential_name over credential_type', () => {
    expect(
      resolveCredentialLabel({
        credential_name: 'EPA 608 Universal',
        credential_type: 'certification',
      }),
    ).toBe('EPA 608 Universal');
  });

  it('falls back to credential_type', () => {
    expect(resolveCredentialLabel({ credential_name: null, credential_type: 'License' })).toBe(
      'License',
    );
  });
});

describe('normalizeProgramSectionKey', () => {
  it('maps Skilled Trades to trades section', () => {
    expect(normalizeProgramSectionKey('Skilled Trades')).toBe('trades');
  });

  it('maps Healthcare to healthcare', () => {
    expect(normalizeProgramSectionKey('Healthcare')).toBe('healthcare');
  });
});

describe('mapProgramsRowToCatalog', () => {
  it('maps wioa_approved to wioa_eligible for API consumers', () => {
    const row = mapProgramsRowToCatalog({
      id: 'p1',
      slug: 'hvac-technician',
      title: 'HVAC Technician',
      category: 'Skilled Trades',
      wioa_approved: true,
      credential_name: 'EPA 608',
      funding_tags: ['WIOA'],
    });
    expect(row.wioa_eligible).toBe(true);
    expect(row.credential_name).toBe('EPA 608');
    expect(row.program_id).toBe('p1');
  });
});

describe('mapProgramsRowToListing', () => {
  it('exposes credential from credential_name when type is empty', () => {
    const item = mapProgramsRowToListing({
      id: 'p2',
      slug: 'cna-cert',
      title: 'CNA',
      category: 'Healthcare',
      credential_name: 'Indiana CNA',
      wioa_approved: false,
    });
    expect(item.credential).toBe('Indiana CNA');
    expect(item.sectionKey).toBe('healthcare');
  });
});
