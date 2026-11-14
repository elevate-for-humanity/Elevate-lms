import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ failed: '' }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: async () => ({ id: 'admin', error: null }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => {
  const q: any = { select: () => q, gte: () => q, lte: () => q, eq: () => q, order: () => q,
    then: (resolve: (value: unknown) => unknown) => {
      const rows: Record<string, unknown[]> = {
        program_enrollments: [{ id: 'enrollment', status: 'completed', program_id: 'program' }],
        certificates: [{ id: 'credential' }], hour_entries: [{ accepted_hours: 12 }], programs: [{ id: 'program', name: 'Training' }],
      };
      return Promise.resolve({ data: rows[table] ?? [], error: state.failed === table ? { message: 'Unavailable' } : null }).then(resolve);
    },
  }; return q;
} }) }));
import { GET } from '@/apps/admin/app/api/admin/grant-report/export/route';
const request = () => new NextRequest('https://admin.example.test/api/admin/grant-report/export?format=json&from=2026-10-01&to=2026-10-27');
beforeEach(() => { state.failed = ''; });
it('reports totals from all required sources', async () => {
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ summary: { total_enrollments: 1, completed_programs: 1, credentials_issued: 1, approved_training_hours: 12, active_programs: 1 } });
});
it.each(['program_enrollments', 'certificates', 'program_completion_certificates', 'hour_entries', 'programs'])('rejects an incomplete export when %s fails', async table => {
  state.failed = table;
  const response = await GET(request());
  expect(response.status).toBe(500);
  expect(await response.json()).not.toHaveProperty('summary');
});
