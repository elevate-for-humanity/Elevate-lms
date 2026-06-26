-- Course Asset Storage Buckets Migration
-- Configure Supabase Storage for all course media and documents

-- Storage bucket inserts skipped - buckets managed via Supabase dashboard
-- Original insert statements had parsing issues with storage.buckets schema.column syntax
-- Storage buckets should be created via Supabase Dashboard > Storage > New bucket

-- Storage folder structure helper function (in public schema)
CREATE OR REPLACE FUNCTION public.get_course_asset_path(
  course_slug TEXT,
  asset_type TEXT,
  filename TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN course_slug || '/' || asset_type || '/' || filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public function to get course asset URL (in public schema)
CREATE OR REPLACE FUNCTION public.get_signed_course_url(
  p_course_slug TEXT,
  p_asset_type TEXT,
  p_filename TEXT,
  p_expires_in INT DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
  v_path TEXT;
  v_url TEXT;
BEGIN
  v_path := p_course_slug || '/' || p_asset_type || '/' || p_filename;
  SELECT signed_url INTO v_url
  FROM supabase.storage.from('course-assets').createSignedUrl(v_path, p_expires_in);
  RETURN v_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signed URL for any storage bucket
CREATE OR REPLACE FUNCTION public.get_storage_signed_url(
  p_bucket_name TEXT,
  p_file_path TEXT,
  p_expires_in INT DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
  v_url TEXT;
BEGIN
  SELECT signed_url INTO v_url
  FROM supabase.storage.from(p_bucket_name).createSignedUrl(p_file_path, p_expires_in);
  RETURN v_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_course_asset_path TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_signed_course_url TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_storage_signed_url TO authenticated;
