-- =============================================================================
-- AI ENGINEERING STUDIO - Comprehensive Database Schema
-- Architecture: AI Development | Engineering | Verification | Knowledge | Education | Workforce
-- =============================================================================

-- =============================================================================
-- SECTION 1: AI DEVELOPMENT STUDIO
-- =============================================================================

-- Model configurations for multi-model routing
CREATE TABLE IF NOT EXISTS ai_model_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'groq', 'local', 'ollama')),
    model_id TEXT NOT NULL,
    endpoint TEXT,
    api_key_ref TEXT,
    capabilities TEXT[] DEFAULT '{}',
    max_tokens INTEGER DEFAULT 4096,
    temperature_range JSONB DEFAULT '{"min": 0, "max": 2}',
    cost_per_1k_input FLOAT DEFAULT 0,
    cost_per_1k_output FLOAT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent definitions
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    agent_type TEXT NOT NULL CHECK (agent_type IN (
        'reasoning', 'coding', 'review', 'testing', 'research',
        'engineering', 'compliance', 'grant_writer', 'marketing',
        'healthcare', 'education', 'cfd', 'custom'
    )),
    system_prompt TEXT,
    model_config_id UUID REFERENCES ai_model_configs(id),
    capabilities TEXT[] DEFAULT '{}',
    tools TEXT[] DEFAULT '{}',
    max_iterations INTEGER DEFAULT 10,
    timeout_seconds INTEGER DEFAULT 300,
    temperature FLOAT DEFAULT 0.7,
    tools_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent collaboration workflows
CREATE TABLE IF NOT EXISTS agent_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    workflow_type TEXT NOT NULL CHECK (workflow_type IN (
        'sequential', 'parallel', 'debate', 'review', 'ensemble', 'hierarchy'
    )),
    steps JSONB NOT NULL DEFAULT '[]',
    agent_ids UUID[] NOT NULL,
    routing_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt templates library
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAG Knowledge base entries
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'manual', 'upload', 'scrape', 'api', '生成', 'document'
    )),
    source_url TEXT,
    source_metadata JSONB DEFAULT '{}',
    chunk_size INTEGER DEFAULT 512,
    chunk_overlap INTEGER DEFAULT 50,
    embedding_model TEXT,
    embedding_vector OID,
    metadata JSONB DEFAULT '{}',
    is_indexed BOOLEAN DEFAULT false,
    indexed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation sessions
CREATE TABLE IF NOT EXISTS studio_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT,
    agent_id UUID REFERENCES ai_agents(id),
    messages JSONB DEFAULT '[]',
    context JSONB DEFAULT '{}',
    model_config_id UUID REFERENCES ai_model_configs(id),
    total_tokens INTEGER DEFAULT 0,
    cost FLOAT DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECTION 2: ENGINEERING STUDIO
-- =============================================================================

-- OpenFOAM Cases
CREATE TABLE IF NOT EXISTS openfoam_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    case_type TEXT NOT NULL CHECK (case_type IN (
        'incompressible', 'compressible', 'multiphase', 'combustion',
        'heat_transfer', 'dpm', 'dem', 'les', 'dns'
    )),
    solver TEXT NOT NULL,
    turbulence_model TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'validated', 'submitted', 'running', 'completed', 'failed'
    )),
    case_files JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    boundaries JSONB DEFAULT '[]',
    mesh_info JSONB,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CFD Jobs
CREATE TABLE IF NOT EXISTS cfd_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES openfoam_cases(id),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'timeout'
    )),
    worker_id TEXT,
    cpu_limit INTEGER DEFAULT 4,
    memory_limit_mb INTEGER DEFAULT 8192,
    time_limit_seconds INTEGER DEFAULT 3600,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    execution_time_seconds INTEGER,
    input_files JSONB DEFAULT '{}',
    output_log TEXT,
    residual_history JSONB DEFAULT '[]',
    field_data JSONB DEFAULT '{}',
    error_message TEXT,
    metrics JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Python scripts
CREATE TABLE IF NOT EXISTS python_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language TEXT DEFAULT 'python' CHECK (language IN ('python', 'julia', 'r')),
    requirements JSONB DEFAULT '[]',
    input_schema JSONB,
    output_schema JSONB,
    execution_config JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Python executions
CREATE TABLE IF NOT EXISTS python_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES python_scripts(id),
    name TEXT,
    input_data JSONB DEFAULT '{}',
    output_data JSONB,
    execution_time_ms INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'timeout'
    )),
    error_message TEXT,
    logs TEXT,
    worker_id TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Sandbox workspaces
