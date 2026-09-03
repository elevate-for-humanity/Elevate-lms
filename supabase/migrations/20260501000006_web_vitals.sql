-- Web vitals telemetry table.
-- Receives Core Web Vitals from the browser via /api/analytics/web-vitals.
-- No PII — stores metric name, value, rating, and page URL only.

CREATE TABLE IF NOT EXISTS public.web_vitals (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text NOT NULL,
  value            numeric,
  rating           text,
  delta            numeric,
  metric_id        text,
  navigation_type  text,
  user_agent       text,
  url              text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS web_vitals_name_idx       ON public.web_vitals (name);
CREATE INDEX IF NOT EXISTS web_vitals_created_at_idx ON public.web_vitals (created_at DESC);

COMMENT ON TABLE public.web_vitals IS
  'Core Web Vitals telemetry from /api/analytics/web-vitals. No PII.';
