/**
 * B: PIRL export — quarter parsing, value transforms, route validation
 *
 * Extracted from:
 *   tools/wioa/supabase_adapter.ts  (parseQuarter, genderCode, raceFlags,
 *                                    employmentCode, boolTo019, boolTo01)
 *   app/api/admin/wioa/pirl-export/route.ts  (QUARTER_RE, fiscalYear)
 *   components/admin/wioa/PirlExportPanel.tsx (currentQuarter, quarterOptions)
 */

import { describe, it, expect } from 'vitest';

// ── Extracted: parseQuarter ───────────────────────────────────────────────────

type Quarter = `${number}Q${1 | 2 | 3 | 4}`;

function parseQuarter(q: string): { start: string; end: string } {
  const match = q.match(/^(\d{4})Q([1-4])$/);
  if (!match) throw new Error(`Invalid quarter format: ${q}`);
  const year = Number(match[1]);
  const qn = Number(match[2]);
  const monthStart = (qn - 1) * 3 + 1;
  const monthEnd = qn * 3;
  const lastDay = new Date(year, monthEnd, 0).getDate();
  return {
    start: `${year}-${String(monthStart).padStart(2, '0')}-01`,
    end:   `${year}-${String(monthEnd).padStart(2, '0')}-${lastDay}`,
  };
}

// ── Extracted: QUARTER_RE + fiscalYear from route ────────────────────────────

const QUARTER_RE = /^\d{4}Q[1-4]$/;

function fiscalYearFromQuarter(q: string): number {
  return parseInt(q.slice(0, 4), 10);
}

// ── Extracted: currentQuarter + quarterOptions from PirlExportPanel ──────────

