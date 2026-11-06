import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const state = vi.hoisted(() => ({ fail: '', tables: {} as Record<string, any[]> }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'learner' } } }) },
  }),
}));
vi.mock('@/lib/admin/portal-preview', () => ({
  resolvePortalPreviewSubject: async () => ({ userId: 'learner', previewing: false }),
}));
vi.mock('@/lib/portal/resolve-apprentice-program', () => ({
  resolveApprenticeProgramSlug: async () => 'barber-apprenticeship',
}));
vi.mock('@/lib/billing/apprentice-invoice-batch', () => ({
  getApprenticeBillingAccess: async () => ({ invoices: [] }),
}));
vi.mock('@/lib/billing/learner-billing-requirement', () => ({
  loadLearnerBillingRequirement: async () => ({ required: false }),
}));
vi.mock('@/components/learner/MandatoryBillingSetup', () => ({
  MandatoryBillingSetup: () => null,
}));
vi.mock('@/components/learner/BillingCard', () => ({
  default: ({ billing }: any) => <div>Recorded balance: {billing.remainingBalance}</div>,
}));
vi.mock('@/components/payments/AffirmInvoiceButton', () => ({ AffirmInvoiceButton: () => null }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from(table: string) {
      const q: any = {};
      q.select = (columns: string) => {
        if (table === 'barber_subscriptions' && columns.split(',').includes('next_payment_date'))
          throw new Error('column does not exist');
        return q;
      };
      for (const op of ['eq', 'order', 'limit']) q[op] = () => q;
      q.maybeSingle = async () => ({
        data: state.tables[table]?.[0] || null,
        error: table === state.fail ? new Error('Database unavailable') : null,
      });
      return q;
    },
  }),
}));
import ApprenticeBillingPage from '@/apps/lms/app/apprentice/billing/page';
beforeEach(() => {
  state.fail = '';
  state.tables = { barber_subscriptions: [{ remaining_balance: 75000, fully_paid: false }] };
});
it('renders an existing barber account using columns present in production', async () => {
  const html = renderToStaticMarkup(await ApprenticeBillingPage());
  expect(html).toContain('Recorded balance: 750');
  expect(html).not.toContain('No barber tuition account');
});
it.each(['barber_subscriptions', 'billing_migration_authorizations', 'billing_schedules'])(
  'does not turn a %s query failure into missing billing evidence',
  async (table) => {
    state.fail = table;
    state.tables.billing_migration_authorizations = [{ billing_schedule_id: 'schedule' }];
    await expect(ApprenticeBillingPage()).rejects.toThrow('Database unavailable');
  },
);
