import 'server-only';

export type MasterCapability =
  | 'course'
  | 'website'
  | 'media'
  | 'workflow'
  | 'repository'
  | 'browser'
  | 'runtime'
  | 'deployment'
  | 'data'
  | 'evaluation'
  | 'memory'
  | 'engineering';

export type CapabilityAdapter = {
  id: MasterCapability;
  authority: string;
  execution: 'tool-registry' | 'specialist' | 'runtime';
  retainedCapabilities: readonly string[];
};

export const MASTER_STUDIO_CAPABILITIES: readonly CapabilityAdapter[] = [
  { id: 'course', authority: 'Course Builder → Course Factory', execution: 'tool-registry', retainedCapabilities: ['curriculum','assessments','credentials','media','governance','publish-readiness'] },
  { id: 'website', authority: 'Website Builder', execution: 'tool-registry', retainedCapabilities: ['generate','import','edit','revision','domain','publish'] },
  { id: 'media', authority: 'Media Studio', execution: 'tool-registry', retainedCapabilities: ['Envato','licensed-assets','video','images','course-media','rendering'] },
  { id: 'workflow', authority: 'Studio Run Engine', execution: 'tool-registry', retainedCapabilities: ['definitions','triggers','dependencies','checkpoints','retry','resume'] },
  { id: 'repository', authority: 'Repository Workspace + GitHub', execution: 'runtime', retainedCapabilities: ['read','write','diff','commit','push','preview'] },
  { id: 'browser', authority: 'Northflank Studio Runtime', execution: 'runtime', retainedCapabilities: ['Chromium','Playwright','downloads','screenshots','audit','authenticated-sessions'] },
  { id: 'runtime', authority: 'Northflank Studio Runtime', execution: 'runtime', retainedCapabilities: ['filesystem','bash','git','node','pnpm','python','terminal'] },
  { id: 'deployment', authority: 'GitHub + Northflank', execution: 'tool-registry', retainedCapabilities: ['build','deploy','verify','rollback','health'] },
  { id: 'data', authority: 'Supabase', execution: 'tool-registry', retainedCapabilities: ['query','persistence','RLS','storage','realtime'] },
  { id: 'evaluation', authority: 'Studio Evaluation/Evidence', execution: 'tool-registry', retainedCapabilities: ['QA','validation','claims','evidence','auto-repair'] },
  { id: 'memory', authority: 'Governed Memory/RAG', execution: 'tool-registry', retainedCapabilities: ['retrieval','knowledge-graph','conversation-context','operational-memory'] },
  { id: 'engineering', authority: 'OpenHands specialist', execution: 'specialist', retainedCapabilities: ['multi-file-code','repository-analysis','implementation','verification'] },
] as const;
