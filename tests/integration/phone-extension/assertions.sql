DO $$ BEGIN
  ASSERT (SELECT count(*) FROM phone_destinations)=3, 'migration must preserve route history';
  ASSERT (SELECT count(*) FROM phone_destinations WHERE enabled)=1, 'duplicate enabled routes reconciled';
  ASSERT (SELECT enabled FROM phone_destinations WHERE name='Current'), 'default route must win';
  ASSERT (SELECT destination_id FROM phone_menu_options)='00000000-0000-0000-0000-000000000008'::uuid, 'menu reference preserved';
  ASSERT (SELECT destination_id FROM phone_calls)='00000000-0000-0000-0000-000000000008'::uuid, 'call reference preserved';
  ASSERT NOT has_function_privilege('authenticated','save_phone_extension(uuid,uuid,text,text)','execute'), 'no client RPC privilege';
  ASSERT has_function_privilege('service_role','save_phone_extension(uuid,uuid,text,text)','execute'), 'server RPC privilege';
END $$;
SELECT save_phone_extension('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','0','Updated');
DO $$ BEGIN
  ASSERT (SELECT destination_id FROM communication_extensions)='00000000-0000-0000-0000-000000000007'::uuid, 'reuse enabled newer destination';
  ASSERT (SELECT count(*) FROM phone_destinations)=3, 'edit must not create another route';
  ASSERT NOT (SELECT enabled FROM phone_destinations WHERE id='00000000-0000-0000-0000-000000000006'), 'old paused route stays paused';
  BEGIN
    PERFORM save_phone_extension('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000002','10','Other');
    RAISE EXCEPTION 'cross-tenant save unexpectedly allowed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'cross-tenant save unexpectedly allowed' THEN RAISE; END IF;
  END;
  ASSERT (SELECT count(*) FROM communication_extensions)=1, 'cross-tenant save writes nothing';
END $$;
CREATE FUNCTION fail_route_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'simulated route failure'; END $$;
CREATE TRIGGER simulated_route_failure BEFORE UPDATE ON phone_destinations FOR EACH ROW EXECUTE FUNCTION fail_route_update();
DO $$ BEGIN
  BEGIN
    PERFORM save_phone_extension('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','11','Must rollback');
    RAISE EXCEPTION 'route failure did not occur';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'simulated route failure' THEN RAISE; END IF;
  END;
  ASSERT (SELECT department FROM communication_extensions)='Updated', 'extension edit rolls back on route error';
  ASSERT (SELECT extension FROM communication_extensions)='0', 'extension number rolls back too';
END $$;
DROP TRIGGER simulated_route_failure ON phone_destinations;
-- No active route: reuses the linked route. No existing route: creates one atomically.
UPDATE phone_destinations SET enabled=false;
SELECT save_phone_extension('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','0','Reenabled');
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM phone_destinations WHERE enabled)=1;
  ASSERT (SELECT enabled FROM phone_destinations WHERE id='00000000-0000-0000-0000-000000000007');
END $$;
INSERT INTO profiles VALUES ('00000000-0000-0000-0000-000000000009','New','new@example.test','staff',NULL,NULL);
SELECT save_phone_extension('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000009','12','New');
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM communication_extensions)=2;
  ASSERT (SELECT count(*) FROM phone_destinations)=4;
  BEGIN
    PERFORM save_phone_extension('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000009','0','Conflicting');
    RAISE EXCEPTION 'duplicate extension unexpectedly allowed';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  ASSERT (SELECT extension FROM communication_extensions WHERE profile_id='00000000-0000-0000-0000-000000000009')='12';
END $$;
