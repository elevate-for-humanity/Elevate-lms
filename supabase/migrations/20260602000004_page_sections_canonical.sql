-- page_sections: establish canonical schema.
--
-- The table was temporarily given three extra columns (section_type, content,
-- is_visible) during schema reconciliation. No code path ever wrote those
-- columns — all reads and writes use component/position/props exclusively.
-- This migration drops the three wrong columns and documents the canonical shape.
--
-- Canonical shape:
--   id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
--   page_id     uuid (FK to pages.id)
--   component   text NOT NULL
--   position    integer NOT NULL DEFAULT 0
--   props       jsonb NOT NULL DEFAULT '{}'
--   created_at  timestamptz DEFAULT now()
--   updated_at  timestamptz DEFAULT now()

ALTER TABLE public.page_sections
  DROP COLUMN IF EXISTS section_type,
  DROP COLUMN IF EXISTS content,
  DROP COLUMN IF EXISTS is_visible;
