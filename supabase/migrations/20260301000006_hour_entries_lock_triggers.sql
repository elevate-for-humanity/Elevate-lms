-- Enforce immutability on locked hour entries.
-- Once status = 'locked', the row cannot be updated or deleted.
-- This is required for WIOA/RAPIDS audit compliance.

CREATE OR REPLACE FUNCTION public.prevent_locked_hour_entry_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'locked' THEN
    RAISE EXCEPTION 'Cannot modify a locked hour entry (id: %)', OLD.id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_locked_hour_entry_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'locked' THEN
    RAISE EXCEPTION 'Cannot delete a locked hour entry (id: %)', OLD.id
      USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_locked_update ON public.hour_entries;
CREATE TRIGGER trg_prevent_locked_update
  BEFORE UPDATE ON public.hour_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_locked_hour_entry_update();

DROP TRIGGER IF EXISTS trg_prevent_locked_delete ON public.hour_entries;
CREATE TRIGGER trg_prevent_locked_delete
  BEFORE DELETE ON public.hour_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_locked_hour_entry_delete();
