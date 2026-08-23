/**
 * AI Gateway Module - Type Definitions
 * 
 * Unified type system for all AI agents (PARS, ELLIE, LIZZY, ZORA)
 * and the AI routing/orchestration infrastructure.
 */

export enum AIAgent {
  PARS = 'PARS',
  ELLIE = 'ELLIE',
  LIZZY = 'LIZZY',
  ZORA = 'ZORA',
  ROUTER = 'ROUTER',
}

export enum AgentIntent {
  ADMISSION = 'ADMISSION',
  STUDENT_SUPPORT = 'STUDENT_SUPPORT',
  ENROLLMENT = 'ENROLLMENT',
  COURSE_BUILDER = 'COURSE_BUILDER',
  COMPLIANCE = 'COMPLIANCE',
  OPS = 'OPS',
  CAREER_PLACEMENT = 'CAREER_PLACEMENT',
  GENERAL = 'GENERAL',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TaskStatus {
  QUEUED = 'QUEUED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export enum MessageType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  EVENT = 'EVENT',
  NOTIFICATION = 'NOTIFICATION',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
}

export enum AgentStatus {
  ACTIVE = 'active',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export enum MessageBusChannel {
  ADMISSIONS = 'admissions',
  STUDENT_LIFECYCLE = 'student-lifecycle',
  ENROLLMENTS = 'enrollments',
  COMPLIANCE = 'compliance',
  OPERATIONS = 'operations',
  SYSTEM = 'system',
}

export enum EventType {
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  INTERVIEW_STARTED = 'INTERVIEW_STARTED',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  ENROLLMENT_APPROVED = 'ENROLLMENT_APPROVED',
  ENROLLMENT_REJECTED = 'ENROLLMENT_REJECTED',
  COURSE_COMPLETED = 'COURSE_COMPLETED',
  CERTIFICATE_ISSUED = 'CERTIFICATE_ISSUED',
  JOB_PLACED = 'JOB_PLACED',
  COMPLIANCE_ALERT = 'COMPLIANCE_ALERT',
}

export interface AgentCapabilities {
  intents: AgentIntent[];
  maxConcurrentTasks: number;
  timeout: number;
  retryable: boolean;
  requiresApproval: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: AIAgent;
  capabilities: AgentCapabilities;
  endpoint: string;
  priority: number;
  maxConcurrentTasks: number;
  status: AgentStatus;
  metadata?: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  type: MessageType;
  source: AIAgent;
  target?: AIAgent;
  channel?: MessageBusChannel;
  payload: Record<string, unknown>;
  correlationId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface MessageBusSubscription {
  id: string;
  channel: string;
  handler: (message: AgentMessage) => void;
  unsubscribe: () => void;
}

export interface TaskPayload {
  id: string;
  agentType: AIAgent;
  intent: AgentIntent;
  payload: Record<string, unknown>;
  priority: TaskPriority;
  status: TaskStatus;
  result?: unknown;
  error?: string;
  attempts: number;
  maxAttempts: number;
  timeout: number;
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface TaskCreationOptions {
  agent: AIAgent;
  intent: AgentIntent;
  payload: Record<string, unknown>;
  priority?: TaskPriority;
  timeout?: number;
  maxAttempts?: number;
}

export interface IntentClassification {
  intent: AgentIntent;
  confidence: number;
  params: Record<string, unknown>;
  matchedKeywords: string[];
}

export interface RoutingDecision {
  agent: AIAgent;
  priority: TaskPriority;
  task: TaskPayload;
  confidence: number;
}

export interface EventPayload {
  id: string;
  type: EventType;
  timestamp: number;
  source: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: (event: EventPayload) => void;
  unsubscribe: () => void;
}

export interface AIRequest {
  message: string;
  context?: Record<string, unknown>;
  agent?: AIAgent;
  priority?: TaskPriority;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface AIResponse {
  taskId: string;
  agent: AIAgent;
  intent: AgentIntent;
  result: unknown;
  nextSteps?: string[];
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface GatewayHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  agents: Record<string, AgentHealthStatus>;
  tasks: {
    queued: number;
    inProgress: number;
    completed: number;
    failed: number;
  };
  uptime: number;
}

export interface AgentHealthStatus {
  status: 'active' | 'busy' | 'offline';
  load: number;
  tasks: number;
  lastHeartbeat?: number;
}

export interface TaskFilterOptions {
  agent?: AIAgent;
  status?: TaskStatus;
  intent?: AgentIntent;
  limit?: number;
  offset?: number;
}

export interface WebhookConfig {
  id: string;
  url: string;
  eventTypes: EventType[];
  secret: string;
  enabled: boolean;
  createdAt: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: EventPayload;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttempt?: number;
  response?: {
    status: number;
    body: string;
  };
  createdAt: number;
}

export interface CorrelationContext {
  correlationId: string;
  spanId?: string;
  parentSpanId?: string;
  traceId?: string;
}

export interface ExecutionContext {
  request: AIRequest;
  correlation: CorrelationContext;
  startTime: number;
  agent?: AIAgent;
  intent?: AgentIntent;
}

export type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'google' | 'cloudflare' | 'azure' | 'groq' | 'elevate' | 'none';
export type AIImageProviderName = 'dalle' | 'stability' | 'azure' | 'none';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  provider?: AIProviderName | string;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  provider?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ImageGenerationOptions {
  prompt: string;
  count?: number;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  format?: 'url' | 'b64_json';
  style?: 'natural' | 'vivid';
}

export interface GeneratedImage {
  url?: string;
  b64Json?: string;
}

export interface QuizGenerationOptions {
  topic?: string;
  content?: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended';
  options?: string[];
  correctAnswer: string | boolean;
  explanation?: string;
}

export interface GradingOptions {
  question: string;
  studentAnswer: string;
  correctAnswer?: string;
  rubric?: string;
  maxScore?: number;
}

export interface GradingResult {
  score: number;
  maxScore: number;
  feedback: string;
  passed: boolean;
}

export interface AIProvider {
  readonly name: string;
  isAvailable(): boolean;
  chat(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
}

export interface AIImageProvider {
  isAvailable(): boolean;
  generateImage(options: ImageGenerationOptions): Promise<GeneratedImage[]>;
}
