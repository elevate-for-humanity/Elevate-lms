/**
 * PARIS AI Workforce - Type Definitions
 * Framework for creating and managing specialized AI agents
 */

// Agent Roles
export type AgentRole =
  | 'admissions_specialist'
  | 'recruiter'
  | 'career_coach'
  | 'grant_writer'
  | 'compliance_officer'
  | 'instructor'
  | 'curriculum_developer'
  | 'marketing_manager'
  | 'social_media_manager'
  | 'customer_support'
  | 'testing_proctor'
  | 'financial_aid_advisor'
  | 'employer_relations'
  | 'executive_assistant'
  | 'website_designer'
  | 'software_developer'
  | 'data_analyst'
  | 'content_creator';

// Agent Status
export type AgentStatus =
  | 'active'
  | 'inactive'
  | 'training'
  | 'on_break'
  | 'error';

// Agent Permissions
export interface AgentPermissions {
  canRead: {
    students?: boolean;
    employers?: boolean;
    programs?: boolean;
    finances?: boolean;
    reports?: boolean;
    [key: string]: boolean | undefined;
  };
  canWrite: {
    students?: boolean;
    employers?: boolean;
    programs?: boolean;
    finances?: boolean;
    reports?: boolean;
    [key: string]: boolean | undefined;
  };
  canDelete: {
    students?: boolean;
    employers?: boolean;
    programs?: boolean;
    finances?: boolean;
    reports?: boolean;
    [key: string]: boolean | undefined;
  };
  canApprove: string[];
  canOverride: string[];
  maxRecordsPerAction: number;
}

// Agent Tools
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  category: 'database' | 'api' | 'ai' | 'notification' | 'external' | 'internal';
  permissions?: string[];
  rateLimit?: number; // requests per hour
}

// Agent Configuration
export interface AgentConfig {
  model: 'claude' | 'gpt4' | 'gemini';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[]; // Tool IDs
  memoryEnabled: boolean;
  learningEnabled: boolean;
  approvalRequired: boolean;
  approvalTypes: string[];
}

// Agent Knowledge Base
export interface AgentKnowledge {
  id: string;
  agentId: string;
  source: 'document' | 'conversation' | 'manual' | 'result';
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsedAt?: string;
  relevance: number; // 0-1, how relevant this knowledge is
}

// Agent Memory
export interface AgentMemory {
  id: string;
  agentId: string;
  type: 'short_term' | 'long_term' | 'episodic' | 'semantic';
  content: {
    summary?: string;
    details?: string;
    context?: Record<string, unknown>;
  };
  embedding?: number[];
  importance: number; // 0-1
  createdAt: string;
  expiresAt?: string;
  accessCount: number;
}

// Agent Performance Metrics
export interface AgentMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number; // ms
  averageResolutionTime: number; // ms
  userSatisfaction?: number; // 1-5
  escalationRate: number; // percentage
  firstContactResolution: number; // percentage
  activeHours: number;
  tasksByCategory: Record<string, number>;
  recentErrors: string[];
}

// Agent Activity Log
export interface AgentActivity {
  id: string;
  agentId: string;
  type: 'task' | 'conversation' | 'approval_request' | 'escalation' | 'error';
  action: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'completed' | 'failed' | 'approved' | 'rejected';
  duration?: number;
  timestamp: string;
  userId?: string;
  requiresApproval?: boolean;
  approvedBy?: string;
  error?: string;
}

// Approval Workflow
export interface ApprovalWorkflow {
  id: string;
  agentId: string;
  taskId: string;
  type: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: string;
  requestedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
  comments?: string;
  autoApproved?: boolean;
  conditions?: Record<string, unknown>;
}

// Agent Definition
export interface AIAgent {
  id: string;
  name: string;
  role: AgentRole;
  avatar?: string;
  voice?: {
    enabled: boolean;
    type: 'professional' | 'friendly' | 'formal';
  };
  status: AgentStatus;
  config: AgentConfig;
  permissions: AgentPermissions;
  tools: AgentTool[];
  metrics: AgentMetrics;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  isClone: boolean;
  cloneOf?: string;
}

