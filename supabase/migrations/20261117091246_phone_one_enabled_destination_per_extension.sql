-- Keep references and call history intact; pause only surplus live routes.
-- Prefer the current default, then menu target, then linked destination.
LOCK TABLE public.phone_destinations IN SHARE ROW EXCLUSIVE MODE;
WITH ranked AS (
  SELECT d.id, row_number() OVER (
    PARTITION BY d.phone_system_id, d.extension_id
    ORDER BY (s.default_destination_id = d.id) DESC NULLS LAST,
      EXISTS (SELECT 1 FROM public.phone_menu_options m
              WHERE m.phone_system_id = d.phone_system_id AND m.destination_id = d.id AND m.enabled) DESC,
      (e.destination_id = d.id) DESC NULLS LAST, d.created_at, d.id
  ) AS route_rank
  FROM public.phone_destinations d
  JOIN public.phone_systems s ON s.id = d.phone_system_id
  LEFT JOIN public.communication_extensions e ON e.id = d.extension_id
  WHERE d.destination_type = 'webrtc' AND d.enabled AND d.extension_id IS NOT NULL
)
UPDATE public.phone_destinations d SET enabled = false, updated_at = now()
FROM ranked r WHERE d.id = r.id AND r.route_rank > 1;
CREATE UNIQUE INDEX IF NOT EXISTS phone_destinations_one_enabled_extension
  ON public.phone_destinations (phone_system_id, extension_id)
  WHERE destination_type = 'webrtc' AND enabled AND extension_id IS NOT NULL;
