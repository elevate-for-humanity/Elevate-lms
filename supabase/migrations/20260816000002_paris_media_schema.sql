-- PARIS Media Studio - Database Schema
-- Run this migration to add media tables

-- =====================================================
-- MEDIA TABLES
-- =====================================================

-- Media Items
CREATE TABLE IF NOT EXISTS media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Info
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'gif', 'document')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    alt_text TEXT,
    
    -- Source
    source TEXT NOT NULL CHECK (source IN ('pexels', 'pixabay', 'unsplash', 'brand_library', 'ai_generated', 'uploaded', 'favorites')),
    source_credit TEXT,
    source_url TEXT,
    
    -- Dimensions
    width INTEGER,
    height INTEGER,
    aspect_ratio TEXT,
    
    -- File Info
    file_size BIGINT,
    format TEXT,
    
    -- SEO
    tags TEXT[] DEFAULT '{}',
    seo_keywords TEXT[] DEFAULT '{}',
    
    -- Usage Tracking
    used_on TEXT[] DEFAULT '{}',
    used_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- AI Metadata
    ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    
    -- License
    license TEXT,
    requires_attribution BOOLEAN DEFAULT false
);

-- Media Collections
CREATE TABLE IF NOT EXISTS media_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    items TEXT[] DEFAULT '{}',
    type TEXT DEFAULT 'manual' CHECK (type IN ('auto', 'manual')),
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Assets
CREATE TABLE IF NOT EXISTS brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Logos
    logo_primary TEXT,
    logo_secondary TEXT,
    logo_icon TEXT,
    logo_dark TEXT,
    logo_light TEXT,
    
    -- Colors
    color_primary TEXT DEFAULT '#DC2626',
    color_secondary TEXT DEFAULT '#1E3A5F',
    color_accent TEXT DEFAULT '#F59E0B',
    color_text TEXT DEFAULT '#1F2937',
    color_background TEXT DEFAULT '#FFFFFF',
    
    -- Fonts
    font_heading TEXT DEFAULT 'Inter',
    font_body TEXT DEFAULT 'Inter',
    
    -- Assets (stored as JSONB)
    icons JSONB DEFAULT '[]',
    backgrounds JSONB DEFAULT '[]',
    textures JSONB DEFAULT '[]',
    templates JSONB DEFAULT '[]',
    watermarks JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_media_items_org ON media_items(org_id);
CREATE INDEX IF NOT EXISTS idx_media_items_source ON media_items(source);
CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_tags ON media_items USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_media_collections_org ON media_collections(org_id);
CREATE INDEX IF NOT EXISTS idx_media_collections_category ON media_collections(category);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for media_items
CREATE OR REPLACE TRIGGER media_items_updated_at
    BEFORE UPDATE ON media_items
    FOR EACH ROW
    EXECUTE FUNCTION update_media_updated_at();

-- Trigger for media_collections
CREATE OR REPLACE TRIGGER media_collections_updated_at
    BEFORE UPDATE ON media_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_media_updated_at();

-- Trigger for brand_assets
CREATE OR REPLACE TRIGGER brand_assets_updated_at
    BEFORE UPDATE ON brand_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_media_updated_at();

-- Track media usage function
CREATE OR REPLACE FUNCTION track_media_usage(
    p_media_id UUID,
    p_page_url TEXT,
    p_action TEXT
)
RETURNS VOID AS $$
DECLARE
    v_used_on TEXT[];
    v_used_count INTEGER;
BEGIN
    SELECT used_on, used_count INTO v_used_on, v_used_count
    FROM media_items WHERE id = p_media_id;
    
    IF p_action = 'add' THEN
        IF NOT (v_used_on @> ARRAY[p_page_url]) THEN
            v_used_on := array_append(v_used_on, p_page_url);
            v_used_count := v_used_count + 1;
        END IF;
    ELSIF p_action = 'remove' THEN
        v_used_on := array_remove(v_used_on, p_page_url);
        v_used_count := GREATEST(0, v_used_count - 1);
    END IF;
    
    UPDATE media_items
    SET used_on = v_used_on, used_count = v_used_count
    WHERE id = p_media_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_items
CREATE POLICY media_items_select ON media_items
    FOR SELECT USING (org_id IS NOT NULL);

CREATE POLICY media_items_insert ON media_items
    FOR INSERT WITH CHECK (org_id IS NOT NULL);

CREATE POLICY media_items_update ON media_items
    FOR UPDATE USING (org_id IS NOT NULL);

CREATE POLICY media_items_delete ON media_items
    FOR DELETE USING (org_id IS NOT NULL);

-- RLS Policies for media_collections
CREATE POLICY media_collections_select ON media_collections
    FOR SELECT USING (org_id IS NOT NULL);

CREATE POLICY media_collections_insert ON media_collections
    FOR INSERT WITH CHECK (org_id IS NOT NULL);

CREATE POLICY media_collections_update ON media_collections
    FOR UPDATE USING (org_id IS NOT NULL);

CREATE POLICY media_collections_delete ON media_collections
    FOR DELETE USING (org_id IS NOT NULL);

-- RLS Policies for brand_assets
CREATE POLICY brand_assets_select ON brand_assets
    FOR SELECT USING (org_id IS NOT NULL);

CREATE POLICY brand_assets_insert ON brand_assets
    FOR INSERT WITH CHECK (org_id IS NOT NULL);

CREATE POLICY brand_assets_update ON brand_assets
    FOR UPDATE USING (org_id IS NOT NULL);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE media_items IS 'Central media library for images, videos, and documents';
COMMENT ON TABLE media_collections IS 'Organized groups of media items';
COMMENT ON TABLE brand_assets IS 'Organization brand guidelines and assets';
