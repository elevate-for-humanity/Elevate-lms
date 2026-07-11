/**
 * PARIS Live Canvas - Type Definitions
 * Real-time collaborative development environment
 */

// Task Status
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

// AI Worker Status
export type WorkerStatus = 'idle' | 'working' | 'waiting' | 'completed' | 'error';

// Message Type
export type MessageType = 'user' | 'ai' | 'system' | 'thought' | 'approval' | 'narration';

// Device View
export type DeviceView = 'desktop' | 'tablet' | 'mobile';

// Panel Tab
export type PanelTab = 'chat' | 'progress' | 'thoughts' | 'approvals';

// Canvas Mode
export type CanvasMode = 'building' | 'preview' | 'review' | 'publishing';

// Live Canvas Types
export interface LiveCanvasState {
  mode: CanvasMode;
  isLive: boolean;
  followMode: boolean;
  currentProject?: ProjectState;
  workers: WorkerState[];
  tasks: TaskState[];
  messages: ChatMessage[];
  previewUrl?: string;
  deviceView: DeviceView;
}

// Project State
export interface ProjectState {
  id: string;
  name: string;
  description?: string;
  pages: PageState[];
  components: ComponentState[];
  routes: RouteState[];
  integrations: IntegrationState[];
  createdAt: string;
  updatedAt: string;
}

// Page State
export interface PageState {
  id: string;
  name: string;
  route: string;
  status: TaskStatus;
  progress: number;
  thumbnail?: string;
  elementCount: number;
}

// Component State
export interface ComponentState {
  id: string;
  name: string;
  type: string;
  file: string;
  status: TaskStatus;
  progress: number;
  linesOfCode?: number;
}

// Route State
export interface RouteState {
  id: string;
  path: string;
  handler: string;
  methods: string[];
  status: TaskStatus;
}

// Integration State
export interface IntegrationState {
  id: string;
  name: string;
  type: string;
  status: TaskStatus;
  progress: number;
}

// Worker State
export interface WorkerState {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: WorkerStatus;
  currentTask?: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  icon: string;
  color: string;
}

// Task State
export interface TaskState {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  progress: number;
  assignedTo?: string; // Worker ID
  priority: 'low' | 'medium' | 'high' | 'critical';
  subtasks?: SubTask[];
  dependsOn?: string[];
  createdAt: string;
  completedAt?: string;
}

// SubTask
export interface SubTask {
  id: string;
  title: string;
  status: TaskStatus;
}

// Chat Message
export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  sender?: string;
  metadata?: {
    taskId?: string;
    workerId?: string;
    approvalType?: string;
    action?: string;
  };
}

// AI Thought (Reasoning)
export interface AIThought {
  id: string;
  step: number;
  thought: string;
  reasoning: string;
  confidence: number;
  timestamp: string;
}

// Approval Request
export interface ApprovalRequest {
  id: string;
  type: string;
  title: string;
  description: string;
  options?: { label: string; value: string }[];
  requestedAt: string;
  expiresAt?: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Code Change
export interface CodeChange {
  id: string;
  file: string;
  type: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
  diff?: string;
}

// Database Change
export interface DatabaseChange {
  id: string;
  type: 'table' | 'column' | 'index' | 'migration';
  name: string;
  sql: string;
}

// Before Publish Report
export interface BeforePublishReport {
  preview: {
    url: string;
    screenshot?: string;
  };
  comparison: {
    current: string;
    proposed: string;
    changes: string[];
  };
  codeChanges: CodeChange[];
  databaseChanges: DatabaseChange[];
  newIntegrations: string[];
  metrics: {
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    securityScore: number;
    deploymentTime: string;
  };
  risks: {
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

// Predefined AI Workers for Elevate
export const ELEVATE_WORKERS = [
  { id: 'dev', name: 'Developer', role: 'software_developer', icon: '💻', color: 'blue' },
  { id: 'designer', name: 'Designer', role: 'website_designer', icon: '🎨', color: 'purple' },
  { id: 'marketing', name: 'Marketing', role: 'marketing_manager', icon: '📢', color: 'pink' },
  { id: 'video', name: 'Video AI', role: 'content_creator', icon: '🎥', color: 'orange' },
  { id: 'integration', name: 'Integration', role: 'software_developer', icon: '🔗', color: 'cyan' },
  { id: 'qa', name: 'QA AI', role: 'data_analyst', icon: '🧪', color: 'emerald' },
  { id: 'mobile', name: 'Mobile AI', role: 'software_developer', icon: '📱', color: 'indigo' },
] as const;

// Worker Color Map
export const WORKER_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  indigo: 'bg-indigo-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
};

// Status Colors
export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
  blocked: 'bg-amber-500',
};

// Progress Bar Colors
export const PROGRESS_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
};
