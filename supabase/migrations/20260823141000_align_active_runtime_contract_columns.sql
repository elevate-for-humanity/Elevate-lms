-- Align live runtime tables with fields already consumed by canonical application code.
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.job_queue ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS job_queue_set_updated_at ON public.job_queue;
CREATE TRIGGER job_queue_set_updated_at BEFORE UPDATE ON public.job_queue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
