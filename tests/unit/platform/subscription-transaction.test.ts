// @vitest-environment node
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCourseBuilderCreditBalance,
  reserveCourseBuilderCredits,
  refundCourseBuilderCredits,
} from '@/lib/course-builder/credits';
import { fulfillPaidBillingInvoice } from '@/lib/billing/fulfillment';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { withLicense } from '@/lib/middleware/withLicense';
import { NextRequest } from 'next/server';
import { subscriptionTestClient } from './subscription-test-client';
vi.mock('@/lib/platform/orchestration/events', () => ({
  PlatformEventType: { ENTITLEMENT_REFRESHED: 'entitlement.refreshed' },
  emitPlatformEvent: async () => {},
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => client,
  createAdminClient: () => client,
}));
vi.mock('@/lib/audit-context', () => ({ setAuditContext: async () => {} }));
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { BASE_PLANS, ADD_ON_MARKETPLACE, licenseTierForPlan } from '@/lib/store/platform-pricing';
import { checkLicenseAccess } from '@/lib/licensing/billing-authority';
import { normalizeAddonCode, PLAN_LIMITS_FALLBACK } from '@/lib/platform/feature-catalog';

const tenant = '11111111-1111-4111-8111-111111111111';
const organization = '22222222-2222-4222-8222-222222222222';
const otherTenant = '33333333-3333-4333-8333-333333333333';
const otherOrganization = '44444444-4444-4444-8444-444444444444';
let db: PGlite;
const client = subscriptionTestClient(() => db);
const periodStart = new Date();
periodStart.setUTCDate(1);
periodStart.setUTCHours(0, 0, 0, 0);
const periodEnd = new Date(periodStart);
periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1);
const publicAddons = ADD_ON_MARKETPLACE.filter((a) => !a.hiddenFromMarketplace);
const schema = `
CREATE SCHEMA auth; CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT 'service_role'::text $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$; CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE TABLE tenants(id uuid PRIMARY KEY);
CREATE TABLE organizations(id uuid PRIMARY KEY, tenant_id uuid REFERENCES tenants,contact_email text);
CREATE TABLE subscription_plans(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text UNIQUE,name text,active boolean,limits jsonb);
CREATE TABLE features(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),code text UNIQUE);
CREATE TABLE plan_features(plan_id uuid REFERENCES subscription_plans,feature_id uuid REFERENCES features);
CREATE TABLE saas_addon_catalog(code text PRIMARY KEY,monthly_price numeric,active boolean,feature_codes text[]);
CREATE TABLE organization_subscriptions(organization_id uuid UNIQUE REFERENCES organizations,plan_id uuid REFERENCES subscription_plans,
 plan_type text,billing_interval text CHECK(billing_interval IN ('month','year')),status text,billing_provider text,
 provider_subscription_id text,provider_customer_id text,current_period_start timestamptz,current_period_end timestamptz,
 cancel_at_period_end boolean,canceled_at timestamptz,metadata jsonb,updated_at timestamptz);
CREATE TABLE addon_subscriptions(organization_id uuid REFERENCES tenants,addon_code text REFERENCES saas_addon_catalog,
 monthly_price numeric,active boolean,activated_at timestamptz DEFAULT now(),canceled_at timestamptz,updated_at timestamptz,
 UNIQUE(organization_id,addon_code));
CREATE TABLE organization_addons(tenant_id uuid REFERENCES tenants,addon_slug text,status text,
 activated_at timestamptz DEFAULT now(),canceled_at timestamptz,updated_at timestamptz,UNIQUE(tenant_id,addon_slug));
CREATE TABLE profiles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,email text,role text);
CREATE TABLE licenses(id uuid DEFAULT gen_random_uuid(),max_deployments int DEFAULT 1,stripe_subscription_id text,stripe_customer_id text,tenant_id uuid REFERENCES tenants,organization_id uuid REFERENCES organizations,expires_at timestamptz,ends_at timestamptz,suspended_at timestamptz,canceled_at timestamptz,license_key text,customer_email text NOT NULL,tier text,status text,features text[],
 max_users int,billing_provider text CHECK(billing_provider IN ('quickbooks','stripe')),provider_subscription_id text,
 provider_customer_id text,current_period_end timestamptz,metadata jsonb,updated_at timestamptz);
`;
async function apply(
  plan = 'business',
  addons: string[] = [],
  options: Record<string, unknown> = {},
) {
  const o = {
    tenant,
    organization,
    interval: 'month',
    provider: 'quickbooks',
    status: 'active',
    deliveryKey: null,
    email: 'buyer@example.test',
    ...options,
  };
  return db.query(
    `SELECT public.apply_platform_subscription($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      o.tenant,
      o.organization,
      plan,
      o.interval,
      o.provider,
      'subscription-123',
      'customer-123',
      periodStart.toISOString(),
      periodEnd.toISOString(),
      addons,
      licenseTierForPlan(
        plan as keyof typeof BASE_PLANS,
        o.interval === 'year' ? 'annual' : 'monthly',
      ),
      o.email,
      o.status,
      false,
      o.deliveryKey,
    ],
  );
}
async function snapshot() {
  return Promise.all(
    ['organization_subscriptions', 'addon_subscriptions', 'organization_addons', 'licenses'].map(
      async (table) => (await db.query(`SELECT * FROM ${table} ORDER BY 1,2`)).rows,
    ),
  );
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(schema);
  for (const plan of Object.values(BASE_PLANS)) {
    const row = await db.query<{ id: string }>(
      `INSERT INTO subscription_plans(slug,name,active,limits) VALUES($1,$2,true,$3) RETURNING id`,
      [plan.id, plan.name, JSON.stringify(PLAN_LIMITS_FALLBACK[plan.id])],
    );
    for (const feature of plan.features) {
      await db.query(`INSERT INTO features(code) VALUES($1) ON CONFLICT DO NOTHING`, [feature]);
      await db.query(`INSERT INTO plan_features SELECT $1,id FROM features WHERE code=$2`, [
        row.rows[0].id,
        feature,
      ]);
    }
  }
  for (const a of publicAddons)
    await db.query(`INSERT INTO saas_addon_catalog VALUES($1,$2,true,$3)`, [
      normalizeAddonCode(a.slug),
      a.priceMonthly,
      a.features,
    ]);
  await db.exec(
    readFileSync('supabase/migrations/20260825124500_tenant_course_builder_credits.sql', 'utf8'),
  );
  await db.exec(
    readFileSync(
      'supabase/migrations/20261031165408_atomic_platform_subscription_delivery.sql',
      'utf8',
    ),
  );
  await db.query(`INSERT INTO tenants VALUES($1),($2)`, [tenant, otherTenant]);
  await db.query(`INSERT INTO organizations(id,tenant_id) VALUES($1,$2),($3,$4)`, [
    organization,
    tenant,
    otherOrganization,
    otherTenant,
  ]);
}, 60000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec(
    'TRUNCATE tenant_course_builder_credit_ledger,tenant_course_builder_credit_wallets,platform_subscription_deliveries,organization_subscriptions,addon_subscriptions,organization_addons,licenses,profiles',
  );
});
describe('Atomic Store subscription delivery against PostgreSQL', () => {
  for (const plan of Object.values(BASE_PLANS))
    for (const interval of ['month', 'year'])
      it(`delivers ${plan.id} ${interval} with its advertised capabilities and limits`, async () => {
        await apply(plan.id, [], { interval });
        const license = (await db.query<any>('SELECT * FROM licenses')).rows[0];
        expect(license.tenant_id).toBe(tenant);
        expect(license.features.sort()).toEqual([...plan.features].sort());
        expect(license.max_users).toBe(plan.maxUsers);
        expect(license.metadata.limits.contacts).toBe(plan.maxContacts);
        expect(license.billing_provider).toBe('quickbooks');
        expect(checkLicenseAccess({ ...license, stripe_subscription_id: null }).hasAccess).toBe(
          true,
        );
        expect(license.organization_id).toBe(organization);
        expect(license.expires_at).toEqual(license.current_period_end);
      });
  for (const addon of publicAddons)
    it(`delivers ${addon.slug} to the purchasing tenant`, async () => {
      const code = normalizeAddonCode(addon.slug);
      await apply('solo', [code]);
      const license = (await db.query<any>('SELECT * FROM licenses')).rows[0];
      expect(license.features).toEqual(expect.arrayContaining(addon.features));
      expect(license.metadata.addon_codes).toEqual([code]);
      expect(
        (await db.query<any>('SELECT organization_id FROM addon_subscriptions WHERE active')).rows,
      ).toEqual([{ organization_id: tenant }]);
      if (code === 'additional-user') expect(license.max_users).toBe(2);
      if (code === 'additional-location') expect(license.metadata.limits.locations).toBe(2);
      if (code === 'additional-storage') expect(license.metadata.limits.storageGb).toBe(100);
    });
  it('retries without duplicating seats, licenses, or subscription records', async () => {
    await apply('business', ['additional-user', 'additional-user']);
    await apply('business', ['additional-user']);
    const result = await snapshot();
    expect(result.map((rows) => rows.length)).toEqual([1, 1, 1, 1]);
    expect((result[3][0] as any).max_users).toBe(4);
  });
  it('does not replay an older paid invoice over a later upgrade', async () => {
    await apply('solo', [], { deliveryKey: 'invoice:first' });
    await apply('professional', ['ai-team'], { deliveryKey: 'invoice:second' });
    const before = await snapshot();
    await apply('solo', [], { deliveryKey: 'invoice:first' });
    expect(await snapshot()).toEqual(before);
  });
  it('removes old paid capabilities from both addon stores on downgrade', async () => {
    await apply('professional', ['course-creation-learning-platform', 'ai-team']);
    await apply('solo', []);
    const result = await snapshot();
    expect((result[3][0] as any).features).toEqual(
      expect.not.arrayContaining(['course_factory', 'ai_paris']),
    );
    expect(result[1].every((r: any) => !r.active)).toBe(true);
    expect(result[2].every((r: any) => r.status === 'inactive')).toBe(true);
  });
  it('rolls every write back if license delivery fails after the plan and addons save', async () => {
    await apply('solo');
    const before = await snapshot();
    await db.exec(`CREATE FUNCTION reject_license() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected storage failure'; END; $$;
   CREATE TRIGGER fail_license BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE FUNCTION reject_license();`);
    try {
      await expect(apply('professional', ['ai-team'])).rejects.toThrow('injected storage failure');
      expect(await snapshot()).toEqual(before);
    } finally {
      await db.exec('DROP TRIGGER fail_license ON licenses; DROP FUNCTION reject_license();');
    }
  });
  it('does not partially change a purchase containing an unavailable addon', async () => {
    await apply('solo');
    const before = await snapshot();
    await expect(apply('professional', ['nonexistent'])).rejects.toThrow('unavailable');
    expect(await snapshot()).toEqual(before);
  });
  it('rejects cross-tenant billing identities without changing either workspace', async () => {
    await apply('solo', [], { tenant: otherTenant, organization: otherOrganization });
    const before = await snapshot();
    await expect(
      apply('professional', ['ai-team'], { organization: otherOrganization }),
    ).rejects.toThrow('does not belong');
    expect(await snapshot()).toEqual(before);
  });
  for (const status of ['past_due', 'unpaid', 'canceled'])
    it(`revokes access atomically when ${status}`, async () => {
      await apply('professional', ['ai-team']);
      await apply('professional', ['ai-team'], { status, provider: 'stripe' });
      const result = await snapshot();
      expect((result[3][0] as any).features).toEqual([]);
      expect((result[3][0] as any).status).toBe('suspended');
      expect((result[3][0] as any).max_users).toBe(0);
      expect(result[1].every((r: any) => !r.active)).toBe(true);
    });
  it('does not grant access to an expired paid period', async () => {
    await db.query(
      `SELECT apply_platform_subscription($1,$2,'solo','month','quickbooks','old-sub',NULL,'2020-01-01','2020-02-01','{}','solo_monthly','buyer@example.test')`,
      [tenant, organization],
    );
    const license = (await db.query<any>('SELECT * FROM licenses')).rows[0];
    expect(license.status).toBe('suspended');
    expect(license.features).toEqual([]);
    expect(checkLicenseAccess({ ...license, stripe_subscription_id: null }).hasAccess).toBe(false);
  });
  it('requires a period end for recurring paid access', async () => {
    await expect(
      db.query(
        `SELECT apply_platform_subscription($1,$2,'solo','month','quickbooks','sub',NULL,NULL,NULL,'{}','solo_monthly','buyer@example.test')`,
        [tenant, organization],
      ),
    ).rejects.toThrow('period end');
    expect((await snapshot()).map((r) => r.length)).toEqual([0, 0, 0, 0]);
  });
  it('delivers the advertised Course Builder credits atomically and only once per paid month', async () => {
    await apply('solo', ['course-creation-learning-platform']);
    await apply('solo', ['course-creation-learning-platform']);
    await db.query('SELECT refresh_course_builder_subscription_credits($1)', [tenant]);
    const wallet = (await db.query<any>('SELECT * FROM tenant_course_builder_credit_wallets'))
      .rows[0];
    expect(wallet.balance).toBe(2500);
    expect(wallet.lifetime_granted).toBe(2500);
    expect((await db.query('SELECT * FROM tenant_course_builder_credit_ledger')).rows).toHaveLength(
      1,
    );
  });
  it('can consume and refund purchased credits without SQL ambiguity or duplicate refunds', async () => {
    await apply('solo', ['course-creation-learning-platform']);
    expect((await getCourseBuilderCreditBalance(client as any, tenant)).balance).toBe(2500);
    const userId = '55555555-5555-4555-8555-555555555555';
    await db.query('INSERT INTO auth.users VALUES($1) ON CONFLICT DO NOTHING', [userId]);
    const usage = await reserveCourseBuilderCredits({
      db: client as any,
      tenantId: tenant,
      userId,
      operation: 'generate',
      idempotencyKey: 'usage:test',
    });
    expect(usage.balance).toBe(1000);
    await refundCourseBuilderCredits({
      db: client as any,
      tenantId: tenant,
      userId,
      operation: 'generate',
      reservationKey: 'usage:test',
      reason: 'generation failed',
    });
    await refundCourseBuilderCredits({
      db: client as any,
      tenantId: tenant,
      userId,
      operation: 'generate',
      reservationKey: 'usage:test',
      reason: 'generation failed',
    });
    expect(
      (
        await db.query<any>(
          'SELECT balance,lifetime_used FROM tenant_course_builder_credit_wallets',
        )
      ).rows[0],
    ).toEqual({ balance: 2500, lifetime_used: 0 });
    expect(
      (
        await db.query<any>(
          `SELECT source FROM tenant_course_builder_credit_ledger WHERE entry_type='grant'`,
        )
      ).rows[0].source,
    ).toBe('quickbooks');
  });
  it('rolls delivery back if the included credit allowance cannot be persisted', async () => {
    await db.exec(`CREATE FUNCTION reject_credits() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'credit storage failed'; END; $$;
    CREATE TRIGGER fail_credit BEFORE INSERT ON tenant_course_builder_credit_wallets FOR EACH ROW EXECUTE FUNCTION reject_credits();`);
    try {
      await expect(
        apply('solo', ['course-creation-learning-platform'], {
          deliveryKey: 'invoice:credit-failure',
        }),
      ).rejects.toThrow('credit storage failed');
      expect((await snapshot()).map((r) => r.length)).toEqual([0, 0, 0, 0]);
      expect((await db.query('SELECT * FROM platform_subscription_deliveries')).rows).toEqual([]);
    } finally {
      await db.exec(
        'DROP TRIGGER fail_credit ON tenant_course_builder_credit_wallets; DROP FUNCTION reject_credits();',
      );
    }
  });
  it('does not grant paid credits to a trial or canceled subscription', async () => {
    await apply('solo', ['course-creation-learning-platform'], { status: 'trialing' });
    expect((await db.query('SELECT * FROM tenant_course_builder_credit_wallets')).rows).toEqual([]);
    await apply('solo', ['course-creation-learning-platform'], { status: 'canceled' });
    expect((await db.query('SELECT * FROM tenant_course_builder_credit_wallets')).rows).toEqual([]);
  });
  it('delivers a verified invoice through real billing, Postgres, entitlement reads, and middleware', async () => {
    await fulfillPaidBillingInvoice(client, {
      billing_invoice_id: 'invoice-e2e',
      fulfillment_type: 'platform_subscription',
      paid_at: periodStart.toISOString(),
      customer_email: 'buyer@example.test',
      payload: {
        tenant_id: tenant,
        organization_id: organization,
        plan_id: 'business',
        billing_interval: 'monthly',
        addon_codes: ['course-creation-learning-platform', 'additional-user'],
      },
    });
    const entitlements = await getOrganizationFeatures(tenant, client as any);
    expect(entitlements).toMatchObject({
      organizationId: tenant,
      billingOrganizationId: organization,
      planSlug: 'business',
      status: 'active',
      limits: { users: 4, contacts: null },
    });
    expect(entitlements.features).toEqual(
      expect.arrayContaining(['crm', 'course_builder', 'course_factory', 'lms']),
    );
    const access = await withLicense(
      new NextRequest('https://example.test'),
      { tenantId: tenant } as any,
      'course_builder',
    );
    expect(access.valid).toBe(true);
    expect(access.license).toMatchObject({ billingAuthority: 'quickbooks', maxUsers: 4 });
    expect(
      (await db.query<any>('SELECT balance FROM tenant_course_builder_credit_wallets')).rows[0]
        .balance,
    ).toBe(2500);
  });
  it('requires a real billing email instead of silently failing the NOT NULL license constraint', async () => {
    await expect(apply('solo', [], { email: null })).rejects.toThrow('billing email');
    expect((await snapshot()).map((r) => r.length)).toEqual([0, 0, 0, 0]);
  });
  it('cannot be called by anonymous or authenticated browser clients', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      try {
        await expect(apply()).rejects.toThrow('permission denied');
      } finally {
        await db.exec('RESET ROLE');
      }
    }
  });
});
