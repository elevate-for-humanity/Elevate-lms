SET LOCAL lock_timeout='5s';
CREATE TABLE public.hour_standing_approvals(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
 approver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 effective_from date NOT NULL,
 enabled boolean NOT NULL DEFAULT true,
 authorization_note text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,program_id)
);
CREATE TABLE public.hour_standing_approval_runs(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id uuid NOT NULL,
 program_id uuid NOT NULL,
 progress_entry_id uuid NOT NULL,
 outcome text NOT NULL CHECK(outcome IN('approved','error')),
 message text,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hour_standing_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_standing_approval_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hour_standing_approvals,public.hour_standing_approval_runs FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.hour_standing_approvals,public.hour_standing_approval_runs TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.hour_standing_approval_runs_id_seq TO service_role;
CREATE FUNCTION public.process_standing_hour_approvals() RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE item record; reviewed jsonb; approved integer; total integer:=0;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' OR current_user<>'service_role' THEN
  RAISE EXCEPTION 'Service context required' USING ERRCODE='42501';
 END IF;
 IF NOT pg_catalog.pg_try_advisory_xact_lock(4282026,528) THEN RETURN 0;END IF;
 FOR item IN
 SELECT pe.id,policy.user_id,policy.program_id,policy.approver_id,
 jsonb_build_object('id',pe.id,'apprentice_id',pe.apprentice_id,'program_id',pe.program_id,
 'work_date',pe.work_date,'week_ending',pe.week_ending,'hours_worked',pe.hours_worked,
 'notes',pe.notes,'tasks_completed',pe.tasks_completed,'clock_in_at',pe.clock_in_at,'clock_out_at',pe.clock_out_at) snapshot
 FROM public.hour_standing_approvals policy
 JOIN public.apprentices a ON a.user_id=policy.user_id AND a.program_id=policy.program_id
 JOIN public.programs program ON program.id=policy.program_id
 JOIN public.progress_entries pe ON pe.apprentice_id=a.id AND lower(btrim(pe.program_id)) IN(program.id::text,lower(program.slug))
 JOIN public.profiles approver ON approver.id=policy.approver_id AND approver.role IN('admin','super_admin') AND approver.is_active AND approver.suspended IS NOT TRUE
 WHERE policy.enabled AND pe.work_date>=policy.effective_from
 AND pe.status='submitted' AND pe.clock_in_at IS NOT NULL AND pe.clock_out_at>pe.clock_in_at
 AND pe.clock_out_at<=now() AND pe.hours_worked>0
 AND (pe.lunch_start_at IS NULL OR pe.lunch_end_at IS NOT NULL)
 AND EXISTS(SELECT 1 FROM public.program_enrollments e WHERE (e.user_id=policy.user_id OR e.student_id=policy.user_id)
 AND e.program_id=policy.program_id AND e.status IN('active','enrolled','in_progress','confirmed') AND e.revoked_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.hour_standing_approval_runs r WHERE r.progress_entry_id=pe.id AND r.outcome='error' AND r.created_at>now()-interval '1 hour')
 ORDER BY pe.work_date,pe.id LIMIT 50
 LOOP
  BEGIN
   approved:=public.admin_verify_apprenticeship_hours(ARRAY[item.id],item.approver_id,jsonb_build_array(item.snapshot));
   IF approved>0 THEN
    INSERT INTO public.hour_standing_approval_runs(user_id,program_id,progress_entry_id,outcome,message)
    VALUES(item.user_id,item.program_id,item.id,'approved','Completed recorded shift approved under standing admin authorization; existing ledger, overlap, duration, weekly-cap and snapshot checks retained');
    total:=total+approved;
   END IF;
  EXCEPTION WHEN OTHERS THEN
   INSERT INTO public.hour_standing_approval_runs(user_id,program_id,progress_entry_id,outcome,message)
   VALUES(item.user_id,item.program_id,item.id,'error',SQLSTATE||':'||SQLERRM);
  END;
 END LOOP;
 RETURN total;
END $fn$;
REVOKE ALL ON FUNCTION public.process_standing_hour_approvals() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.process_standing_hour_approvals() TO service_role;
COMMENT ON TABLE public.hour_standing_approvals IS 'Explicit sponsor/admin standing authorization for actual completed clocked shifts only. Approval uses existing audited admin hours RPC; open shifts and transfer/manual claims are excluded.';
