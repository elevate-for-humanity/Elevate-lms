import { describe, expect, it, vi } from 'vitest';
const load = vi.hoisted(() => vi.fn());
vi.mock('@/lib/programs/getProgramBySlug', () => ({ getPublishedProgramBySlug: load }));
import { getProgramBySlug } from '@/lib/programs/get-program';

describe('program source consolidation', () => {
  it('loads the complete registered program for older esthetics names', async () => {
    const program = await getProgramBySlug('esthetician');
    expect(program?.slug).toBe('esthetician-apprenticeship');
    expect(program?.curriculum.length).toBeGreaterThan(0);
    expect(program?.cta.applyHref).toBeTruthy();
  });
  it('retains database-managed CTAs without replacing actual curriculum with empty arrays', async () => {
    load.mockResolvedValue({ program_ctas: [{ cta_type: 'apply', href: '/apply?program=hvac-technician&source=verified' }] });
    const program = await getProgramBySlug('hvac');
    expect(load).toHaveBeenCalledWith('hvac-technician');
    expect(program?.cta.applyHref).toContain('source=verified');
    expect(program?.curriculum.length).toBeGreaterThan(0);
  });
  it('keeps withdrawn programs closed', async () => {
    expect(await getProgramBySlug('bookkeeping-fundamentals')).toBeNull();
  });
});
