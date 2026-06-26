-- Course Asset Storage Buckets Migration
-- Configure Supabase Storage for all course media and documents

-- Create storage buckets (run in Supabase dashboard or via API)

-- Bucket 1: Course assets (images, videos, downloads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('course-assets', 'course-assets', false, 524288000, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'application/zip'])
ON CONFLICT DO NOTHING;

-- Bucket 2: Student submissions (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('student-submissions', 'student-submissions', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'application/zip'])
ON CONFLICT DO NOTHING;

-- Bucket 3: Certificates (public templates)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('certificates', 'certificates', true, 2097152, ARRAY['image/png', 'image/svg+xml', 'application/pdf'])
ON CONFLICT DO NOTHING;

-- Bucket 4: Vendor assets (NHA, Certiport, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('vendor-assets', 'vendor-assets', false, 104857600, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT DO NOTHING;

-- Bucket 5: Public marketing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('marketing', 'marketing', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT DO NOTHING;

-- Note: Storage bucket policies require Supabase admin privileges.
-- These are managed separately in the Supabase dashboard or via service_role.
-- The bucket INSERT statements above are informational - buckets may already exist.

-- Storage folder structure helper function
CREATE OR REPLACE FUNCTION storage.get_course_asset_path(
  course_slug TEXT,
  asset_type TEXT, -- 'hero', 'images', 'videos', 'downloads', 'worksheets', 'quizzes', 'certificates'
  filename TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN course_slug || '/' || asset_type || '/' || filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public function to get course asset URL
CREATE OR REPLACE FUNCTION storage.get_signed_course_url(
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