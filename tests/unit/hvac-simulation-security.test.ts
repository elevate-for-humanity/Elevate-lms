// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';

it('reserves HVAC simulation writes for the server while retaining owner, admin-read and MFA policies', async () => {
  const db = new PGlite();
  const learner = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const other = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const regularId = '11111111-1111-4111-8111-111111111111';
  const simulationId = '22222222-2222-4222-8222-222222222222';
  const insert = (id: string, interaction: string, owner = learner) =>
    `INSERT INTO public.interaction_progress(id,learner_id,interaction_id,score) VALUES ('${id}','${owner}','${interaction}',100)`;
  async function actor(id: string, mfa = true) {
    await db.exec('RESET ROLE');
    await db.query(
      "SELECT set_config('test.user',$1,false),set_config('test.mfa',$2,false),set_config('test.admin','false',false)",
      [id, String(mfa)],
    );
    await db.exec('SET ROLE authenticated');
  }
  try {
    await db.exec(`
      CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE SCHEMA security_private;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
      CREATE FUNCTION security_private.privileged_session_mfa_satisfied() RETURNS boolean LANGUAGE sql STABLE AS $$SELECT coalesce(current_setting('test.mfa',true),'false')='true'$$;
      REVOKE ALL ON SCHEMA auth,security_private FROM PUBLIC;
      GRANT USAGE ON SCHEMA auth,security_private TO authenticated,service_role;
      REVOKE ALL ON FUNCTION auth.uid(),security_private.privileged_session_mfa_satisfied() FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION auth.uid(),security_private.privileged_session_mfa_satisfied() TO authenticated,service_role;
      CREATE TABLE public.interaction_progress(id uuid PRIMARY KEY,learner_id uuid NOT NULL,interaction_id text NOT NULL,score integer);
      ALTER TABLE public.interaction_progress ENABLE ROW LEVEL SECURITY;
      GRANT SELECT,INSERT,UPDATE,DELETE ON public.interaction_progress TO authenticated,service_role;
      CREATE POLICY interaction_progress_owner_select ON public.interaction_progress FOR SELECT TO authenticated USING(learner_id=auth.uid() OR current_setting('test.admin',true)='true');
      CREATE POLICY interaction_progress_owner_insert ON public.interaction_progress FOR INSERT TO authenticated WITH CHECK(learner_id=auth.uid());
      CREATE POLICY interaction_progress_owner_update ON public.interaction_progress FOR UPDATE TO authenticated USING(learner_id=auth.uid()) WITH CHECK(learner_id=auth.uid());
      CREATE POLICY interaction_progress_owner_delete ON public.interaction_progress FOR DELETE TO authenticated USING(learner_id=auth.uid());
      CREATE POLICY require_privileged_aal2 ON public.interaction_progress AS RESTRICTIVE FOR ALL TO authenticated USING(security_private.privileged_session_mfa_satisfied()) WITH CHECK(security_private.privileged_session_mfa_satisfied());
    `);
    const before = await db.query(
      "SELECT policyname,permissive,cmd,qual,with_check FROM pg_policies WHERE tablename='interaction_progress' ORDER BY policyname",
    );
    await db.exec(
      await readFile(
        new URL(
          '../../supabase/migrations/20261125014012_protect_hvac_simulation_progress.sql',
          import.meta.url,
        ),
        'utf8',
      ),
    );
    const after = await db.query(
      "SELECT policyname,permissive,cmd,qual,with_check FROM pg_policies WHERE tablename='interaction_progress' AND policyname NOT LIKE 'interaction_progress_hvac_%' ORDER BY policyname",
    );
    expect(after.rows).toEqual(before.rows);

    await actor(learner);
    await db.exec(insert(regularId, 'existing-lesson-kc'));
    expect(
      (await db.query('SELECT public.hvac_simulation_session_ready() AS ready')).rows[0],
    ).toEqual({ ready: true });
    await expect(db.exec(insert(simulationId, 'hvac-sim:chapter-01:v1'))).rejects.toThrow();
    await expect(
      db.exec(insert('33333333-3333-4333-8333-333333333333', 'existing-other-kc', other)),
    ).rejects.toThrow();
    await expect(
      db.exec(
        `UPDATE public.interaction_progress SET interaction_id='hvac-sim:chapter-01:v1' WHERE id='${regularId}'`,
      ),
    ).rejects.toThrow();

    await db.exec('RESET ROLE; SET ROLE service_role');
    await db.exec(insert(simulationId, 'hvac-sim:chapter-01:v1'));
    await db.exec(`UPDATE public.interaction_progress SET score=65 WHERE id='${simulationId}'`);
    await actor(learner);
    expect(
      (await db.query('SELECT count(*)::int AS n FROM public.interaction_progress')).rows[0],
    ).toEqual({ n: 2 });
    expect(
      (
        await db.query(
          `UPDATE public.interaction_progress SET score=100 WHERE id='${simulationId}' RETURNING id`,
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await db.query(
          `UPDATE public.interaction_progress SET interaction_id='ordinary' WHERE id='${simulationId}' RETURNING id`,
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await db.query(
          `DELETE FROM public.interaction_progress WHERE id='${simulationId}' RETURNING id`,
        )
      ).rows,
    ).toEqual([]);
    expect(
      (await db.query(`SELECT score FROM public.interaction_progress WHERE id='${simulationId}'`))
        .rows[0],
    ).toEqual({ score: 65 });
    await db.exec(`UPDATE public.interaction_progress SET score=75 WHERE id='${regularId}'`);
    expect(
      (await db.query(`SELECT score FROM public.interaction_progress WHERE id='${regularId}'`))
        .rows[0],
    ).toEqual({ score: 75 });

    await actor(other);
    expect(
      (await db.query('SELECT count(*)::int AS n FROM public.interaction_progress')).rows[0],
    ).toEqual({ n: 0 });
    await db.query("SELECT set_config('test.admin','true',false)");
    expect(
      (await db.query('SELECT count(*)::int AS n FROM public.interaction_progress')).rows[0],
    ).toEqual({ n: 2 });
    expect(
      (
        await db.query(
          `UPDATE public.interaction_progress SET score=100 WHERE id='${simulationId}' RETURNING id`,
        )
      ).rows,
    ).toEqual([]);

    await actor(learner, false);
    expect(
      (await db.query('SELECT public.hvac_simulation_session_ready() AS ready')).rows[0],
    ).toEqual({ ready: false });
    expect(
      (await db.query('SELECT count(*)::int AS n FROM public.interaction_progress')).rows[0],
    ).toEqual({ n: 0 });
    await expect(
      db.exec(insert('44444444-4444-4444-8444-444444444444', 'ordinary-new-kc')),
    ).rejects.toThrow();
    await db.exec('RESET ROLE; SET ROLE anon');
    await expect(db.query('SELECT public.hvac_simulation_session_ready()')).rejects.toThrow();
    await db.exec('RESET ROLE');
    expect(
      (
        await db.query(
          "SELECT prosecdef FROM pg_proc WHERE oid='public.hvac_simulation_session_ready()'::regprocedure",
        )
      ).rows[0],
    ).toEqual({ prosecdef: false });
    expect(
      (
        await db.query(
          "SELECT has_function_privilege('anon','public.hvac_simulation_session_ready()','EXECUTE') AS allowed",
        )
      ).rows[0],
    ).toEqual({ allowed: false });
    expect(
      (await db.query('SELECT count(*)::int AS n FROM public.interaction_progress')).rows[0],
    ).toEqual({ n: 2 });
  } finally {
    await db.close();
  }
}, 60000);