CREATE TABLE IF NOT EXISTS sandbox_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    workspace_type TEXT NOT NULL CHECK (workspace_type IN (
        'python', 'docker', 'openfoam', 'jupyter', 'terminal'
    )),
    container_id TEXT,
    status TEXT DEFAULT 'stopped' CHECK (status IN (
        'stopped', 'starting', 'running', 'paused', 'error'
    )),
    config JSONB DEFAULT '{}',
    resources JSONB DEFAULT '{"cpu": 2, "memory_mb": 4096}',
    current_user UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ
);

-- =============================================================================
-- SECTION 3: VERIFICATION STUDIO
-- =============================================================================

-- Verification tasks (evaluation definitions)
CREATE TABLE IF NOT EXISTS verification_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    domain TEXT NOT NULL CHECK (domain IN (
        'courses', 'paris', 'admissions', 'compliance', 'grants',
        'apprenticeships', 'marketing', 'cfd', 'code', 'general'
    )),
    category TEXT,
    objective TEXT NOT NULL,
    required_inputs JSONB DEFAULT '[]',
    constraints JSONB DEFAULT '[]',
    expected_output JSONB,
    checker_ids UUID[] DEFAULT '{}',
    rubric_id UUID,
    reference_id UUID,
    test_case_ids UUID[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_validation', 'pending_review', 'approved', 'rejected', 'archived'
    )),
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deterministic checkers
CREATE TABLE IF NOT EXISTS verification_checkers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES verification_tasks(id),
    name TEXT NOT NULL,
    checker_type TEXT NOT NULL CHECK (checker_type IN (
        'required_fields', 'regex_match', 'range_check', 'mapping_complete',
        'relationship_valid', 'custom', 'syntax', 'boundary', 'convergence'
    )),
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    error_message TEXT,
    severity TEXT DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'info')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scoring rubrics
CREATE TABLE IF NOT EXISTS verification_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES verification_tasks(id),
    name TEXT NOT NULL,
    description TEXT,
    categories JSONB NOT NULL DEFAULT '{}',
    category_weights JSONB NOT NULL DEFAULT '{}',
    pass_threshold FLOAT DEFAULT 70,
    grade_thresholds JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification results
CREATE TABLE IF NOT EXISTS verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES verification_tasks(id),
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    checker_results JSONB DEFAULT '[]',
    rubric_scores JSONB,
    overall_score FLOAT,
    pass BOOLEAN NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'passed', 'failed', 'needs_review'
    )),
    evaluator TEXT DEFAULT 'system' CHECK (evaluator IN ('system', 'human', 'hybrid')),
    execution_time_ms INTEGER,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    review_status TEXT DEFAULT 'draft' CHECK (review_status IN (
        'draft', 'pending', 'approved', 'rejected'
    )),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance rules
CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'validation', 'format', 'completeness', 'accuracy', 'safety', 'regulatory'
    )),
    domain TEXT,
    rule_definition JSONB NOT NULL,
    severity TEXT DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'info')),
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    effective_date TIMESTAMPTZ,
    expiration_date TIMESTAMPTZ,
    source_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regression test suites
CREATE TABLE IF NOT EXISTS regression_suites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    domain TEXT,
    test_cases JSONB NOT NULL DEFAULT '[]',
    expected_failures JSONB DEFAULT '[]',
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_run_result JSONB,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECTION 4: KNOWLEDGE STUDIO
-- =============================================================================

-- Knowledge entries
CREATE TABLE IF NOT EXISTS knowledge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN (
        'documentation', 'standard', 'regulation', 'reference',
        'guide', 'example', 'faq', 'tutorial', 'policy'
    )),
    domain TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    source_type TEXT,
    source_url TEXT,
    authority TEXT,
    effective_date TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge versions
CREATE TABLE IF NOT EXISTS knowledge_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES knowledge_entries(id) NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    change_summary TEXT,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standards registry
CREATE TABLE IF NOT EXISTS standards_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_id TEXT NOT NULL,
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    version TEXT,
    category TEXT,
    scope TEXT,
    url TEXT,
    effective_date TIMESTAMPTZ,
    requirements JSONB DEFAULT '[]',
    compliance_checks JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regulations database
CREATE TABLE IF NOT EXISTS regulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction TEXT NOT NULL,
    agency TEXT,
    regulation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    url TEXT,
    effective_date TIMESTAMPTZ,
    requirements JSONB DEFAULT '[]',
    penalties JSONB,
    exemptions JSONB,
    related_regulations UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECTION 5: EDUCATION STUDIO
