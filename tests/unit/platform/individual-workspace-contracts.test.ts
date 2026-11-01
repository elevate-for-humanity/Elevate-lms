// @vitest-environment node
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { fulfillPaidBillingInvoice } from '@/lib/billing/fulfillment';
import { hasIndividualAppAccess } from '@/lib/apps/sync-subscription';
const first = '11111111-1111-4111-8111-111111111111',
  second = '22222222-2222-4222-8222-222222222222';
let db: PGlite;
const schema = `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE SCHEMA storage;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role','service_role') $$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TABLE billing_invoices(id uuid PRIMARY KEY,status text,provider text,fulfillment_type text,paid_at timestamptz,total_cents bigint,fulfillment_payload jsonb);
CREATE TABLE profiles(id uuid PRIMARY KEY,role text); GRANT SELECT ON profiles TO authenticated;
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
INSERT INTO storage.buckets(id,name,public) VALUES('app-workspace-files','app-workspace-files',true);
CREATE TABLE user_app_subscriptions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users,app_slug text,plan text,status text,
 trial_ends_at timestamptz,current_period_start timestamptz,current_period_end timestamptz,billing_provider text CONSTRAINT user_app_subscriptions_billing_provider_check CHECK(billing_provider IN ('paypal','manual')),
 provider_subscription_id text,updated_at timestamptz,UNIQUE(user_id,app_slug));
CREATE TABLE sam_entities(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users,status text DEFAULT 'active',registration_status text,current_step int,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE sam_documents(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,entity_id uuid,file_name text,file_size bigint,file_url text,document_type text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE sam_alerts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),status text DEFAULT 'active',is_read boolean,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE grant_opportunities(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),external_id text UNIQUE,title text,status text);
CREATE TABLE user_saved_grants(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users,status text DEFAULT 'active');
CREATE TABLE grant_applications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),created_by uuid,submitted_by uuid,opportunity_id uuid,status text);
GRANT ALL ON sam_entities,sam_documents,sam_alerts,user_saved_grants,grant_applications TO authenticated;
ALTER TABLE sam_entities ENABLE ROW LEVEL SECURITY; CREATE POLICY public_read ON sam_entities FOR SELECT USING(true);
ALTER TABLE user_saved_grants ENABLE ROW LEVEL SECURITY; CREATE POLICY auth_read_user_saved_grants ON user_saved_grants FOR SELECT TO authenticated USING(true);
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY; CREATE POLICY "Admin full access to grant_apps" ON grant_applications FOR ALL USING(true);
ALTER TABLE grant_opportunities ENABLE ROW LEVEL SECURITY; CREATE POLICY "Admin full access to grants" ON grant_opportunities FOR ALL USING(true);
`;
async function subscribe(user = first, app = 'sam-gov', plan = 'starter', status = 'active') {
  await db.query(
    `INSERT INTO user_app_subscriptions(user_id,app_slug,plan,status,current_period_end,trial_ends_at) VALUES($1,$2,$3,$4,now()+interval '1 month',now()+interval '14 days')
 ON CONFLICT(user_id,app_slug) DO UPDATE SET plan=excluded.plan,status=excluded.status,current_period_end=excluded.current_period_end`,
    [user, app, plan, status],
  );
}
async function save(user = first, id: string | null = null, values: any = {}) {
  return db.query<any>('SELECT * FROM public.save_sam_entity($1,$2,$3)', [
    user,
    id,
    JSON.stringify({
      legal_business_name: 'Fixture organization',
      registration_status: 'draft',
      ...values,
    }),
  ]);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(schema);
  await db.exec(
    readFileSync(
      'supabase/migrations/20261031193843_individual_app_workspace_contracts.sql',
      'utf8',
    ),
  );
  await db.exec(
    readFileSync(
      'supabase/migrations/20261031195323_atomic_individual_app_invoice_delivery.sql',
      'utf8',
    ),
  );
  await db.query('INSERT INTO auth.users VALUES($1),($2)', [first, second]);
  await db.query("INSERT INTO profiles VALUES($1,'org_admin'),($2,'org_admin')", [first, second]);
}, 60000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ role: 'service_role' }),
  ]);
  await db.exec(
    'TRUNCATE sam_alerts,sam_documents,sam_entities,user_saved_grants,grant_applications,grant_opportunities,individual_app_usage,user_app_subscriptions,individual_app_deliveries,billing_invoices',
  );
});
describe('Individual subscriptions and workspaces against PostgreSQL', () => {
  for (const app of ['website-builder', 'sam-gov', 'grants'])
    for (const plan of ['starter', 'professional', 'enterprise'])
      it(`activates ${app} ${plan} from a verified QuickBooks invoice`, async () => {
        const invoiceId = '33333333-3333-4333-8333-333333333333';
        await db.query(
          "INSERT INTO billing_invoices VALUES($1,'paid','quickbooks','individual_app_subscription',now(),4900,$2)",
          [invoiceId, JSON.stringify({ user_id: first, app_slug: app, plan_id: plan })],
        );
        const client: any = {
          rpc: async (name: string, args: any) => {
            try {
              await db.query('SELECT public.' + name + '($1)', [args.p_invoice_id]);
              return { error: null };
            } catch (error) {
              return { error: { message: (error as Error).message } };
            }
          },
        };
        await fulfillPaidBillingInvoice(client, {
          billing_invoice_id: invoiceId,
          fulfillment_type: 'individual_app_subscription',
          paid_at: new Date().toISOString(),
          payload: { user_id: first, app_slug: app, plan_id: plan },
        });
        const row = (await db.query<any>('SELECT * FROM user_app_subscriptions')).rows[0];
        expect(row.billing_provider).toBe('quickbooks');
        expect(row.plan).toBe(plan);
        expect(hasIndividualAppAccess(row)).toBe(true);
      });
  it('retries cannot overwrite a later paid app upgrade', async () => {
    const old = '33333333-3333-4333-8333-333333333333',
      newer = '44444444-4444-4444-8444-444444444444';
    for (const [id, paid, plan] of [
      [old, '2026-01-31T15:45:00Z', 'starter'],
      [newer, '2026-02-28T15:45:00Z', 'professional'],
    ]) {
      await db.query(
        "INSERT INTO billing_invoices VALUES($1,'paid','quickbooks','individual_app_subscription',$2,4900,$3)",
        [id, paid, JSON.stringify({ user_id: first, app_slug: 'sam-gov', plan_id: plan })],
      );
      await db.query('SELECT apply_paid_individual_app_subscription($1)', [id]);
    }
    await db.query('SELECT apply_paid_individual_app_subscription($1)', [old]);
    expect((await db.query<any>('SELECT plan FROM user_app_subscriptions')).rows[0].plan).toBe(
      'professional',
    );
    await db.query(
      "UPDATE billing_invoices SET fulfillment_payload=jsonb_set(fulfillment_payload,'{plan_id}','\"enterprise\"') WHERE id=$1",
      [old],
    );
    await expect(
      db.query('SELECT apply_paid_individual_app_subscription($1)', [old]),
    ).rejects.toThrow('changed after delivery');
  });
  it('unpaid invoices and public database roles cannot activate an app', async () => {
    const id = '33333333-3333-4333-8333-333333333333';
    await db.query(
      "INSERT INTO billing_invoices VALUES($1,'open','quickbooks','individual_app_subscription',NULL,4900,$2)",
      [id, JSON.stringify({ user_id: first, app_slug: 'sam-gov', plan_id: 'enterprise' })],
    );
    await expect(
      db.query('SELECT apply_paid_individual_app_subscription($1)', [id]),
    ).rejects.toThrow('Verified paid');
    for (const role of ['anon', 'authenticated']) {
      await db.exec('SET ROLE ' + role);
      await expect(
        db.query('SELECT apply_paid_individual_app_subscription($1)', [id]),
      ).rejects.toThrow('permission denied');
      await db.exec('RESET ROLE');
    }
    expect(
      (await db.query<any>('SELECT count(*)::int n FROM user_app_subscriptions')).rows[0].n,
    ).toBe(0);
  });
  it.each([
    ['starter', 1],
    ['professional', 5],
    ['enterprise', 10],
  ] as const)('enforces the %s entity allowance atomically', async (plan, count) => {
    await subscribe(first, 'sam-gov', plan);
    for (let i = 0; i < count; i++) await save();
    if (plan !== 'enterprise') await expect(save()).rejects.toThrow('Entity limit reached');
    expect((await db.query('SELECT * FROM sam_entities')).rows).toHaveLength(count);
  });
  it('allows editing an owned record at capacity without creating duplicate reminders', async () => {
    await subscribe();
    const row = (await save(first, null, { registration_expires_on: '2099-01-01' })).rows[0];
    await save(first, row.id, {
      legal_business_name: 'Updated fixture',
      registration_expires_on: '2099-02-01',
    });
    expect((await db.query<any>('SELECT * FROM sam_entities')).rows[0].legal_business_name).toBe(
      'Updated fixture',
    );
    expect((await db.query<any>('SELECT * FROM sam_alerts')).rows).toHaveLength(1);
    expect((await db.query<any>('SELECT due_date::text FROM sam_alerts')).rows[0].due_date).toBe(
      '2099-02-01',
    );
  });
  it('does not update another subscriber entity', async () => {
    await subscribe();
    await subscribe(second);
    const id = (await save()).rows[0].id;
    await expect(
      save(second, id, { legal_business_name: 'Unauthorized overwrite' }),
    ).rejects.toThrow('Entity not found');
  });
  it('grants exactly 50 Starter searches and refuses the next one', async () => {
    await subscribe(first, 'grants');
    for (let i = 0; i < 50; i++) {
      const row = (await db.query<any>('SELECT * FROM reserve_grants_search($1)', [first])).rows[0];
      expect(row.allowed).toBe(true);
    }
    expect(
      (await db.query<any>('SELECT * FROM reserve_grants_search($1)', [first])).rows[0],
    ).toEqual({ allowed: false, remaining: 0 });
  });
  it.each(['canceled', 'inactive', 'past_due'])('denies %s app operations', async (status) => {
    await subscribe(first, 'sam-gov', 'starter', status);
    await subscribe(first, 'grants', 'starter', status);
    await expect(save()).rejects.toThrow('Active SAM.gov subscription');
    await expect(db.query('SELECT * FROM reserve_grants_search($1)', [first])).rejects.toThrow(
      'Active Grants subscription',
    );
  });
  it.each(['active', 'trial'])(
    'fails closed when a %s subscription has no verified deadline',
    async (status) => {
      await subscribe(first, 'sam-gov', 'starter', status);
      await subscribe(first, 'grants', 'starter', status);
      await db.query(
        'UPDATE user_app_subscriptions SET current_period_end=NULL,trial_ends_at=NULL',
      );
      await expect(save()).rejects.toThrow('Active SAM.gov subscription');
      await expect(db.query('SELECT * FROM reserve_grants_search($1)', [first])).rejects.toThrow(
        'Active Grants subscription',
      );
      expect((await db.query('SELECT * FROM individual_app_usage')).rows).toEqual([]);
    },
  );
  it('does not expose one subscriber private records to another or allow direct browser mutations', async () => {
    await subscribe();
    await subscribe(second);
    const one = (await save()).rows[0];
    const two = (await save(second)).rows[0];
    await db.query(
      `INSERT INTO sam_documents(user_id,entity_id,file_name) VALUES($1,$2,'first.pdf'),($3,$4,'second.pdf')`,
      [first, one.id, second, two.id],
    );
    await db.query(
      `INSERT INTO grant_applications(created_by,status) VALUES($1,'draft'),($2,'draft')`,
      [first, second],
    );
    await db.query(`INSERT INTO user_saved_grants(user_id) VALUES($1),($2)`, [first, second]);
    await db.query("SELECT set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({ role: 'authenticated', sub: first }),
    ]);
    await db.exec('SET ROLE authenticated');
    try {
      for (const table of [
        'sam_entities',
        'sam_documents',
        'grant_applications',
        'user_saved_grants',
      ])
        expect((await db.query(`SELECT * FROM ${table}`)).rows).toHaveLength(1);
      await expect(
        db.query('INSERT INTO sam_entities(user_id) VALUES($1)', [first]),
      ).rejects.toThrow(/row-level security|permission denied/);
      await expect(
        db.query('SELECT save_sam_entity($1,NULL,$2)', [
          second,
          JSON.stringify({ legal_business_name: 'Spoofed fixture' }),
        ]),
      ).rejects.toThrow('permission denied');
    } finally {
      await db.exec('RESET ROLE');
    }
  });
  it('preserves authenticated platform operator workflows', async () => {
    await subscribe();
    await subscribe(second);
    await save();
    await save(second);
    await db.query("UPDATE profiles SET role='admin' WHERE id=$1", [first]);
    await db.query("SELECT set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({ role: 'authenticated', sub: first }),
    ]);
    await db.exec('SET ROLE authenticated');
    try {
      expect((await db.query('SELECT * FROM sam_entities')).rows).toHaveLength(2);
      await db.query(
        "INSERT INTO sam_entities(user_id,legal_business_name) VALUES($1,'Operator fixture')",
        [second],
      );
    } finally {
      await db.exec('RESET ROLE');
      await db.query("UPDATE profiles SET role='org_admin' WHERE id=$1", [first]);
    }
  });
  it('keeps uploaded document storage private', async () => {
    expect(
      (await db.query<any>("SELECT public FROM storage.buckets WHERE id='app-workspace-files'"))
        .rows[0].public,
    ).toBe(false);
  });
});
