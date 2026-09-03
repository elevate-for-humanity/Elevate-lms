/**
 * PARIS Import Engine - Smart Mapper
 * Maps external system concepts to Elevate platform equivalents
 */

import type {
  RepositoryAnalysis,
  SmartMappingResult,
  ConceptMapping,
  ELEVATE_CONCEPT_MAPPINGS,
} from './types';

// Elevate Platform Concepts
export const ELEVATE_CONCEPTS = {
  // Core Entities
  student: {
    description: 'A learner enrolled in a program',
    fields: ['id', 'email', 'name', 'phone', 'address', 'enrollment_date', 'status'],
    integrations: ['lms', 'dashboard', 'enrollment'],
  },
  enrollment: {
    description: 'A student registered in a program',
    fields: ['student_id', 'program_id', 'status', 'start_date', 'end_date', 'progress'],
    integrations: ['programs', 'payments', 'credentials'],
  },
  program: {
    description: 'A training program or course',
    fields: ['id', 'name', 'description', 'duration', 'credential', 'cost', 'funding_options'],
    integrations: ['catalog', 'applications', 'scheduling'],
  },
  credential: {
    description: 'Certification or certificate issued',
    fields: ['id', 'student_id', 'program_id', 'issued_date', 'expiry_date', 'verification_code'],
    integrations: ['verification', 'employers', 'lms'],
  },
  payment: {
    description: 'Financial transaction',
    fields: ['id', 'student_id', 'amount', 'type', 'status', 'date', 'stripe_id'],
    integrations: ['stripe', 'dashboard', 'invoicing'],
  },
  employer: {
    description: 'Partner employer organization',
    fields: ['id', 'name', 'industry', 'contact', 'partnership_status'],
    integrations: ['hiring', 'apprenticeships', 'reporting'],
  },
  application: {
    description: 'Student application for a program',
    fields: ['id', 'student_id', 'program_id', 'status', 'submitted_date', 'funding_source'],
    integrations: ['admissions', 'eligibility', 'documents'],
  },
  assessment: {
    description: 'Test or evaluation',
    fields: ['id', 'student_id', 'type', 'score', 'date', 'certification'],
    integrations: ['testing', 'credentials', 'proctors'],
  },
} as const;

// Mapping patterns
const MAPPING_PATTERNS = {
  // User mappings
  user: ['student', 'participant', 'enrollee', 'learner', 'trainee'],
  users: ['students', 'participants', 'enrollees', 'learners', 'trainees'],
  customer: ['enrollee', 'student'],
  member: ['participant', 'student'],
  account: ['profile', 'student_record'],
  subscription: ['enrollment', 'program_access'],
  membership: ['program_access', 'enrollment'],
  
  // Authentication
  auth: ['elevate_auth', 'supabase_auth'],
  login: ['elevate_login', 'student_portal'],
  register: ['apply', 'enroll'],
  signup: ['apply', 'enroll'],
  
  // Database/ORM
  prisma: ['supabase_client'],
  typeorm: ['supabase_client'],
  mongoose: ['supabase_client'],
  sequelize: ['supabase_client'],
  
  // Payments
  stripe: ['elevate_stripe', 'payment_gateway'],
  paypal: ['payment_gateway'],
  checkout: ['elevate_checkout'],
  enrollment_payment: ['enrollment_payment', 'program_payment'],
  invoice: ['billing', 'payment_schedule'],
  price: ['program_cost', 'tuition'],
  
  // Files/Storage
  s3: ['supabase_storage', 'document_storage'],
  storage: ['document_upload', 'supabase_storage'],
  upload: ['document_upload', 'file_upload'],
  
  // Notifications
  email: ['notification_email', 'supabase_edge_email'],
  sms: ['notification_sms', 'supabase_edge_sms'],
  push: ['pwa_notification'],
  notification: ['notification_system'],
  
  // Analytics
  analytics: ['elevate_analytics', 'reporting'],
  tracking: ['student_tracking', 'analytics'],
  metrics: ['kpis', 'performance_metrics'],
  
  // CRM
  crm: ['recruiter_dashboard', 'employer_portal'],
  contact: ['student_record', 'employer_contact'],
  lead: ['applicant', 'enquiry'],
  opportunity: ['program_interest', 'enrollment'],
  
  // Content/LMS
  course: ['program', 'training'],
  curriculum: ['syllabus', 'program_content'],
  lesson: ['module', 'unit'],
  module: ['unit', 'week'],
  quiz: ['assessment', 'test'],
  assignment: ['task', 'project'],
  grade: ['progress', 'assessment_result'],
  certificate: ['credential', 'certification'],
  
  // E-commerce
  product: ['program', 'service'],
  cart: ['enrollment_cart', 'checkout'],
  order: ['enrollment', 'purchase'],
  inventory: ['program_capacity', 'available_seats'],
  
  // Social
  post: ['announcement', 'content'],
  comment: ['feedback', 'discussion'],
  like: ['endorsement', 'support'],
  share: ['referral', 'recommendation'],
  
  // Jobs/Employment
  job: ['career', 'position'],
  application: ['program_application', 'job_application'],
  resume: ['student_profile', 'career_goals'],
  interview: ['admission_interview', 'screening'],
  
  // Workflows
  workflow: ['process', 'pipeline'],
  automation: ['automated_task', 'workflow'],
  trigger: ['event', 'automation_trigger'],
  action: ['task', 'automated_action'],
} as const;

