-- W008: modules table missing module_type column
-- Admin /admin/modules filters and inserts on this column.
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS module_type text NOT NULL DEFAULT 'lesson'
    CHECK (module_type IN ('lesson', 'scorm', 'assessment', 'lab', 'checkpoint'));

COMMENT ON COLUMN public.modules.module_type IS
  'Discriminator for module rendering: lesson | scorm | assessment | lab | checkpoint';