-- =============================================================================

-- Course definitions
CREATE TABLE IF NOT EXISTS course_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    provider TEXT,
    accreditation_info JSONB,
    clock_hours FLOAT,
    competency_mapping JSONB DEFAULT '{}',
    approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN (
        'draft', 'pending_review', 'approved', 'rejected', 'expired'
    )),
    approval_documents JSONB DEFAULT '[]',
    version INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum structures
CREATE TABLE IF NOT EXISTS curriculum_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES course_definitions(id),
    name TEXT NOT NULL,
    description TEXT,
    structure_type TEXT CHECK (structure_type IN (
        'sequence', 'prerequisite', 'competency', 'milestone'
    )),
    items JSONB NOT NULL DEFAULT '[]',
    alignment JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competency definitions
CREATE TABLE IF NOT EXISTS competency_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    level TEXT CHECK (level IN ('introductory', 'intermediate', 'advanced', 'expert')),
    assessment_methods JSONB DEFAULT '[]',
    prerequisites UUID[] DEFAULT '{}',
    related_standards JSONB DEFAULT '[]',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment definitions
CREATE TABLE IF NOT EXISTS assessment_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN (
        'quiz', 'exam', 'project', 'practical', 'portfolio', 'self_assessment'
    )),
    questions JSONB DEFAULT '[]',
    passing_score FLOAT DEFAULT 70,
    time_limit_minutes INTEGER,
    allowed_attempts INTEGER,
    competency_ids UUID[] DEFAULT '{}',
    rubric JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECTION 6: AI WORKFORCE STUDIO
-- =============================================================================

-- Specialized agent templates
CREATE TABLE IF NOT EXISTS workforce_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    domain TEXT NOT NULL CHECK (domain IN (
        'engineering', 'healthcare', 'grants', 'compliance',
        'marketing', 'education', 'legal', 'finance', 'operations'
    )),
    specialization TEXT,
    system_prompt TEXT NOT NULL,
    model_config JSONB DEFAULT '{}',
    tools JSONB DEFAULT '[]',
    workflows JSONB DEFAULT '[]',
    sample_tasks JSONB DEFAULT '[]',
    performance_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent task assignments
CREATE TABLE IF NOT EXISTS agent_task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES workforce_agents(id),
    task_name TEXT NOT NULL,
    task_description TEXT,
    input_data JSONB DEFAULT '{}',
    output_data JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled'
    )),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_log JSONB DEFAULT '[]',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECTION 7: UNIFIED ORCHESTRATION
-- =============================================================================

-- Evidence aggregation for AI outputs
CREATE TABLE IF NOT EXISTS evidence_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN (
        'ai_generated', 'code_execution', 'simulation', 'document',
        'rule_validation', 'human_review', 'reference', 'test_result'
    )),
    source_id TEXT,
    evidence_type TEXT NOT NULL,
    evidence_content JSONB NOT NULL,
    confidence_score FLOAT,
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN (
        'pending', 'valid', 'invalid', 'uncertain'
    )),
    validation_method TEXT,
    related_evidence UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Confidence scoring history
CREATE TABLE IF NOT EXISTS confidence_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    overall_score FLOAT NOT NULL,
    component_scores JSONB DEFAULT '{}',
    evidence_count INTEGER DEFAULT 0,
    validation_count INTEGER DEFAULT 0,
    model_confidence FLOAT,
    deterministic_confidence FLOAT,
    human_confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow execution history
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID,
    workflow_type TEXT NOT NULL,
    workflow_name TEXT,
    status TEXT DEFAULT 'running' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled'
    )),
    steps JSONB DEFAULT '[]',
    current_step INTEGER DEFAULT 0,
    input_data JSONB DEFAULT '{}',
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- =============================================================================
-- SECTION 8: INDEXES
-- =============================================================================