/**
 * Find best mapping for a concept
 */
function findMapping(concept: string, _category: string): string[] {
  const lowerConcept = concept.toLowerCase();
  const mappings: string[] = [];
  
  // Direct pattern match
  for (const [pattern, targets] of Object.entries(MAPPING_PATTERNS)) {
    if (lowerConcept.includes(pattern) || pattern.includes(lowerConcept)) {
      mappings.push(...targets);
    }
  }
  
  // Remove duplicates
  return [...new Set(mappings)];
}

/**
 * Calculate mapping confidence
 */
function calculateConfidence(source: string, target: string): number {
  const sourceLower = source.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Exact match
  if (sourceLower === targetLower) return 100;
  
  // Contains match
  if (sourceLower.includes(targetLower) || targetLower.includes(sourceLower)) return 85;
  
  // Similar words
  const sourceWords = sourceLower.split(/[_\-\s]+/);
  const targetWords = targetLower.split(/[_\-\s]+/);
  const commonWords = sourceWords.filter(w => targetWords.some(t => t.includes(w) || w.includes(t)));
  
  if (commonWords.length > 0) {
    return 60 + (commonWords.length * 10);
  }
  
  return 30; // Low confidence - needs review
}

/**
 * Detect category from context
 */
function detectCategory(
  concept: string,
  analysis: RepositoryAnalysis
): 'users' | 'authentication' | 'database' | 'payments' | 'files' | 'notifications' | 'analytics' | 'api' | 'custom' {
  const lower = concept.toLowerCase();
  
  // Check framework detection
  if (analysis.framework === 'nextjs' || analysis.framework === 'react') {
    if (concept.includes('auth') || concept.includes('login') || concept.includes('session')) {
      return 'authentication';
    }
  }
  
  // Check integrations
  const integrationCategories: Record<string, 'payments' | 'notifications' | 'database' | 'files' | 'analytics' | 'users' | 'authentication' | 'api' | 'custom'> = {
    stripe: 'payments',
    paypal: 'payments',
    sendgrid: 'notifications',
    twilio: 'notifications',
    firebase: 'database',
    supabase: 'database',
    s3: 'files',
    cloudinary: 'files',
    analytics: 'analytics',
    mixpanel: 'analytics',
    segment: 'analytics',
  };
  
  for (const [name, category] of Object.entries(integrationCategories)) {
    if (lower.includes(name)) {
      return category;
    }
  }
  
  // Check dependencies
  const deps = analysis.dependencies.production.map(d => d.name);
  for (const dep of deps) {
    if (lower.includes(dep.toLowerCase())) {
      return integrationCategories[dep] || 'custom';
    }
  }
  
  // Heuristics
  if (/user|customer|member|account|profile/.test(lower)) return 'users';
  if (/auth|login|register|oauth|jwt|token/.test(lower)) return 'authentication';
  if (/db|database|sql|mongo|postgres|model/.test(lower)) return 'database';
  if (/pay|payment|invoice|price|cost|billing|subscription/.test(lower)) return 'payments';
  if (/file|upload|storage|s3|asset/.test(lower)) return 'files';
  if (/email|sms|notification|push|message/.test(lower)) return 'notifications';
  if (/analytics|track|metric|event|report/.test(lower)) return 'analytics';
  if (/api|endpoint|route|rest|graphql|webhook/.test(lower)) return 'api';
  
  return 'custom';
}

