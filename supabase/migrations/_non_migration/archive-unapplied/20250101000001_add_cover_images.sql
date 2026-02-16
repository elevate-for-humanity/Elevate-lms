-- Add cover image fields to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_alt TEXT,
ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- Add cover image fields to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_alt TEXT,
ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- Add cover image fields to locations table (if exists)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_alt TEXT,
ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- Comment
COMMENT ON COLUMN programs.cover_image_url IS 'Supabase Storage URL for program cover image';
COMMENT ON COLUMN programs.cover_image_alt IS 'Alt text for cover image';
COMMENT ON COLUMN programs.excerpt IS 'Short description for page header';
