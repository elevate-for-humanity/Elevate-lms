-- Course Asset Storage Buckets Migration
-- Configure Supabase Storage for all course media and documents

-- Storage bucket inserts are managed via Supabase Dashboard
-- The buckets should be created manually in the Supabase Dashboard > Storage section

-- Storage folder structure helper function
CREATE OR REPLACE FUNCTION public.get_course_asset_path(
  course_slug TEXT,
  asset_type TEXT,
  filename TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN course_slug || '/' || asset_type || '/' || filename;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_course_asset_path TO authenticated;