/**
 * Map components to Elevate concepts
 */
function mapComponents(
  components: RepositoryAnalysis['components'],
  analysis: RepositoryAnalysis
): ConceptMapping[] {
  const mappings: ConceptMapping[] = [];
  const mapped = new Set<string>();
  
  for (const component of components) {
    const category = detectCategory(component.name, analysis);
    const targets = findMapping(component.name, category);
    
    if (targets.length > 0) {
      const bestTarget = targets[0];
      if (!mapped.has(bestTarget)) {
        mappings.push({
          sourceConcept: component.name,
          targetConcept: bestTarget,
          confidence: calculateConfidence(component.name, bestTarget),
          requiresReview: calculateConfidence(component.name, bestTarget) < 70,
        });
        mapped.add(bestTarget);
      }
    }
  }
  
  return mappings;
}

/**
 * Map routes to Elevate pages
 */
function mapRoutes(
  routes: RepositoryAnalysis['routes'],
  analysis: RepositoryAnalysis
): ConceptMapping[] {
  const mappings: ConceptMapping[] = [];
  
  // Route path patterns to Elevate pages
  const routePatterns: Record<string, { targetConcept: string; description: string }> = {
    '/': { targetConcept: 'homepage', description: 'Home page' },
    '/about': { targetConcept: 'about', description: 'About page' },
    '/contact': { targetConcept: 'contact', description: 'Contact page' },
    '/blog': { targetConcept: 'blog', description: 'Blog page' },
    '/pricing': { targetConcept: 'store', description: 'Store/Pricing page' },
    '/checkout': { targetConcept: 'checkout', description: 'Checkout page' },
    '/lms/dashboard': { targetConcept: 'student_dashboard', description: 'Student dashboard' },
    '/admin': { targetConcept: 'admin_dashboard', description: 'Admin dashboard' },
    '/lms/settings': { targetConcept: 'account_settings', description: 'Account settings' },
    '/lms/profile': { targetConcept: 'student_profile', description: 'Student profile' },
    '/courses': { targetConcept: 'programs', description: 'Programs listing' },
    '/programs': { targetConcept: 'programs', description: 'Programs listing' },
    '/enroll': { targetConcept: 'apply', description: 'Enrollment/Apply' },
    '/login': { targetConcept: 'login', description: 'Login page' },
    '/signup': { targetConcept: 'apply', description: 'Signup/Apply' },
    '/register': { targetConcept: 'apply', description: 'Registration/Apply' },
    '/api/': { targetConcept: 'api_endpoint', description: 'API endpoint' },
    '/webhook': { targetConcept: 'webhook_handler', description: 'Webhook handler' },
  };
  
  for (const route of routes) {
    for (const [pattern, info] of Object.entries(routePatterns)) {
      if (route.path.includes(pattern) || pattern.includes(route.path)) {
        mappings.push({
          sourceConcept: `Route: ${route.path}`,
          targetConcept: info.targetConcept,
          confidence: 80,
          requiresReview: false,
        });
        break;
      }
    }
  }
  
  return mappings;
}

/**
 * Map integrations to Elevate equivalents
 */
function mapIntegrations(
  integrations: RepositoryAnalysis['integrations']
): ConceptMapping[] {
  const mappings: ConceptMapping[] = [];
  
  for (const integration of integrations) {
    const targets = findMapping(integration.name, 'api');
    
    if (targets.length > 0) {
      mappings.push({
        sourceConcept: integration.name,
        targetConcept: targets[0],
        confidence: 90,
        requiresReview: false,
      });
    }
  }
  
  return mappings;
}

/**
 * Generate comprehensive mapping result
 */
