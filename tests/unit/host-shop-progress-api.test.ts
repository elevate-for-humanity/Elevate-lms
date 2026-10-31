import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  userId: 'owner',
  role: 'host_shop',
  preview: null as any,
  membershipRole: 'owner',
  ownerId: 'owner',
  shopPartner: 'partner',
  entries: [] as any[],
  calls: [] as any[],
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.userId ? { id: state.userId } : null } }) },
  }),
}));
vi.mock('@/lib/admin/host-shop-preview', () => ({
  resolveHostShopAdminPreview: async () => state.preview,
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from(table: string) {
      const filters: Record<string, any> = {};
      let inserted: any = null;
      const q: any = {};
      for (const op of ['select', 'eq', 'in', 'or', 'is', 'order', 'limit'])
        q[op] = (...args: any[]) => {
          state.calls.push([table, op, ...args]);
          if (op === 'eq' || op === 'in') filters[args[0]] = args[1];
          return q;
        };
      q.insert = (value: any) => {
        inserted = value;
        state.calls.push([table, 'insert', value]);
        return q;
      };
      const result = () => {
        if (table === 'profiles')
          return {
            data: Array.isArray(filters.id)
              ? filters.id.map((id: string) => ({ id, full_name: 'Assigned learner' }))
              : { id: filters.id, role: state.role },
          };
        if (table === 'partner_users')
          return {
            data: state.userId
              ? [{ partner_id: 'partner', role: state.membershipRole, status: 'active' }]
              : [],
          };
        if (table === 'shops')
          return {
            data: filters.id
              ? { owner_id: state.ownerId, partner_id: state.shopPartner, active: true }
              : filters.owner_id
                ? state.ownerId === filters.owner_id
                  ? [{ id: 'shop' }]
                  : []
                : filters.partner_id === state.shopPartner
                  ? [{ id: 'shop' }]
                  : [],
          };
        if (table === 'shop_staff') return { data: [] };
        if (table === 'partners')
          return {
            data: {
              id: 'partner',
              status: 'active',
              approval_status: 'approved',
              verification_status: 'verified',
              is_active: true,
              mou_signed: true,
              onboarding_completed: true,
            },
          };
        if (table === 'apprentice_placements')
          return {
            data: [
              {
                id: 'placement',
                shop_id: 'shop',
                student_id: 'student',
                program_slug: 'barber-apprenticeship',
                status: 'active',
                supervisor_user_id: 'different-supervisor',
              },
            ],
          };
        if (table === 'program_enrollments')
          return {
            data: [
              {
                id: 'enrollment',
                user_id: 'student',
                program_slug: 'barber-apprenticeship',
                status: 'active',
              },
            ],
          };
        if (table === 'host_shop_practical_service_entries') {
          if (inserted) {
            const saved = { ...inserted, id: 'entry' };
            state.entries.push(saved);
            inserted = null;
            return { data: { id: 'entry' } };
          }
          return {
            data: state.entries.filter((entry) => entry.enrollment_id === filters.enrollment_id),
          };
        }
        if (table === 'apprenticeship_practical_service_requirements')
          return {
            data: [
              {
                id: 'requirement',
                service_name: 'Fade',
                exercise_title: 'Fade practice',
                required_count: 2,
              },
            ],
          };
        if (table === 'host_shop_practical_service_progress')
          return { data: [{ service_name: 'Fade', recorded_count: state.entries.length }] };
        return { data: [] };
      };
      q.maybeSingle = async () => result();
      q.single = async () => result();
      q.then = (resolve: any) => resolve(result());
      return q;
    },
  }),
}));
vi.mock('@/lib/apprenticeship/runtime-context', () => ({
  resolveApprenticeshipRuntimeContext: async (_db: any, input: any) =>
    input.enrollmentId === 'enrollment'
      ? {
          enrollment: { status: 'active' },
          studentId: 'student',
          programSlug: 'barber-apprenticeship',
          placement: { id: 'placement', shop_id: 'shop', student_id: 'student' },
          contract: null,
        }
      : null,
}));
vi.mock('@/lib/apprenticeship/progress-service', () => ({
  loadRegisteredApprenticeshipProgress: vi.fn(),
}));
import { GET, POST } from '@/apps/lms/app/api/host-shop/practical-services/route';
import { GET as roster } from '@/apps/lms/app/api/host-shop/competencies/route';
const read = () =>
  GET(new NextRequest('https://app.test/api/host-shop/practical-services?enrollmentId=enrollment'));
