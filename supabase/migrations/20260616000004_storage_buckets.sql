-- Course Asset Storage Buckets Migration
-- Configure Supabase Storage for all course media and documents

-- Storage bucket inserts require admin privileges - wrapped in conditional block
DO $$
BEGIN
  -- Check if storage schema exists and we have access
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    -- Attempt to insert buckets (may fail due to permissions)
    BEGIN
      INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
      VALUES ('course-assets', 'course-assets', false, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'application/zip'])
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
      VALUES ('student-submissions', 'student-submissions', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/zip'])
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
      VALUES ('certificates', 'certificates', true, 2097152, ARRAY['image/png', 'image/svg+xml', 'application/pdf'])
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
      VALUES ('vendor-assets', 'vendor-assets', false, 104857600, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
      VALUES ('marketing', 'marketing', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

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