export function generateSmartMapping(analysis: RepositoryAnalysis): SmartMappingResult {
  const componentMappings = mapComponents(analysis.components, analysis);
  const routeMappings = mapRoutes(analysis.routes, analysis);
  const integrationMappings = mapIntegrations(analysis.integrations);
  
  // Group by category
  const users = componentMappings.filter(m => 
    /student|user|member|account/.test(m.targetConcept)
  );
  const authentication = componentMappings.filter(m =>
    /auth|login|oauth|jwt/.test(m.targetConcept)
  );
  const database = componentMappings.filter(m =>
    /database|supabase|storage/.test(m.targetConcept)
  );
  const payments = componentMappings.filter(m =>
    /payment|stripe|billing/.test(m.targetConcept)
  );
  const files = componentMappings.filter(m =>
    /file|upload|storage|document/.test(m.targetConcept)
  );
  const notifications = componentMappings.filter(m =>
    /notification|email|sms/.test(m.targetConcept)
  );
  const analytics = componentMappings.filter(m =>
    /analytics|report|metric/.test(m.targetConcept)
  );
  const api = [...integrationMappings, ...routeMappings.filter(m =>
    /api|endpoint|webhook/.test(m.sourceConcept)
  )];
  const custom = componentMappings.filter(m =>
    !users.includes(m) && !authentication.includes(m) && !database.includes(m) &&
    !payments.includes(m) && !files.includes(m) && !notifications.includes(m) &&
    !analytics.includes(m) && !api.includes(m)
  );
  
  // Find unmapped concepts
  const allMapped = new Set([
    ...users.map(m => m.sourceConcept),
    ...authentication.map(m => m.sourceConcept),
    ...database.map(m => m.sourceConcept),
    ...payments.map(m => m.sourceConcept),
    ...files.map(m => m.sourceConcept),
    ...notifications.map(m => m.sourceConcept),
    ...analytics.map(m => m.sourceConcept),
    ...api.map(m => m.sourceConcept),
    ...custom.map(m => m.sourceConcept),
  ]);
  
  const unmapped = analysis.components
    .filter(c => !allMapped.has(c.name))
    .map(c => c.name);
  
  const autoMapped = [...users, ...authentication, ...database, ...payments, ...files, ...notifications, ...analytics, ...api]
    .filter(m => !m.requiresReview).length;
  
  const needsReview = [...users, ...authentication, ...database, ...payments, ...files, ...notifications, ...analytics, ...api, ...custom]
    .filter(m => m.requiresReview).length;
  
  return {
    users,
    authentication,
    database,
    payments,
    files,
    notifications,
    analytics,
    api,
    custom,
    unmapped,
    summary: {
      autoMapped,
      needsReview,
      totalConcepts: analysis.components.length,
    },
  };
}

/**
 * Generate import code for mapped concepts
 */
export function generateImportCode(mapping: SmartMappingResult): string {
  const lines: string[] = [];
  
  lines.push('// Generated by PARIS Smart Mapper');
  lines.push('// Mapped concepts ready for Elevate platform integration');
  lines.push('');
  
  // Imports
  lines.push("// Import Elevate platform modules");
  lines.push("import { supabase } from '@/lib/supabase/client';");
  lines.push("import { stripe } from '@/lib/stripe/client';");
  lines.push("import { elevateAuth } from '@/lib/auth/elevate';");
  lines.push('');
  
  // Mapped users
  if (mapping.users.length > 0) {
    lines.push('// User/Student Mappings');
    for (const m of mapping.users) {
      lines.push(`// ${m.sourceConcept} → elevate.students.${m.targetConcept}`);
    }
    lines.push('');
  }
  
  // Mapped payments
  if (mapping.payments.length > 0) {
    lines.push('// Payment Mappings');
    for (const m of mapping.payments) {
      lines.push(`// ${m.sourceConcept} → elevate.payments.${m.targetConcept}`);
    }
    lines.push('');
  }
  
  // Mapped files
  if (mapping.files.length > 0) {
    lines.push('// File/Storage Mappings');
    for (const m of mapping.files) {
      lines.push(`// ${m.sourceConcept} → supabase.storage.${m.targetConcept}`);
    }
    lines.push('');
  }
  
  // Mapped notifications
  if (mapping.notifications.length > 0) {
    lines.push('// Notification Mappings');
    for (const m of mapping.notifications) {
      lines.push(`// ${m.sourceConcept} → supabase.edge.${m.targetConcept}`);
    }
    lines.push('');
  }
  
  // Unmapped (needs review)
  if (mapping.unmapped.length > 0) {
    lines.push('// TODO: Review these unmapped concepts');
    for (const concept of mapping.unmapped) {
      lines.push(`// - ${concept}`);
    }
    lines.push('');
  }
  
  // Summary
  lines.push('// Summary');
  lines.push(`// Auto-mapped: ${mapping.summary.autoMapped}`);
  lines.push(`// Needs review: ${mapping.summary.needsReview}`);
  lines.push(`// Total concepts: ${mapping.summary.totalConcepts}`);
  
  return lines.join('\n');
}
