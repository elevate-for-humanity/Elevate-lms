-- PARIS AI Operating System - Database Schema
-- Run this migration to create all tables for the PARIS system

-- =====================================================
-- AI WORKFORCE TABLES
-- =====================================================

-- AI Agents
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'training' CHECK (status IN ('active', 'inactive', 'training', 'on_break', 'error')),
    avatar TEXT,
    voice_enabled BOOLEAN DEFAULT false,
    voice_type TEXT DEFAULT 'professional',
    
    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    permissions JSONB NOT NULL DEFAULT '{}',
    tools TEXT[] DEFAULT '{}',
    
    -- Metrics
    metrics JSONB NOT NULL DEFAULT '{
        "totalTasks": 0,
        "completedTasks": 0,
        "failedTasks": 0,
        "averageResponseTime": 0,
        "averageResolutionTime": 0,
        "escalationRate": 0,
        "firstContactResolution": 0,
        "activeHours": 0,
        "tasksByCategory": {},
        "recentErrors": []
    }',
    
    -- Metadata
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_clone BOOLEAN DEFAULT false,
    clone_of UUID REFERENCES ai_agents(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Activities
CREATE TABLE IF NOT EXISTS agent_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task', 'conversation', 'approval_request', 'escalation', 'error')),
    action TEXT NOT NULL,
    input JSONB,
    output JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'approved', 'rejected')),
    duration INTEGER,
    user_id UUID REFERENCES auth.users(id),
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    error TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Memories
CREATE TABLE IF NOT EXISTS agent_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('short_term', 'long_term', 'episodic', 'semantic')),
    content JSONB NOT NULL DEFAULT '{}',
    importance NUMERIC(3,2) DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Agent Knowledge Base
CREATE TABLE IF NOT EXISTS agent_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('document', 'conversation', 'manual', 'result')),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(1536),
    usage_count INTEGER DEFAULT 0,
    relevance NUMERIC(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Approval Workflows
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    requested_by UUID NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    comments TEXT,
    auto_approved BOOLEAN DEFAULT false,
    conditions JSONB
);

-- =====================================================
-- MARKETING TABLES
-- =====================================================

-- Brand Guidelines
CREATE TABLE IF NOT EXISTS brand_guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    colors JSONB NOT NULL DEFAULT '{"primary": "#DC2626", "secondary": "#1E3A5F", "accent": "#F59E0B"}',
    fonts JSONB NOT NULL DEFAULT '{"heading": "Inter", "body": "Inter"}',
    logo_url TEXT,
    tagline TEXT,
    voice JSONB NOT NULL DEFAULT '{"tone": "professional", "values": [], "examples": []}',
    hashtags TEXT[] DEFAULT '{}',
    mentions TEXT[] DEFAULT '{}',
    cta TEXT DEFAULT 'Apply Now',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Content
CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    platform TEXT[] NOT NULL,
    text TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    media JSONB,
    meta JSONB,
    word_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    org_id UUID REFERENCES auth.users(id)
);

-- Scheduled Posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES generated_content(id) ON DELETE SET NULL,
    platform TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'archived')),
    published_at TIMESTAMPTZ,
    published_url TEXT,
    media_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    org_id UUID REFERENCES auth.users(id)
);

-- Published Posts
CREATE TABLE IF NOT EXISTS published_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES generated_content(id) ON DELETE SET NULL,
    platform TEXT NOT NULL,
    post_id TEXT NOT NULL,
    published_url TEXT,
    text TEXT NOT NULL,
    hashtags TEXT[],
    metrics JSONB,
    status TEXT NOT NULL DEFAULT 'published',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    org_id UUID REFERENCES auth.users(id)
);

-- Video Scripts
CREATE TABLE IF NOT EXISTS video_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    hook TEXT NOT NULL,
    scenes JSONB NOT NULL DEFAULT '[]',
    cta TEXT,
    duration INTEGER,
    voiceover TEXT,
    music TEXT,
    hashtags TEXT[],
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'recorded', 'published')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    org_id UUID REFERENCES auth.users(id)
);

