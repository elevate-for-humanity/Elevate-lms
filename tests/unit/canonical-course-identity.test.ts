import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveCourseProgramSlug } from '@/lib/ultimate-course-builder/core/course-program-identity';
function db(result: unknown) {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue(result) };
  return { client: { from: vi.fn(() => query) } as unknown as SupabaseClient, query };
}
describe('course program authority', () => {
  it('uses the program relationship for a dated course URL', async () => {
    const { client, query } = db({ data: { slug: 'barber-apprenticeship' }, error: null });
    expect(await resolveCourseProgramSlug(client, { slug: 'barber-october-2026', program_id: 'barber-id' })).toBe('barber-apprenticeship');
    expect(query.eq).toHaveBeenCalledWith('id', 'barber-id');
  });
  it('accepts a historical program input only when it resolves to the same authority', async () => {
    const { client } = db({ data: { slug: 'esthetician-apprenticeship' }, error: null });
    expect(await resolveCourseProgramSlug(client, { program_id: 'beauty-id' }, 'esthetician')).toBe('esthetician-apprenticeship');
    await expect(resolveCourseProgramSlug(client, { program_id: 'beauty-id' }, 'barber-apprenticeship')).rejects.toThrow('COURSE_PROGRAM_IDENTITY_MISMATCH');
  });
  it('does not downgrade to a course slug when the program lookup fails', async () => {
    const error = new Error('DATABASE_OFFLINE');
    const { client } = db({ data: null, error });
    await expect(resolveCourseProgramSlug(client, { slug: 'barber-october', program_id: 'barber-id' })).rejects.toBe(error);
  });
});