CREATE INDEX idx_ai_agents_type ON ai_agents(agent_type);
CREATE INDEX idx_ai_agents_active ON ai_agents(is_active);
CREATE INDEX idx_rag_documents_indexed ON rag_documents(is_indexed);
CREATE INDEX idx_rag_documents_source ON rag_documents(source_type);
CREATE INDEX idx_conversations_user ON studio_conversations(user_id);
CREATE INDEX idx_conversations_agent ON studio_conversations(agent_id);
CREATE INDEX idx_openfoam_cases_type ON openfoam_cases(case_type);
CREATE INDEX idx_openfoam_cases_status ON openfoam_cases(status);
CREATE INDEX idx_cfd_jobs_status ON cfd_jobs(status);
CREATE INDEX idx_cfd_jobs_case ON cfd_jobs(case_id);
CREATE INDEX idx_verification_tasks_domain ON verification_tasks(domain);
CREATE INDEX idx_verification_tasks_status ON verification_tasks(status);
CREATE INDEX idx_verification_results_task ON verification_results(task_id);
CREATE INDEX idx_verification_results_status ON verification_results(status);
CREATE INDEX idx_compliance_rules_type ON compliance_rules(rule_type);
CREATE INDEX idx_compliance_rules_active ON compliance_rules(is_active);
CREATE INDEX idx_knowledge_entries_type ON knowledge_entries(entry_type);
CREATE INDEX idx_knowledge_entries_domain ON knowledge_entries(domain);
CREATE INDEX idx_knowledge_entries_published ON knowledge_entries(is_published);
CREATE INDEX idx_standards_registry_org ON standards_registry(organization);
CREATE INDEX idx_regulations_jurisdiction ON regulations(jurisdiction);
CREATE INDEX idx_course_definitions_status ON course_definitions(approval_status);
CREATE INDEX idx_workforce_agents_domain ON workforce_agents(domain);
CREATE INDEX idx_workforce_agents_active ON workforce_agents(is_active);
CREATE INDEX idx_agent_assignments_status ON agent_task_assignments(status);
CREATE INDEX idx_evidence_source ON evidence_records(source_type);
CREATE INDEX idx_confidence_history_source ON confidence_history(source_type, source_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);

-- =============================================================================
-- SECTION 9: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE ai_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE openfoam_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfd_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE python_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE python_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_checkers ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE regression_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidence_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Default policies: users can only see their own data
CREATE POLICY "Users can manage own conversations" ON studio_conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cases" ON openfoam_cases
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own jobs" ON cfd_jobs
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own scripts" ON python_scripts
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own executions" ON python_executions
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own workspaces" ON sandbox_workspaces
    FOR ALL USING (auth.uid() = current_user);

CREATE POLICY "Users can manage own verification tasks" ON verification_tasks
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own results" ON verification_results
    FOR ALL USING (auth.uid() = created_by OR auth.uid() = reviewed_by);

CREATE POLICY "Users can manage own knowledge" ON knowledge_entries
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own courses" ON course_definitions
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own assignments" ON agent_task_assignments
    FOR ALL USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can manage own workflows" ON workflow_executions
    FOR ALL USING (auth.uid() = created_by);

-- Public read for active agents, models, and published content
CREATE POLICY "Public read active agents" ON ai_agents
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active models" ON ai_model_configs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read published knowledge" ON knowledge_entries
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public read active compliance rules" ON compliance_rules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active standards" ON standards_registry
    FOR SELECT USING (is_active = true);

-- =============================================================================
-- SECTION 10: FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_model_configs_updated_at BEFORE UPDATE ON ai_model_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_rag_documents_updated_at BEFORE UPDATE ON rag_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_studio_conversations_updated_at BEFORE UPDATE ON studio_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_openfoam_cases_updated_at BEFORE UPDATE ON openfoam_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cfd_jobs_updated_at BEFORE UPDATE ON cfd_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_python_scripts_updated_at BEFORE UPDATE ON python_scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_verification_tasks_updated_at BEFORE UPDATE ON verification_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_verification_checkers_updated_at BEFORE UPDATE ON verification_checkers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_verification_rubrics_updated_at BEFORE UPDATE ON verification_rubrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_knowledge_entries_updated_at BEFORE UPDATE ON knowledge_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_course_definitions_updated_at BEFORE UPDATE ON course_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workforce_agents_updated_at BEFORE UPDATE ON workforce_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate confidence score
CREATE OR REPLACE FUNCTION calculate_confidence_score(
    p_model_confidence FLOAT,
    p_deterministic_score FLOAT,
    p_validation_count INTEGER,
    p_evidence_count INTEGER
)
RETURNS FLOAT AS $$
DECLARE
    v_score FLOAT;
BEGIN
    v_score := (
        (COALESCE(p_model_confidence, 0) * 0.4) +
        (COALESCE(p_deterministic_score, 0) * 0.4) +
        (LEAST(p_validation_count, 5) * 0.04) +
        (LEAST(p_evidence_count, 5) * 0.04)
    );
    RETURN ROUND(v_score * 100) / 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
