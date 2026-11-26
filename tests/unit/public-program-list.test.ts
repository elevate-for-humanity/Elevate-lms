import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as programRegistry from '@/data/programs/index';
import { STATIC_PROGRAM_MAP } from '@/data/programs/index';
import { FORKLIFT_MANUFACTURING_PROGRAM } from '@/data/programs/forklift';
import { FORKLIFT_MANUFACTURING } from '@/lib/programs/forklift-manufacturing';
import { loadApplyProgramOptions, loadPublicProgramList } from '@/lib/programs/public-program-list';

const { createPublicClient } = vi.hoisted(() => ({ createPublicClient: vi.fn() }));
vi.mock('@/lib/supabase/public', () => ({ createPublicClient }));

function mockPrograms(rows: Record<string, unknown>[]) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: rows }),
  };
  const from = vi.fn().mockReturnValue(query);
  createPublicClient.mockReturnValue({ from });
  return { from, query };
}

const expectedForklift = {
  slug: 'forklift',
  title: FORKLIFT_MANUFACTURING.title,
  duration: FORKLIFT_MANUFACTURING.duration,
  credential: 'Elevate online completion record only; external credential/testing unconfirmed; practical training and workplace evaluation separate.',
  funding_eligible: false,
  funding_tier: 'self-pay',
  funding_labels: ['Self-Pay'],
  tuition: null,
  price_label: 'Contact admissions',
};

beforeEach(() => {
  createPublicClient.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('public program catalog contract', () => {
  it('static registry has programs for marketing fallback', () => {
    expect(STATIC_PROGRAM_MAP.size).toBeGreaterThanOrEqual(25);
  });

  it.each(['unavailable', 'empty'])('includes the canonical forklift inquiry option when the database is %s', async (state) => {
    if (state === 'unavailable') {
      createPublicClient.mockImplementation(() => { throw new Error('Public database unavailable'); });
    } else {
      mockPrograms([]);
    }

    const result = await loadPublicProgramList();

    expect(result.source).toBe('static-catalog');
    expect(result.programs.filter((program) => program.slug === 'forklift')).toEqual([
      expect.objectContaining(expectedForklift),
    ]);
    expect(result.programs.some((program) => program.slug === 'forklift-operator')).toBe(false);
  });

  it('uses canonical forklift details in database results and retains legacy suppression and publication filters', async () => {
    const { from, query } = mockPrograms([
      {
        slug: 'forklift',
        title: 'Legacy forklift certification',
        duration: '1 day',
        duration_weeks: 1,
        credential_name: 'Legacy certificate',
        tuition: 99,
        category: 'trades',
      },
      { slug: 'forklift-operator', title: 'Legacy forklift operator' },
      { slug: 'plumbing', title: 'Suppressed plumbing' },
      { slug: 'cna-training', title: 'Legacy CNA alias' },
    ]);

    const result = await loadPublicProgramList();

    expect(result.source).toBe('database');
    expect(result.programs.filter((program) => program.slug === 'forklift')).toEqual([
      expect.objectContaining(expectedForklift),
    ]);
    for (const slug of ['forklift-operator', 'plumbing', 'cna-training']) {
      expect(result.programs.some((program) => program.slug === slug)).toBe(false);
    }
    expect(from).toHaveBeenCalledWith('programs');
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.eq).toHaveBeenCalledWith('published', true);
    expect(query.neq).toHaveBeenCalledWith('status', 'archived');
  });

  it('does not add forklift to a populated database result that does not publish it', async () => {
    mockPrograms([{ slug: 'hvac-technician', title: 'HVAC Technician' }]);

    const result = await loadPublicProgramList();

    expect(result.source).toBe('database');
    expect(result.programs.some((program) => program.slug === 'forklift')).toBe(false);
  });

  it.each([
    { name: 'listed external credential', external: true, disclosure: 'Internal completion record only', expected: 'Documented external credential' },
    { name: 'explicit completion disclosure', external: false, disclosure: 'Internal completion record only', expected: 'Internal completion record only' },
    { name: 'no credential or disclosure', external: false, disclosure: undefined, expected: null },
    { name: 'blank disclosure', external: false, disclosure: '   ', expected: null },
  ])('uses $name without interpreting a funding badge as a credential', async ({ external, disclosure, expected }) => {
    const slug = 'catalog-credential-fixture';
    mockPrograms([{ slug, title: 'Catalog fixture' }]);
    vi.spyOn(programRegistry, 'getStaticProgram').mockReturnValue({
      ...FORKLIFT_MANUFACTURING_PROGRAM,
      slug,
      credentials: external ? [{ name: 'Documented external credential', issuer: 'Fixture issuer', description: 'Fixture credential' }] : [],
      completionDisclosure: disclosure,
      badge: 'Self-Pay Program',
    });

    const result = await loadPublicProgramList();

    expect(result.programs.find((program) => program.slug === slug)?.credential).toBe(expected);
  });

  it.each(['database', 'static-catalog'])('offers forklift for inquiries without workforce funding in the %s path', async (source) => {
    mockPrograms(source === 'database' ? [{ slug: 'forklift', title: 'Forklift' }] : []);

    const result = await loadApplyProgramOptions();

    expect(result.source).toBe(source);
    expect(result.options.find((program) => program.slug === 'forklift')).toEqual({
      id: 'forklift',
      slug: 'forklift',
      title: FORKLIFT_MANUFACTURING.title,
      fundingTier: 'self-pay',
      wioaEligible: false,
      wrgEligible: false,
      topJobsStars: null,
    });
  });
});
