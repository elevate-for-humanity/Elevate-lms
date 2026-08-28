import { beforeEach, describe, expect, it, vi } from 'vitest';

const getRAGContext = vi.fn();

vi.mock('@/lib/platform/rag', () => ({ getRAGContext }));
vi.mock('@/lib/industry/onet', () => ({
  isOnetConfigured: () => false,
  fetchOnetOccupation: vi.fn(),
}));
vi.mock('@/lib/industry/careeronestop', () => ({
  isCareerOneStopConfigured: () => false,
  fetchCareerOneStopData: vi.fn(),
}));

describe('Course Factory evidence RAG integration', () => {
  beforeEach(() => getRAGContext.mockReset());

  it('invokes canonical Supabase RAG and carries the result into standards evidence', async () => {
    getRAGContext.mockResolvedValue('Retrieved barber sanitation authority');
    const { buildCourseEvidenceContext } = await import('@/lib/course-factory/evidence-context');
    const evidence = await buildCourseEvidenceContext({
      programSlug: 'barber-apprenticeship',
      state: 'IN',
      blueprint: {
        programSlug: 'barber-apprenticeship',
        credentialTitle: 'Barber Apprenticeship',
        credentialCode: 'BARBER',
        state: 'IN',
        version: 'test-version',
        title: 'Barber Apprenticeship',
        modules: [{
          slug: 'infection-control',
          title: 'Infection Control',
          order: 1,
          domainKey: 'infection_control',
          lessons: [],
          competencies: [{ competencyKey: 'sanitize-tools', title: 'Sanitize tools', description: 'Apply infection-control procedures' }],
        }],
      } as any,
    });

    expect(getRAGContext).toHaveBeenCalledOnce();
    expect(getRAGContext.mock.calls[0]?.[0]).toContain('barber-apprenticeship');
    expect(evidence.sources).toContain('Supabase-pgvector-RAG');
    expect(evidence.standardsBlock).toContain('Retrieved barber sanitation authority');
  });

  it('records an actionable warning when retrieval returns no evidence', async () => {
    getRAGContext.mockResolvedValue('');
    const { buildCourseEvidenceContext } = await import('@/lib/course-factory/evidence-context');
    const evidence = await buildCourseEvidenceContext({
      programSlug: 'barber-apprenticeship',
      blueprint: {
        programSlug: 'barber-apprenticeship', credentialTitle: 'Barber', credentialCode: 'BARBER',
        state: 'IN', version: 'test-version', title: 'Barber', modules: [],
      } as any,
    });
    expect(evidence.warnings).toContain('Supabase RAG returned no evidence for this course build');
  });
});