-- Content Calendar
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    platform TEXT NOT NULL,
    content_id UUID REFERENCES generated_content(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'scheduled', 'published', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    org_id UUID REFERENCES auth.users(id)
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    goals JSONB DEFAULT '[]',
    budget NUMERIC(10,2),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
    metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    org_id UUID REFERENCES auth.users(id)
);

-- =====================================================
-- IMPORT ENGINE TABLES
-- =====================================================

-- Import Projects
CREATE TABLE IF NOT EXISTS import_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT,
    status TEXT DEFAULT 'analyzing' CHECK (status IN ('analyzing', 'importing', 'completed', 'failed')),
    analysis JSONB,
    compatibility JSONB,
    mapping JSONB,
    errors JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    org_id UUID REFERENCES auth.users(id)
);

-- Imported Components
CREATE TABLE IF NOT EXISTS imported_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES import_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    source_file TEXT,
    target_location TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'imported', 'conflicted', 'skipped')),
    conflict_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ai_agents_owner ON ai_agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_role ON ai_agents(role);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);

CREATE INDEX IF NOT EXISTS idx_agent_activities_agent ON agent_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_timestamp ON agent_activities(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_agent_memories_agent ON agent_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_type ON agent_memories(type);

CREATE INDEX IF NOT EXISTS idx_agent_knowledge_agent ON agent_knowledge(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_embedding ON agent_knowledge USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_agent ON approval_workflows(agent_id);

CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(type);
CREATE INDEX IF NOT EXISTS idx_generated_content_platform ON generated_content USING gin(platform);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

CREATE INDEX IF NOT EXISTS idx_published_posts_platform ON published_posts(platform);
CREATE INDEX IF NOT EXISTS idx_published_posts_published_at ON published_posts(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_platform ON content_calendar(platform);

CREATE INDEX IF NOT EXISTS idx_import_projects_status ON import_projects(status);
CREATE INDEX IF NOT EXISTS idx_import_projects_source ON import_projects(source);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ai_agents
CREATE OR REPLACE TRIGGER ai_agents_updated_at
    BEFORE UPDATE ON ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger for agent_knowledge
CREATE OR REPLACE TRIGGER agent_knowledge_updated_at
    BEFORE UPDATE ON agent_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger for video_scripts
CREATE OR REPLACE TRIGGER video_scripts_updated_at
    BEFORE UPDATE ON video_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger for campaigns
CREATE OR REPLACE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger for published_posts
CREATE OR REPLACE TRIGGER published_posts_updated_at
    BEFORE UPDATE ON published_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Update agent metrics function
CREATE OR REPLACE FUNCTION update_agent_metrics(
    p_agent_id UUID,
    p_metrics JSONB
)
RETURNS VOID AS $$
BEGIN
    UPDATE ai_agents
    SET metrics = metrics || p_metrics
    WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired memories
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM agent_memories
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agents
CREATE POLICY ai_agents_select ON ai_agents
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY ai_agents_insert ON ai_agents
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY ai_agents_update ON ai_agents
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY ai_agents_delete ON ai_agents
    FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for other tables follow similar pattern
-- (omitted for brevity - add as needed for your security requirements)

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE ai_agents IS 'AI workforce agents with roles, permissions, and metrics';
COMMENT ON TABLE agent_activities IS 'Activity logs for AI agent actions and conversations';
COMMENT ON TABLE agent_memories IS 'Short-term and long-term memory storage for agents';
COMMENT ON TABLE agent_knowledge IS 'Persistent knowledge base for AI agents';
COMMENT ON TABLE approval_workflows IS 'Human-in-the-loop approval workflows';
COMMENT ON TABLE brand_guidelines IS 'Organization brand guidelines for content generation';
COMMENT ON TABLE generated_content IS 'AI-generated marketing content';
COMMENT ON TABLE scheduled_posts IS 'Scheduled social media posts';
COMMENT ON TABLE published_posts IS 'Published social media posts with metrics';
COMMENT ON TABLE video_scripts IS 'Generated video scripts for reels and shorts';
COMMENT ON TABLE content_calendar IS 'Content calendar for scheduling';
COMMENT ON TABLE campaigns IS 'Marketing campaigns';
COMMENT ON TABLE import_projects IS 'External codebase/API import projects';
COMMENT ON TABLE imported_components IS 'Components imported from external sources';
