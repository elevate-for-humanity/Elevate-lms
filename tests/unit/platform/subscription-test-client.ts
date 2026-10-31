import type { PGlite } from '@electric-sql/pglite';

/** Minimal PostgREST transport over the real test database, without mocking billing logic. */
export function subscriptionTestClient(database: () => PGlite) {
  return {
    rpc: async (name: string, args: Record<string, unknown>) => {
      if (
        ![
          'apply_platform_subscription',
          'refresh_course_builder_subscription_credits',
          'consume_tenant_course_builder_credits',
          'refund_tenant_course_builder_credits',
        ].includes(name)
      )
        throw new Error(`Unexpected RPC ${name}`);
      const entries = Object.entries(args);
      try {
        const call = `public.${name}(${entries.map(([key], i) => `${key} => $${i + 1}`).join(',')})`;
        const rowset = [
          'consume_tenant_course_builder_credits',
          'refund_tenant_course_builder_credits',
        ].includes(name);
        const result = await database().query<any>(
          rowset ? `SELECT * FROM ${call}` : `SELECT ${call} AS result`,
          entries.map(([, value]) => value),
        );
        return { data: rowset ? result.rows : result.rows[0].result, error: null };
      } catch (error) {
        return { data: null, error: { message: (error as Error).message } };
      }
    },
    from: (table: string) => {
      let selection = '*';
      const filters: Array<[string, unknown]> = [];
      const execute = async (single = false) => {
        let sql: string;
        if (table === 'organization_subscriptions')
          sql = `SELECT s.status,s.current_period_end,s.billing_interval,s.plan_id,
      json_build_object('slug',p.slug,'name',p.name,'limits',p.limits) AS subscription_plans
      FROM organization_subscriptions s JOIN subscription_plans p ON p.id=s.plan_id`;
        else if (table === 'plan_features')
          sql = `SELECT json_build_object('code',f.code) AS features FROM plan_features s JOIN features f ON f.id=s.feature_id`;
        else if (table === 'addon_subscriptions')
          sql = `SELECT s.addon_code,json_build_object('feature_codes',c.feature_codes) AS saas_addon_catalog
      FROM addon_subscriptions s JOIN saas_addon_catalog c ON c.code=s.addon_code`;
        else {
          if (
            ![
              'organizations',
              'organization_addons',
              'saas_addon_catalog',
              'licenses',
              'tenant_course_builder_credit_wallets',
            ].includes(table)
          )
            throw new Error(`Unexpected table ${table}`);
          if (!/^[a-z_ ,*]+$/.test(selection)) throw new Error('Invalid test selection');
          sql = `SELECT ${selection} FROM ${table} s`;
        }
        const where = filters.map(([key], i) => {
          if (!/^[a-z_]+$/.test(key)) throw new Error('Invalid test filter');
          return `s.${key}=$${i + 1}`;
        });
        if (where.length) sql += ' WHERE ' + where.join(' AND ');
        try {
          const result = await database().query(
            sql,
            filters.map(([, value]) => value),
          );
          return { data: single ? (result.rows[0] ?? null) : result.rows, error: null };
        } catch (error) {
          return { data: null, error: { message: (error as Error).message } };
        }
      };
      const query: any = {
        select: (value: string) => {
          selection = value;
          return query;
        },
        eq: (key: string, value: unknown) => {
          filters.push([key, value]);
          return query;
        },
        maybeSingle: () => execute(true),
        then: (resolve: any, reject: any) => execute().then(resolve, reject),
      };
      return query;
    },
  };
}