const save = (overrides = {}) =>
  POST(
    new NextRequest('https://app.test/api/host-shop/practical-services', {
      method: 'POST',
      body: JSON.stringify({
        enrollmentId: 'enrollment',
        serviceName: 'Fade',
        subjectType: 'mannequin',
        performedOn: '2026-01-01',
        notes: 'Observed supervised practice.',
        ...overrides,
      }),
    }),
  );
beforeEach(() => {
  Object.assign(state, {
    userId: 'owner',
    role: 'host_shop',
    preview: null,
    membershipRole: 'owner',
    ownerId: 'owner',
    shopPartner: 'partner',
    entries: [],
    calls: [],
  });
});
it('persists an owner observation against the actual placement and returns its updated practice count', async () => {
  expect((await save()).status).toBe(201);
  expect(state.entries[0]).toMatchObject({
    enrollment_id: 'enrollment',
    placement_id: 'placement',
    shop_id: 'shop',
    student_id: 'student',
    mentor_user_id: 'owner',
    mentor_notes: 'Observed supervised practice.',
  });
  const data = await (await read()).json();
  expect(data.canRecord).toBe(true);
  expect(data.practice.recordedCount).toBe(1);
  expect(data.entries).toHaveLength(1);
});
it('cannot write as the student or as an unrelated shop member', async () => {
  state.userId = 'student';
  state.ownerId = 'student';
  expect((await save()).status).toBe(403);
  state.userId = 'unrelated';
  state.ownerId = 'owner';
  state.shopPartner = 'different-partner';
  expect((await save()).status).toBe(403);
  expect(state.entries).toHaveLength(0);
});
it('allows a signed, shop-scoped admin preview to read the form but never submit progress', async () => {
  state.userId = '';
  state.role = 'admin';
  state.preview = { actorId: 'admin', partnerId: 'partner' };
  const data = await (await read()).json();
  expect(data.canRecord).toBe(false);
  expect((await save()).status).toBe(403);
  expect(state.entries).toHaveLength(0);
  state.preview.partnerId = 'different-partner';
  expect((await read()).status).toBe(403);
});
it('rejects anonymous calls, unknown enrollment IDs and invalid dates without inserting', async () => {
  state.userId = '';
  expect((await read()).status).toBe(401);
  expect((await save()).status).toBe(401);
  state.userId = 'owner';
  expect((await save({ enrollmentId: 'other' })).status).toBe(403);
  expect((await save({ performedOn: '2026-02-31' })).status).toBe(400);
  expect(state.entries).toHaveLength(0);
});
it('uses active ownership when an owner also has a legacy supervisor membership', async () => {
  state.membershipRole = 'supervisor';
  const response = await roster();
  expect(response.status).toBe(200);
  expect((await response.json()).apprentices[0].enrollmentId).toBe('enrollment');
  expect(state.calls).toContainEqual(['shops', 'eq', 'owner_id', 'owner']);
  expect(state.calls).toContainEqual([
    'apprentice_placements',
    'or',
    'shop_id.in.(shop),supervisor_user_id.eq.owner',
  ]);
});
it('limits preview apprentice discovery to the signed selected partner', async () => {
  state.userId = '';
  state.role = 'admin';
  state.preview = { actorId: 'admin', partnerId: 'partner' };
  expect((await roster()).status).toBe(200);
  expect(state.calls).toContainEqual(['shops', 'eq', 'partner_id', 'partner']);
  expect(
    state.calls.some((call) => call[0] === 'shops' && call[1] === 'eq' && call[2] === 'owner_id'),
  ).toBe(false);
});

it('keeps a matching admin preview read-only even when that admin also owns the shop', async () => {
  state.userId = 'owner';
  state.role = 'admin';
  state.preview = { actorId: 'owner', partnerId: 'partner' };
  expect((await read()).status).toBe(200);
  expect((await (await read()).json()).canRecord).toBe(false);
  expect((await save()).status).toBe(403);
  expect(state.entries).toHaveLength(0);
});