function currentQuarter(now = new Date()): string {
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}Q${q}`;
}

function quarterOptions(now = new Date()): string[] {
  const opts: string[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) {
    for (let q = 4; q >= 1; q--) {
      if (y === now.getFullYear() && q > Math.ceil((now.getMonth() + 1) / 3)) continue;
      opts.push(`${y}Q${q}`);
    }
  }
  return opts;
}

// ── Extracted: PIRL value transforms ─────────────────────────────────────────

function genderCode(g: string | null): number | null {
  if (!g) return null;
  const l = g.toLowerCase();
  if (l === 'male' || l === 'm') return 1;
  if (l === 'female' || l === 'f') return 2;
  return null;
}

function raceFlags(re: string | null): Record<string, number> {
  const r: Record<string, number> = { '201':0,'202':0,'203':0,'204':0,'205':0,'206':0 };
  if (!re) return r;
  const l = re.toLowerCase();
  if (l.includes('hispanic') || l.includes('latino'))              r['201'] = 1;
  if (l.includes('american indian') || l.includes('alaska native')) r['202'] = 1;
  if (l.includes('asian'))                                          r['203'] = 1;
  if (l.includes('black') || l.includes('african american'))        r['204'] = 1;
  if (l.includes('native hawaiian') || l.includes('pacific islander')) r['205'] = 1;
  if (l.includes('white') || l.includes('caucasian'))               r['206'] = 1;
  return r;
}

function employmentCode(s: string | null): number | null {
  if (!s) return null;
  const l = s.toLowerCase();
  if (l.includes('employed') && !l.includes('not') && !l.includes('un')) return 1;
  if (l.includes('unemployed') || l.includes('not employed')) return 3;
  return null;
}

function boolTo019(v: boolean | null | undefined): number {
  if (v === true)  return 1;
  if (v === false) return 0;
  return 9;
}

function boolTo01(v: boolean | null | undefined): number {
  return v === true ? 1 : 0;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PIRL quarter parsing', () => {
  it('parses Q1 correctly', () => {
    const r = parseQuarter('2025Q1');
    expect(r.start).toBe('2025-01-01');
    expect(r.end).toBe('2025-03-31');
  });

  it('parses Q2 correctly', () => {
    const r = parseQuarter('2025Q2');
    expect(r.start).toBe('2025-04-01');
    expect(r.end).toBe('2025-06-30');
  });

  it('parses Q3 correctly', () => {
    const r = parseQuarter('2025Q3');
    expect(r.start).toBe('2025-07-01');
    expect(r.end).toBe('2025-09-30');
  });

  it('parses Q4 correctly', () => {
    const r = parseQuarter('2025Q4');
    expect(r.start).toBe('2025-10-01');
    expect(r.end).toBe('2025-12-31');
  });

  it('handles leap year Q1 correctly', () => {
    const r = parseQuarter('2024Q1');
    expect(r.end).toBe('2024-03-31');
  });

  it('throws on invalid format', () => {
    expect(() => parseQuarter('2025-Q1')).toThrow('Invalid quarter format');
    expect(() => parseQuarter('Q12025')).toThrow('Invalid quarter format');
    expect(() => parseQuarter('2025Q5')).toThrow('Invalid quarter format');
    expect(() => parseQuarter('')).toThrow('Invalid quarter format');
  });
});

describe('QUARTER_RE validation', () => {
  it('accepts valid quarters', () => {
    expect(QUARTER_RE.test('2025Q1')).toBe(true);
    expect(QUARTER_RE.test('2025Q4')).toBe(true);
    expect(QUARTER_RE.test('2026Q2')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(QUARTER_RE.test('2025Q5')).toBe(false);
    expect(QUARTER_RE.test('2025Q0')).toBe(false);
    expect(QUARTER_RE.test('25Q1')).toBe(false);
    expect(QUARTER_RE.test('2025-Q1')).toBe(false);
    expect(QUARTER_RE.test('')).toBe(false);
  });
});

describe('fiscalYearFromQuarter', () => {
  it('extracts year correctly', () => {
    expect(fiscalYearFromQuarter('2025Q3')).toBe(2025);
    expect(fiscalYearFromQuarter('2026Q1')).toBe(2026);
  });
});

describe('currentQuarter', () => {
  it('returns Q1 for January', () => {
    expect(currentQuarter(new Date('2025-01-15'))).toBe('2025Q1');
  });

  it('returns Q2 for April', () => {
    expect(currentQuarter(new Date('2025-04-01'))).toBe('2025Q2');
  });

  it('returns Q3 for July', () => {
    expect(currentQuarter(new Date('2025-07-31'))).toBe('2025Q3');
  });

  it('returns Q4 for October', () => {
    expect(currentQuarter(new Date('2025-10-01'))).toBe('2025Q4');
  });

  it('returns Q4 for December', () => {
    expect(currentQuarter(new Date('2025-12-31'))).toBe('2025Q4');
  });
});

describe('quarterOptions', () => {
  it('includes current quarter', () => {
    const now = new Date('2025-07-15'); // Q3
    const opts = quarterOptions(now);
    expect(opts).toContain('2025Q3');
  });

  it('does not include future quarters', () => {
    const now = new Date('2025-07-15'); // Q3
    const opts = quarterOptions(now);
    expect(opts).not.toContain('2025Q4');
  });

  it('includes past quarters going back 2 years', () => {
    const now = new Date('2025-07-15');
    const opts = quarterOptions(now);
    expect(opts).toContain('2023Q1');
    expect(opts).toContain('2024Q4');
  });

  it('returns quarters in descending order', () => {
    const now = new Date('2025-07-15');
    const opts = quarterOptions(now);
    expect(opts[0]).toBe('2025Q3');
    expect(opts[1]).toBe('2025Q2');
    expect(opts[2]).toBe('2025Q1');
  });

  it('produces only valid quarter strings', () => {
    const opts = quarterOptions(new Date('2025-12-31'));
    for (const q of opts) {
      expect(QUARTER_RE.test(q)).toBe(true);
    }
  });
});

describe('PIRL value transforms', () => {
  describe('genderCode', () => {
    it('maps male → 1', () => {
      expect(genderCode('male')).toBe(1);
      expect(genderCode('Male')).toBe(1);
      expect(genderCode('m')).toBe(1);
    });

    it('maps female → 2', () => {
      expect(genderCode('female')).toBe(2);
      expect(genderCode('Female')).toBe(2);
      expect(genderCode('f')).toBe(2);
    });

    it('returns null for unknown or null', () => {
      expect(genderCode(null)).toBeNull();
      expect(genderCode('nonbinary')).toBeNull();
      expect(genderCode('')).toBeNull();
    });
  });

  describe('raceFlags', () => {
    it('sets Hispanic flag for hispanic', () => {
      expect(raceFlags('Hispanic')['201']).toBe(1);
    });

    it('sets Black flag for African American', () => {
      expect(raceFlags('Black or African American')['204']).toBe(1);
    });

    it('sets White flag for caucasian', () => {
      expect(raceFlags('White / Caucasian')['206']).toBe(1);
    });

    it('returns all zeros for null', () => {
      const r = raceFlags(null);
      expect(Object.values(r).every(v => v === 0)).toBe(true);
    });

    it('can set multiple flags for multiracial', () => {
      const r = raceFlags('Black and White');
      expect(r['204']).toBe(1);
      expect(r['206']).toBe(1);
    });

    it('always returns all 6 element keys', () => {
      const r = raceFlags('Asian');
      expect(Object.keys(r)).toEqual(['201','202','203','204','205','206']);
    });
  });

  describe('employmentCode', () => {
    it('maps employed → 1', () => {
      expect(employmentCode('Employed full-time')).toBe(1);
      expect(employmentCode('employed part-time')).toBe(1);
    });

    it('maps unemployed → 3', () => {
      expect(employmentCode('Unemployed')).toBe(3);
      expect(employmentCode('not employed')).toBe(3);
    });

    it('returns null for null or unknown', () => {
      expect(employmentCode(null)).toBeNull();
      expect(employmentCode('retired')).toBeNull();
    });
  });

  describe('boolTo019', () => {
    it('true → 1', () => expect(boolTo019(true)).toBe(1));
    it('false → 0', () => expect(boolTo019(false)).toBe(0));
    it('null → 9 (unknown)', () => expect(boolTo019(null)).toBe(9));
    it('undefined → 9 (unknown)', () => expect(boolTo019(undefined)).toBe(9));
  });

  describe('boolTo01', () => {
    it('true → 1', () => expect(boolTo01(true)).toBe(1));
    it('false → 0', () => expect(boolTo01(false)).toBe(0));
    it('null → 0', () => expect(boolTo01(null)).toBe(0));
    it('undefined → 0', () => expect(boolTo01(undefined)).toBe(0));
  });
});