// Predefined Agent Templates
export const AGENT_TEMPLATES: Record<AgentRole, Partial<AIAgent>> = {
  admissions_specialist: {
    name: 'Admissions AI',
    role: 'admissions_specialist',
    config: {
      model: 'claude',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt: `You are an AI Admissions Specialist for Elevate Workforce Development.
You help prospective students understand programs, eligibility requirements, and the application process.
Be friendly, informative, and guide applicants through the enrollment funnel.
Always verify funding eligibility and provide accurate program information.`,
      tools: ['student_db', 'program_catalog', 'eligibility_check', 'appointment_scheduler'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['enrollment_decision', 'funding_approval'],
    },
    permissions: {
      canRead: { students: true, programs: true, finances: true },
      canWrite: { students: false, programs: false, finances: false },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 10,
    },
  },
  recruiter: {
    name: 'Recruiter AI',
    role: 'recruiter',
    config: {
      model: 'claude',
      temperature: 0.4,
      maxTokens: 2048,
      systemPrompt: `You are an AI Recruiter for Elevate Workforce Development.
You connect graduates with employment opportunities, screen candidates, and coordinate with employers.
Maintain professionalism and prioritize good job matches over quick placements.`,
      tools: ['student_db', 'employer_db', 'adzuna_api', 'matchmaking', 'outreach'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['job_posting', 'candidate_referral'],
    },
    permissions: {
      canRead: { students: true, employers: true, reports: true },
      canWrite: { students: false, employers: true, reports: false },
      canDelete: {},
      canApprove: ['job_referrals'],
      canOverride: [],
      maxRecordsPerAction: 25,
    },
  },
  career_coach: {
    name: 'Career Coach AI',
    role: 'career_coach',
    config: {
      model: 'claude',
      temperature: 0.5,
      maxTokens: 3072,
      systemPrompt: `You are an AI Career Coach for Elevate Workforce Development.
You provide career guidance, resume feedback, interview preparation, and professional development advice.
Be encouraging and supportive while providing actionable recommendations.`,
      tools: ['student_db', 'resume_builder', 'interview_prep', 'career_resources'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: false,
      approvalTypes: [],
    },
    permissions: {
      canRead: { students: true, reports: true },
      canWrite: { students: true },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 5,
    },
  },
  grant_writer: {
    name: 'Grant Writer AI',
    role: 'grant_writer',
    config: {
      model: 'claude',
      temperature: 0.6,
      maxTokens: 4096,
      systemPrompt: `You are an AI Grant Writer for Elevate Workforce Development.
You draft grant proposals, track deadlines, and manage compliance documentation.
Be thorough and precise - grant writing requires attention to detail and compliance.`,
      tools: ['grant_templates', 'compliance_checker', 'document_generator', 'deadline_tracker'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['grant_submission', 'budget_approval'],
    },
    permissions: {
      canRead: { programs: true, finances: true, reports: true },
      canWrite: { reports: true },
      canDelete: {},
      canApprove: ['draft_proposals'],
      canOverride: [],
      maxRecordsPerAction: 5,
    },
  },
  compliance_officer: {
    name: 'Compliance Officer AI',
    role: 'compliance_officer',
    config: {
      model: 'claude',
      temperature: 0.1,
      maxTokens: 2048,
      systemPrompt: `You are an AI Compliance Officer for Elevate Workforce Development.
You ensure all operations meet WIOA, DOL, and state regulations.
Be meticulous and report any potential compliance issues immediately.`,
      tools: ['compliance_db', 'audit_tools', 'report_generator', 'alert_system'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['compliance_exception', 'audit_review'],
    },
    permissions: {
      canRead: { students: true, programs: true, finances: true, reports: true },
      canWrite: { reports: true },
      canDelete: {},
      canApprove: ['compliance_checks'],
      canOverride: [],
      maxRecordsPerAction: 100,
    },
  },
  instructor: {
    name: 'AI Instructor',
    role: 'instructor',
    config: {
      model: 'claude',
      temperature: 0.4,
      maxTokens: 3072,
      systemPrompt: `You are an AI Instructor for Elevate Workforce Development.
You deliver curriculum, answer student questions, and provide learning support.
Be engaging and adapt your teaching style to individual learner needs.`,
      tools: ['lms', 'curriculum_db', 'assessment_tools', 'student_progress'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: false,
      approvalTypes: [],
    },
    permissions: {
      canRead: { students: true, programs: true },
      canWrite: { students: true },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 20,
    },
  },
  curriculum_developer: {
    name: 'Curriculum Developer AI',
    role: 'curriculum_developer',
    config: {
      model: 'claude',
      temperature: 0.6,
      maxTokens: 4096,
      systemPrompt: `You are an AI Curriculum Developer for Elevate Workforce Development.
You create and update training curricula aligned with industry standards and certifications.
Ensure all materials meet accreditation requirements.`,
      tools: ['curriculum_db', 'industry_standards', 'certification_requirements', 'media_generator'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['curriculum_publish'],
    },
    permissions: {
      canRead: { programs: true, reports: true },
      canWrite: { programs: true },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 5,
    },
  },
  marketing_manager: {
    name: 'Marketing Manager AI',
    role: 'marketing_manager',
    config: {
      model: 'claude',
      temperature: 0.7,
      maxTokens: 3072,
      systemPrompt: `You are an AI Marketing Manager for Elevate Workforce Development.
You plan and execute marketing campaigns, analyze performance, and optimize messaging.
Be creative while maintaining brand consistency.`,
      tools: ['analytics', 'content_generator', 'social_media', 'email_campaigns', 'seo'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['campaign_launch', 'budget_spend'],
    },
    permissions: {
      canRead: { reports: true },
      canWrite: { reports: true },
      canDelete: {},
      canApprove: ['content_publish'],
      canOverride: [],
      maxRecordsPerAction: 50,
    },
  },
  social_media_manager: {
    name: 'Social Media AI',
    role: 'social_media_manager',
    config: {
      model: 'claude',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: `You are an AI Social Media Manager for Elevate Workforce Development.
You create engaging social content, schedule posts, and interact with followers.
Maintain professional yet approachable brand voice.`,
      tools: ['content_generator', 'social_media', 'scheduling', 'analytics', 'media_generator'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['post_publish'],
    },
    permissions: {
      canRead: { reports: true },
      canWrite: { reports: true },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 100,
    },
  },
  customer_support: {
    name: 'Support AI',
    role: 'customer_support',
    config: {
      model: 'claude',
      temperature: 0.4,
      maxTokens: 2048,
      systemPrompt: `You are an AI Customer Support Agent for Elevate Workforce Development.
You help students and stakeholders with questions and issues.
Be patient, empathetic, and escalate complex issues appropriately.`,
      tools: ['knowledge_base', 'ticket_system', 'student_db', 'faq'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: false,
      approvalTypes: [],
    },
    permissions: {
      canRead: { students: true },
      canWrite: {},
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 10,
    },
  },
  testing_proctor: {
    name: 'Testing Proctor AI',
    role: 'testing_proctor',
    config: {
      model: 'claude',
      temperature: 0.2,
      maxTokens: 1024,
      systemPrompt: `You are an AI Testing Proctor for Elevate Workforce Development.
You administer certification exams, monitor test integrity, and manage testing schedules.
Be precise and follow testing protocols strictly.`,
      tools: ['testing_center', 'exam_db', 'scheduling', 'credential_issuance'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['exam_results', 'credential_issue'],
    },
    permissions: {
      canRead: { students: true, programs: true },
      canWrite: { students: true },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 20,
    },
  },
  financial_aid_advisor: {
    name: 'Financial Aid Advisor AI',
    role: 'financial_aid_advisor',
    config: {
      model: 'claude',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt: `You are an AI Financial Aid Advisor for Elevate Workforce Development.
You help students understand funding options, WIOA eligibility, and payment plans.
Be thorough and help students find the best financial path.`,
      tools: ['funding_db', 'eligibility_checker', 'wioa_api', 'payment_calculator'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['funding_approval', 'payment_plan'],
    },
    permissions: {
      canRead: { students: true, finances: true, programs: true },
      canWrite: {},
      canDelete: {},
      canApprove: ['funding_recommendation'],
      canOverride: [],
      maxRecordsPerAction: 15,
    },
  },
  employer_relations: {
    name: 'Employer Relations AI',
    role: 'employer_relations',
    config: {
      model: 'claude',
      temperature: 0.4,
      maxTokens: 2048,
      systemPrompt: `You are an AI Employer Relations Manager for Elevate Workforce Development.
You manage employer partnerships, OJT agreements, andRAPIDS reporting.
Maintain professional relationships and ensure compliance.`,
      tools: ['employer_db', 'rapids_api', 'agreement_templates', 'reporting'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['agreement_sign', 'partnership_approval'],
    },
    permissions: {
      canRead: { employers: true, students: true, reports: true },
      canWrite: { employers: true },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 20,
    },
  },
  executive_assistant: {
    name: 'Executive Assistant AI',
    role: 'executive_assistant',
    config: {
      model: 'claude',
      temperature: 0.4,
      maxTokens: 3072,
      systemPrompt: `You are an AI Executive Assistant for Elevate Workforce Development leadership.
You manage schedules, draft communications, prepare reports, and coordinate across departments.
Be efficient, organized, and proactive.`,
      tools: ['calendar', 'email', 'documents', 'reports', 'tasks'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['calendar_booking', 'communication_send'],
    },
    permissions: {
      canRead: { reports: true },
      canWrite: { reports: true },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 50,
    },
  },
  website_designer: {
    name: 'Website Designer AI',
    role: 'website_designer',
    config: {
      model: 'claude',
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: `You are an AI Website Designer for Elevate Workforce Development.
You create and update website pages using the existing design system.
Follow brand guidelines and ensure accessibility compliance.`,
      tools: ['dev_studio', 'component_library', 'seo_tools', 'accessibility_checker'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['page_publish'],
    },
    permissions: {
      canRead: { reports: true },
      canWrite: {},
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 10,
    },
  },
  software_developer: {
    name: 'Developer AI',
    role: 'software_developer',
    config: {
      model: 'claude',
      temperature: 0.3,
      maxTokens: 4096,
      systemPrompt: `You are an AI Software Developer for Elevate Workforce Development.
You write, review, and refactor code following best practices.
Ensure code quality, security, and test coverage.`,
      tools: ['code_editor', 'git', 'testing', 'deployment', 'code_review'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['code_deploy'],
    },
    permissions: {
      canRead: { reports: true },
      canWrite: {},
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 10,
    },
  },
  data_analyst: {
    name: 'Data Analyst AI',
    role: 'data_analyst',
    config: {
      model: 'claude',
      temperature: 0.3,
      maxTokens: 3072,
      systemPrompt: `You are an AI Data Analyst for Elevate Workforce Development.
You analyze enrollment data, track KPIs, and generate insights.
Provide accurate, actionable recommendations.`,
      tools: ['analytics_db', 'reporting', 'visualization', 'forecasting'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: false,
      approvalTypes: [],
    },
    permissions: {
      canRead: { reports: true, finances: true, students: true },
      canWrite: { reports: true },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 100,
    },
  },
  content_creator: {
    name: 'Content Creator AI',
    role: 'content_creator',
    config: {
      model: 'claude',
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: `You are an AI Content Creator for Elevate Workforce Development.
You write program descriptions, marketing copy, newsletters, and educational materials.
Maintain brand voice and SEO best practices.`,
      tools: ['content_generator', 'seo_tools', 'media_generator', 'templates'],
      memoryEnabled: true,
      learningEnabled: true,
      approvalRequired: true,
      approvalTypes: ['content_publish'],
    },
    permissions: {
      canRead: { reports: true },
      canWrite: { reports: true },
      canDelete: {},
      canApprove: [],
      canOverride: [],
      maxRecordsPerAction: 20,
    },
  },
};

// Available Tools
export const AVAILABLE_TOOLS: AgentTool[] = [
  // Database tools
  { id: 'student_db', name: 'Student Database', description: 'Read and update student records', category: 'database', permissions: ['canRead.students', 'canWrite.students'] },
  { id: 'employer_db', name: 'Employer Database', description: 'Manage employer partnerships', category: 'database', permissions: ['canRead.employers', 'canWrite.employers'] },
  { id: 'program_catalog', name: 'Program Catalog', description: 'Access program information', category: 'database', permissions: ['canRead.programs'] },
  { id: 'funding_db', name: 'Funding Database', description: 'Manage funding and scholarships', category: 'database', permissions: ['canRead.finances', 'canWrite.finances'] },
  { id: 'compliance_db', name: 'Compliance Database', description: 'Track compliance records', category: 'database', permissions: ['canRead.reports', 'canWrite.reports'] },
  { id: 'curriculum_db', name: 'Curriculum Database', description: 'Access and update curricula', category: 'database', permissions: ['canRead.programs', 'canWrite.programs'] },
  { id: 'grant_templates', name: 'Grant Templates', description: 'Access grant writing templates', category: 'database' },
  { id: 'knowledge_base', name: 'Knowledge Base', description: 'FAQ and help articles', category: 'database' },
  { id: 'analytics_db', name: 'Analytics Database', description: 'Performance metrics and reports', category: 'database', permissions: ['canRead.reports'] },

  // API tools
  { id: 'eligibility_check', name: 'Eligibility Checker', description: 'Check WIOA and funding eligibility', category: 'api' },
  { id: 'adzuna_api', name: 'Adzuna Jobs API', description: 'Search job listings', category: 'api' },
  { id: 'rapids_api', name: 'RAPIDS API', description: 'DOL registered apprenticeship reporting', category: 'api' },
  { id: 'wioa_api', name: 'WIOA API', description: 'WIOA reporting and eligibility', category: 'api' },
  { id: 'stripe', name: 'Stripe Payments', description: 'Process payments and invoices', category: 'api' },

  // Notification tools
  { id: 'email', name: 'Email', description: 'Send emails', category: 'notification' },
  { id: 'sms', name: 'SMS', description: 'Send text messages', category: 'notification' },
  { id: 'push', name: 'Push Notifications', description: 'Send push notifications', category: 'notification' },
  { id: 'outreach', name: 'Outreach', description: 'Multi-channel outreach', category: 'notification' },

  // AI tools
  { id: 'content_generator', name: 'Content Generator', description: 'Generate marketing and educational content', category: 'ai' },
  { id: 'resume_builder', name: 'Resume Builder', description: 'Create professional resumes', category: 'ai' },
  { id: 'media_generator', name: 'Media Generator', description: 'Create images and videos', category: 'ai' },
  { id: 'seo', name: 'SEO Optimizer', description: 'Optimize content for search', category: 'ai' },
  { id: 'translation', name: 'Translation', description: 'Translate content', category: 'ai' },

  // Scheduling tools
  { id: 'appointment_scheduler', name: 'Appointment Scheduler', description: 'Book appointments', category: 'api' },
  { id: 'scheduling', name: 'Scheduling', description: 'General scheduling', category: 'api' },
  { id: 'calendar', name: 'Calendar', description: 'Manage calendar events', category: 'api' },

  // Assessment tools
  { id: 'assessment_tools', name: 'Assessment Tools', description: 'Create and grade assessments', category: 'api' },
  { id: 'exam_db', name: 'Exam Database', description: 'Manage exams and questions', category: 'database' },
  { id: 'testing_center', name: 'Testing Center', description: 'Administer certification exams', category: 'api' },
  { id: 'credential_issuance', name: 'Credential Issuance', description: 'Issue certifications', category: 'api' },

  // Development tools
  { id: 'dev_studio', name: 'Dev Studio', description: 'Website and app builder', category: 'internal' },
  { id: 'component_library', name: 'Component Library', description: 'Access UI components', category: 'internal' },
  { id: 'code_editor', name: 'Code Editor', description: 'Write and edit code', category: 'internal' },
  { id: 'deployment', name: 'Deployment', description: 'Deploy code to production', category: 'internal', permissions: ['canOverride.deployment'] },
  { id: 'git', name: 'Git', description: 'Version control', category: 'internal' },

  // Reporting tools
  { id: 'reporting', name: 'Reporting', description: 'Generate reports', category: 'api' },
  { id: 'visualization', name: 'Data Visualization', description: 'Create charts and graphs', category: 'api' },
  { id: 'forecasting', name: 'Forecasting', description: 'Predict future trends', category: 'api' },
  { id: 'report_generator', name: 'Report Generator', description: 'Create formatted reports', category: 'api' },
  { id: 'deadline_tracker', name: 'Deadline Tracker', description: 'Track important dates', category: 'api' },

  // Internal tools
  { id: 'lms', name: 'Learning Management System', description: 'Access LMS features', category: 'internal' },
  { id: 'student_progress', name: 'Student Progress', description: 'Track student learning', category: 'internal' },
  { id: 'matchmaking', name: 'Job Matching', description: 'Match students to jobs', category: 'internal' },
  { id: 'ticket_system', name: 'Ticket System', description: 'Manage support tickets', category: 'internal' },
  { id: 'documents', name: 'Document Management', description: 'Create and manage documents', category: 'internal' },
  { id: 'tasks', name: 'Task Management', description: 'Manage tasks and to-dos', category: 'internal' },
  { id: 'agreement_templates', name: 'Agreement Templates', description: 'Legal agreement templates', category: 'internal' },
  { id: 'industry_standards', name: 'Industry Standards', description: 'Industry requirements database', category: 'api' },
  { id: 'certification_requirements', name: 'Certification Requirements', description: 'Cert requirements database', category: 'api' },
  { id: 'interview_prep', name: 'Interview Prep', description: 'Interview preparation tools', category: 'internal' },
  { id: 'career_resources', name: 'Career Resources', description: 'Career development resources', category: 'internal' },
  { id: 'faq', name: 'FAQ', description: 'Frequently asked questions', category: 'internal' },
  { id: 'payment_calculator', name: 'Payment Calculator', description: 'Calculate payment plans', category: 'internal' },
  { id: 'social_media', name: 'Social Media', description: 'Manage social accounts', category: 'external' },
  { id: 'email_campaigns', name: 'Email Campaigns', description: 'Send email campaigns', category: 'external' },
  { id: 'accessibility_checker', name: 'Accessibility Checker', description: 'Check WCAG compliance', category: 'internal' },
  { id: 'alert_system', name: 'Alert System', description: 'Send alerts and notifications', category: 'notification' },
  { id: 'audit_tools', name: 'Audit Tools', description: 'Compliance auditing', category: 'api' },
  { id: 'code_review', name: 'Code Review', description: 'Review code changes', category: 'internal' },
  { id: 'templates', name: 'Templates', description: 'Document templates', category: 'internal' },
  { id: 'testing', name: 'Testing', description: 'Run automated tests', category: 'internal' },
];
