-- A departure grace period delays closure; it must never earn additional hours.
-- Keep the existing service-only RPC signatures used by heartbeat and pg_cron.
CREATE OR REPLACE FUNCTION public.auto_clock_out_if_needed(p_entry_id uuid)
RETURNS TABLE(was_clocked_out boolean, clock_out_at timestamptz, reason text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_entry public.progress_entries%ROWTYPE;
  v_end timestamptz;
BEGIN
  SELECT * INTO v_entry FROM public.progress_entries WHERE id = p_entry_id FOR UPDATE;
  IF NOT FOUND OR v_entry.clock_out_at IS NOT NULL OR v_entry.clock_in_at IS NULL THEN
    RETURN QUERY SELECT false, v_entry.clock_out_at, NULL::text;
    RETURN;
  END IF;
  IF v_entry.outside_geofence_since IS NOT NULL
     AND now() - v_entry.outside_geofence_since >= interval '15 minutes' THEN
    v_end := greatest(v_entry.clock_in_at, v_entry.outside_geofence_since);
    UPDATE public.progress_entries SET
      clock_out_at = v_end,
      auto_clocked_out = true,
      auto_clock_out_reason = 'Left site geofence for more than 15 minutes',
      updated_at = now()
    WHERE id = p_entry_id;
    RETURN QUERY SELECT true, v_end, 'Left site geofence for more than 15 minutes'::text;
  ELSE
    RETURN QUERY SELECT false, NULL::timestamptz, NULL::text;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_geofence_state(p_entry_id uuid, p_lat numeric, p_lng numeric)
RETURNS TABLE(within_geofence boolean, outside_since timestamptz, auto_clocked_out boolean, clock_out_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_entry public.progress_entries%ROWTYPE;
  v_within boolean;
BEGIN
  IF p_lat IS NULL OR p_lng IS NULL OR NOT (p_lat BETWEEN -90 AND 90)
     OR NOT (p_lng BETWEEN -180 AND 180) THEN
    RAISE EXCEPTION 'Valid GPS coordinates required' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_entry FROM public.progress_entries WHERE id = p_entry_id FOR UPDATE;
  IF NOT FOUND OR v_entry.clock_out_at IS NOT NULL THEN
    RETURN QUERY SELECT false, v_entry.outside_geofence_since,
      v_entry.auto_clocked_out, v_entry.clock_out_at;
    RETURN;
  END IF;
  v_within := public.is_within_geofence(v_entry.site_id, p_lat, p_lng);
  UPDATE public.progress_entries SET
    last_known_lat = p_lat, last_known_lng = p_lng, last_location_at = now(),
    outside_geofence_since = CASE WHEN v_within THEN NULL
      ELSE coalesce(v_entry.outside_geofence_since, now()) END
  WHERE id = p_entry_id;
  -- One closure implementation for heartbeat and the scheduled sweep.
  PERFORM public.auto_clock_out_if_needed(p_entry_id);
  SELECT * INTO v_entry FROM public.progress_entries WHERE id = p_entry_id;
  RETURN QUERY SELECT v_within, v_entry.outside_geofence_since,
    v_entry.auto_clocked_out, v_entry.clock_out_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_progress_to_hour_entries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user_id uuid;
  v_ledger public.hour_entries%ROWTYPE;
  v_hour_entry_id uuid;
BEGIN
  SELECT a.user_id INTO v_user_id FROM public.apprentices a WHERE a.id = NEW.apprentice_id;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO v_ledger FROM public.hour_entries
    WHERE progress_entry_id = NEW.id FOR UPDATE;
  IF NEW.hour_entry_id IS NOT NULL AND
     (v_ledger.id IS NULL OR v_ledger.id <> NEW.hour_entry_id) THEN
    RAISE EXCEPTION 'Timeclock ledger link mismatch for shift %', NEW.id USING ERRCODE = '23514';
  END IF;
  IF v_ledger.id IS NOT NULL AND v_ledger.status IN ('approved', 'locked') THEN
    IF NEW.clock_out_at IS NULL
       OR v_ledger.hours_claimed IS DISTINCT FROM NEW.hours_worked
       OR v_ledger.work_date IS DISTINCT FROM NEW.work_date
       OR v_ledger.user_id IS DISTINCT FROM v_user_id
       OR (TG_OP = 'UPDATE' AND
         ROW(OLD.clock_in_at, OLD.clock_out_at, OLD.lunch_start_at, OLD.lunch_end_at, OLD.break_minutes)
         IS DISTINCT FROM
         ROW(NEW.clock_in_at, NEW.clock_out_at, NEW.lunch_start_at, NEW.lunch_end_at, NEW.break_minutes)) THEN
      RAISE EXCEPTION 'Shift % has approved or locked hours; use the attendance review workflow', NEW.id
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.clock_out_at IS NULL THEN
    IF v_ledger.id IS NOT NULL THEN
      RAISE EXCEPTION 'A shift with linked hours cannot be reopened; use attendance review' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  -- Keep zero-duration attendance evidence without inventing payable hours or
  -- weakening the existing ledger's positive-claim constraint.
  IF coalesce(NEW.hours_worked, 0) <= 0 THEN
    IF v_ledger.id IS NOT NULL THEN
      RAISE EXCEPTION 'A linked claim cannot become zero hours; use attendance review' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  INSERT INTO public.hour_entries
    (user_id, source_type, work_date, hours_claimed, status, entered_by_email, entered_at, progress_entry_id)
  VALUES (v_user_id, 'timeclock', NEW.work_date, coalesce(NEW.hours_worked, 0),
    'pending', 'timeclock@system', now(), NEW.id)
  ON CONFLICT (progress_entry_id) DO UPDATE SET
    hours_claimed = EXCLUDED.hours_claimed,
    work_date = EXCLUDED.work_date
  WHERE public.hour_entries.status IN ('pending', 'rejected')
    AND ROW(public.hour_entries.hours_claimed, public.hour_entries.work_date)
        IS DISTINCT FROM ROW(EXCLUDED.hours_claimed, EXCLUDED.work_date)
  RETURNING id INTO v_hour_entry_id;
  v_hour_entry_id := coalesce(v_hour_entry_id, v_ledger.id);
  IF NEW.hour_entry_id IS DISTINCT FROM v_hour_entry_id THEN
    UPDATE public.progress_entries SET hour_entry_id = v_hour_entry_id WHERE id = NEW.id;
  END IF;
  IF v_ledger.id IS NOT NULL AND
     ROW(v_ledger.hours_claimed, v_ledger.work_date) IS DISTINCT FROM ROW(NEW.hours_worked, NEW.work_date) THEN
    INSERT INTO public.audit_logs (action, actor_id, target_type, target_id, metadata)
    VALUES ('timeclock_ledger_synchronized', auth.uid(), 'hour_entries', v_ledger.id,
      jsonb_build_object('progress_entry_id', NEW.id, 'previous_hours', v_ledger.hours_claimed,
        'hours_claimed', NEW.hours_worked, 'previous_date', v_ledger.work_date,
        'work_date', NEW.work_date, 'status', v_ledger.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_progress_to_hours
AFTER INSERT OR UPDATE OF clock_in_at, clock_out_at, lunch_start_at, lunch_end_at,
  break_minutes, hours_worked, work_date ON public.progress_entries
FOR EACH ROW EXECUTE FUNCTION public.sync_progress_to_hour_entries();

REVOKE ALL ON FUNCTION public.auto_clock_out_if_needed(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_geofence_state(uuid, numeric, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_progress_to_hour_entries() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_clock_out_if_needed(uuid),
  public.update_geofence_state(uuid, numeric, numeric), public.sync_progress_to_hour_entries() TO service_role;
