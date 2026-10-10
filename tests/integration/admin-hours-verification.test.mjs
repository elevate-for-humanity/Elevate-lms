import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Optional isolated PostgreSQL engine; never connects to a deployed database.
// PGLITE_MODULE=/tmp/elevate-hours-pgtest/node_modules/@electric-sql/pglite/dist/index.js node --test tests/integration/admin-hours-verification.test.mjs
const engine = process.env.PGLITE_MODULE;
const admin = 'aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa';
const student = 'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb';
const ready = 'dddddddd-dddd-4ddd-9ddd-000000000001';
const overCap = 'dddddddd-dddd-4ddd-9ddd-000000000002';
const changedByTrigger = 'dddddddd-dddd-4ddd-9ddd-000000000004';

test('Admin verification preserves authorization, reviewed hours, ledger and audit atomicity', { skip: !engine }, async (t) => {
  const { PGlite } = await import(engine);
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS
        $$ SELECT current_setting('request.jwt.claim.role', true) $$;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
        $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
      CREATE TABLE profiles(id uuid PRIMARY KEY, role text, email text);
      CREATE TABLE programs(id uuid PRIMARY KEY, slug text);
      CREATE TABLE apprentices(id uuid PRIMARY KEY, user_id uuid, program_id uuid);
      CREATE TABLE apprentice_sites(id uuid PRIMARY KEY, shop_id uuid);
      CREATE TABLE progress_entries(
        id uuid PRIMARY KEY, apprentice_id uuid, partner_id uuid, program_id text,
        status text, work_date date, week_ending date, hours_worked numeric(5,2),
        max_hours_per_week numeric, notes text, tasks_completed text,
        clock_in_at timestamptz, clock_out_at timestamptz,
        lunch_start_at timestamptz, lunch_end_at timestamptz,
        submitted_by uuid, site_id uuid, hour_entry_id uuid,
        verified_by uuid, verified_at timestamptz, updated_at timestamptz
      );
      CREATE TABLE hour_entries(
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, program_slug text,
        progress_entry_id uuid UNIQUE, legacy_source text, legacy_id uuid,
        source_type text, work_date date, hours_claimed numeric CHECK(hours_claimed > 0),
        accepted_hours numeric, notes text, entered_by_email text NOT NULL,
        status text, approval_status text, approved_by text, approved_by_user_id uuid,
        approved_by_role text, approved_at timestamptz, host_shop_id uuid
      );
      CREATE TABLE audit_logs(
        action text, actor_id uuid, target_type text, target_id text,
        before_state jsonb, after_state jsonb, metadata jsonb, created_at timestamptz DEFAULT now()
      );
      CREATE FUNCTION can_verify_progress_entry(uuid) RETURNS boolean LANGUAGE sql AS $$
        SELECT EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff'))
      $$;
      INSERT INTO profiles VALUES
        ('${admin}', 'admin', 'admin@example.test'),
        ('${student}', 'student', 'student@example.test');
      INSERT INTO programs VALUES('cccccccc-cccc-4ccc-9ccc-cccccccccccc', 'example-apprenticeship');

      -- Seed historic records before attaching integrity triggers. The invalid
      -- rows represent existing data; the tests never disable a trigger.
      INSERT INTO progress_entries(id, apprentice_id, partner_id, program_id, status,
        work_date, week_ending, hours_worked, submitted_by, notes)
      VALUES
        ('${ready}', '${student}', 'eeeeeeee-eeee-4eee-9eee-eeeeeeeeeeee',
          'EXAMPLE-APPRENTICESHIP', 'submitted', '2026-10-06', '2026-10-11', 7.25, '${student}', 'Reviewed shift'),
        ('${overCap}', '${student}', 'eeeeeeee-eeee-4eee-9eee-eeeeeeeeeeee',
          'EXAMPLE-APPRENTICESHIP', 'submitted', '2026-10-12', '2026-10-18', 22, '${student}', 'Historical shift'),
        ('dddddddd-dddd-4ddd-9ddd-000000000003', '${student}', 'eeeeeeee-eeee-4eee-9eee-eeeeeeeeeeee',
          'EXAMPLE-APPRENTICESHIP', 'submitted', '2026-10-13', '2026-10-18', 22, '${student}', 'Historical shift'),
        ('${changedByTrigger}', '${student}', 'eeeeeeee-eeee-4eee-9eee-eeeeeeeeeeee',
          'EXAMPLE-APPRENTICESHIP', 'submitted', '2026-10-20', '2026-10-25', 7.25, '${student}', 'Historical clock mismatch');
      UPDATE progress_entries SET clock_in_at='2026-10-20T12:00:00Z', clock_out_at='2026-10-20T20:00:00Z'
        WHERE id='${changedByTrigger}';

      -- Existing production trigger bodies (2026-10-10). Keep SQL equality for
      -- nullable partner_id and the exact transfer aliases used by the database.
      CREATE FUNCTION enforce_weekly_hours_cap() RETURNS trigger LANGUAGE plpgsql
      SET search_path = public AS $$
      DECLARE v_total numeric; v_cap numeric;
      BEGIN
        IF upper(coalesce(NEW.tasks_completed,'')) IN ('TRANSFER CREDIT','PRIOR TRAINING CREDIT','TRANSFER HOURS','PRIOR HOURS') THEN
          RETURN NEW;
        END IF;
        v_cap := coalesce(NEW.max_hours_per_week, 40);
        SELECT coalesce(sum(hours_worked), 0) INTO v_total FROM public.progress_entries
        WHERE apprentice_id=NEW.apprentice_id AND partner_id=NEW.partner_id
          AND program_id=NEW.program_id AND week_ending=NEW.week_ending
          AND upper(coalesce(tasks_completed,'')) NOT IN ('TRANSFER CREDIT','PRIOR TRAINING CREDIT','TRANSFER HOURS','PRIOR HOURS')
          AND id <> coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
        v_total := v_total + coalesce(NEW.hours_worked, 0);
        IF v_total > v_cap THEN
          RAISE EXCEPTION 'Weekly hours cap exceeded: total=% cap=%', v_total, v_cap USING ERRCODE='23514';
        END IF;
        RETURN NEW;
      END $$;
      CREATE FUNCTION derive_hours_worked() RETURNS trigger LANGUAGE plpgsql
      SET search_path = public AS $$
      DECLARE v_lunch_duration interval;
      BEGIN
        IF NEW.clock_in_at IS NOT NULL AND NEW.clock_out_at IS NOT NULL THEN
          IF NEW.lunch_start_at IS NOT NULL AND NEW.lunch_end_at IS NOT NULL THEN
            v_lunch_duration := NEW.lunch_end_at - NEW.lunch_start_at;
          ELSE
            v_lunch_duration := interval '0';
          END IF;
          NEW.hours_worked := EXTRACT(EPOCH FROM (NEW.clock_out_at - NEW.clock_in_at - v_lunch_duration)) / 3600.0;
          IF NEW.hours_worked < 0 THEN NEW.hours_worked := 0; END IF;
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER enforce_weekly_hours_cap_trigger BEFORE INSERT OR UPDATE ON progress_entries
        FOR EACH ROW EXECUTE FUNCTION enforce_weekly_hours_cap();
      CREATE TRIGGER trigger_derive_hours_worked BEFORE INSERT OR UPDATE ON progress_entries
        FOR EACH ROW EXECUTE FUNCTION derive_hours_worked();
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role, authenticated;
      -- Deliberately permit direct table UPDATE in this isolated fixture so the
      -- verification trigger itself must reject a forged client claim.
      GRANT UPDATE ON progress_entries TO authenticated;
    `);
    const migration = await fs.readFile(new URL('../../supabase/migrations/20261010171742_admin_hours_preserve_verification_triggers.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(migration); // CREATE OR REPLACE and privilege changes are replay-safe.
    await db.exec(`CREATE TRIGGER trg_lock_verification_fields
      BEFORE UPDATE OF status, verified_by, verified_at ON progress_entries
      FOR EACH ROW EXECUTE FUNCTION lock_verification_fields()`);
    await db.exec(await fs.readFile(new URL('../../supabase/migrations/20261010104504_admin_hours_serialize_ledger_review.sql', import.meta.url), 'utf8'));

    const snapshot = async (ids) => (await db.query(`
      SELECT jsonb_build_object('id',id,'apprentice_id',apprentice_id,'program_id',program_id,
        'work_date',work_date,'week_ending',week_ending,'hours_worked',hours_worked,
        'notes',notes,'tasks_completed',tasks_completed,'clock_in_at',clock_in_at,'clock_out_at',clock_out_at) data
      FROM progress_entries WHERE id=ANY($1::uuid[]) ORDER BY id`, [ids])).rows.map((row) => row.data);
    const approve = async (ids, expected, actor = admin) => db.query(
      'SELECT admin_verify_apprenticeship_hours($1::uuid[],$2::uuid,$3::jsonb) count',
      [ids, actor, JSON.stringify(expected)],
    );
    const state = async () => (await db.query(`SELECT jsonb_build_object(
      'progress', (SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM progress_entries p),
      'ledger', (SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY id),'[]'::jsonb) FROM hour_entries h),
      'audit', (SELECT coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) FROM audit_logs a)
    ) data`)).rows[0].data;
    const transaction = async (body, role = 'service_role', claim = 'service_role') => {
      await db.exec('BEGIN');
      try {
        await db.exec(`SET LOCAL ROLE ${role}`);
        await db.query("SELECT set_config('request.jwt.claim.role',$1,true)", [claim]);
        await body();
      } finally {
        await db.exec('ROLLBACK');
      }
    };
    const rejects = (operation, message, code) => assert.rejects(operation, (error) => {
      assert.match(error.message, message);
      assert.equal(error.code, code);
      return true;
    });

    await t.test('actual service role verifies reviewed hours with attributable ledger and audit; retry is idempotent', async () => {
      const original = await state();
      const reviewed = await snapshot([ready]);
      await transaction(async () => {
        assert.deepEqual((await db.query('SELECT current_setting(\'role\') role, auth.role() claim')).rows[0], {
          role: 'service_role', claim: 'service_role',
        });
        assert.equal((await approve([ready], reviewed)).rows[0].count, 1);
        assert.deepEqual(await snapshot([ready]), reviewed);
        const { rows: [entry] } = await db.query('SELECT status,verified_by,verified_at FROM progress_entries WHERE id=$1', [ready]);
        assert.equal(entry.status, 'verified');
        assert.equal(entry.verified_by, admin);
        assert.ok(entry.verified_at);
        assert.deepEqual((await db.query('SELECT status,accepted_hours,approved_by_user_id,progress_entry_id FROM hour_entries')).rows, [{
          status: 'approved', accepted_hours: '7.25', approved_by_user_id: admin, progress_entry_id: ready,
        }]);
        const { rows: audit } = await db.query('SELECT action,actor_id,before_state,after_state FROM audit_logs ORDER BY action');
        assert.deepEqual(audit.map(({ action, actor_id }) => ({ action, actor_id })), [
          { action: 'apprenticeship.hours_ledger.created', actor_id: admin },
          { action: 'apprenticeship.progress_entry.approved', actor_id: admin },
        ]);
        assert.equal(audit[1].before_state.status, 'submitted');
        assert.equal(audit[1].after_state.status, 'verified');
        assert.equal(audit[1].before_state.hours_worked, audit[1].after_state.hours_worked);
        const approved = await state();
        assert.equal((await approve([ready], reviewed)).rows[0].count, 0);
        assert.deepEqual(await state(), approved);
      });
      assert.deepEqual(await state(), original);
    });

    await t.test('null and non-admin actors cannot approve', async () => {
      const original = await state();
      const reviewed = await snapshot([ready]);
      for (const actor of [null, student]) {
        await transaction(() => rejects(approve([ready], reviewed, actor), /Authenticated admin approver required/, '42501'));
      }
      assert.deepEqual(await state(), original);
    });

    await t.test('client role cannot execute verifier even with a forged service-role claim', async () => {
      const reviewed = await snapshot([ready]);
      await transaction(() => rejects(approve([ready], reviewed), /permission denied for function admin_verify_apprenticeship_hours/, '42501'), 'authenticated');
      await transaction(() => rejects(db.query('SELECT admin_approve_progress_entries($1::uuid[],$2::uuid)', [[ready], admin]),
        /permission denied for function admin_approve_progress_entries/, '42501'), 'authenticated');
      await transaction(() => rejects(db.query(`UPDATE progress_entries
        SET status='verified',verified_by=$2,verified_at=now() WHERE id=$1`, [ready, admin]),
      /Not authorized to verify hours/, '42501'), 'authenticated');
    });

    await t.test('actual service role with a non-service JWT cannot use the canonical wrapper', async () => {
      const reviewed = await snapshot([ready]);
      for (const claim of ['authenticated', '']) {
        await transaction(() => rejects(approve([ready], reviewed), /Authenticated admin approver required/, '42501'), 'service_role', claim);
      }
    });

    await t.test('weekly cap rejects a later batch entry and rolls back all earlier approvals, ledger and audit writes', async () => {
      const original = await state();
      const ids = [ready, overCap];
      const reviewed = await snapshot(ids);
      await transaction(() => rejects(approve(ids, reviewed), /Weekly hours cap exceeded: total=44\.00 cap=40/, '23514'));
      assert.deepEqual(await state(), original);
    });

    await t.test('legacy clock derivation after the verification trigger cannot silently change reviewed hours', async () => {
      const original = await state();
      const ids = [ready, changedByTrigger];
      const reviewed = await snapshot(ids);
      await transaction(() => rejects(approve(ids, reviewed), /Approval must preserve the reviewed entry/, '23514'));
      assert.deepEqual(await state(), original);
      assert.equal((await db.query('SELECT hours_worked FROM progress_entries WHERE id=$1', [changedByTrigger])).rows[0].hours_worked, '7.25');
    });

    await t.test('stale reviewed snapshots reject before any approval', async () => {
      const original = await state();
      const reviewed = await snapshot([ready]);
      reviewed[0].hours_worked = 99;
      await transaction(() => rejects(approve([ready], reviewed), /Reviewed entry has changed/, 'P0001'));
      assert.deepEqual(await state(), original);
    });
    assert.deepEqual((await db.query(`SELECT tgname,tgenabled FROM pg_trigger
      WHERE tgrelid='progress_entries'::regclass AND NOT tgisinternal ORDER BY tgname`)).rows, [
      { tgname: 'enforce_weekly_hours_cap_trigger', tgenabled: 'O' },
      { tgname: 'trg_lock_verification_fields', tgenabled: 'O' },
      { tgname: 'trigger_derive_hours_worked', tgenabled: 'O' },
    ]);
  } finally {
    await db.close();
  }
});
