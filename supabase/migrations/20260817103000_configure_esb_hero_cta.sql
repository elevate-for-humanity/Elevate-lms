-- Hero actions are authored data, not hard-coded learner UI text.
update public.course_visual_assets visual
set metadata = coalesce(visual.metadata, '{}'::jsonb) || jsonb_build_object(
      'autoplay', true,
      'muted', true,
      'loop', true,
      'brand', 'Elevate for Humanity',
      'cta_label', 'Start Elevate ESB'
    ),
    updated_at = now()
from public.courses course
where visual.course_id = course.id
  and visual.placement = 'hero'
  and course.slug in ('entrepreneurship','cert-prep-esb-us-v2','cert-prep-esb-universal');
