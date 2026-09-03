/**
 * PARIS Import Engine - Type Definitions
 * AI-powered system for importing external codebases, APIs, and services
 */

// Framework Detection Types
export type Framework =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'nuxt'
  | 'angular'
  | 'svelte'
  | 'remix'
  | 'gatsby'
  | 'express'
  | 'fastify'
  | 'nestjs'
  | 'django'
  | 'flask'
  | 'rails'
  | 'laravel'
  | 'spring'
  | 'dotnet'
  | 'wordpress'
  | 'shopify'
  | 'unknown';

export type Database =
  | 'postgresql'
  | 'mysql'
  | 'mongodb'
  | 'sqlite'
  | 'redis'
  | 'supabase'
  | 'firebase'
  | 'prisma'
  | 'dynamodb'
  | 'graphql'
  | 'none'
  | 'unknown';

export type AuthProvider =
  | 'supabase'
  | 'firebase'
  | 'auth0'
  | 'clerk'
  | 'nextauth'
  | 'passport'
  | 'jwt'
  | 'session'
  | 'oauth'
  | 'none'
  | 'unknown';

// Repository Analysis Types
export interface RepositoryInfo {
  owner: string;
  repo: string;
  url: string;
  defaultBranch: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
}

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development';
}

export interface Route {
  path: string;
  method?: string;
  component?: string;
  file: string;
  children?: Route[];
}

export interface Component {
  name: string;
  type: 'page' | 'layout' | 'component' | 'hook' | 'util' | 'api' | 'middleware';
  file: string;
  props?: string[];
  imports?: string[];
  exports?: string[];
  linesOfCode: number;
}

export interface EnvironmentVariable {
  name: string;
  required: boolean;
  description?: string;
  example?: string;
  isSecret: boolean;
}

export interface ThirdPartyIntegration {
  name: string;
  category: 'payment' | 'analytics' | 'crm' | 'storage' | 'email' | 'sms' | 'ai' | 'social' | 'other';
  config: Record<string, string>;
}

export interface BuildProcess {
  command: string;
  outputDir: string;
  framework?: string;
  bundler?: string;
}

// Full Repository Analysis Result
export interface RepositoryAnalysis {
  info: RepositoryInfo;
  framework: Framework;
  database: Database;
  auth: AuthProvider;
  dependencies: {
    production: Dependency[];
    development: Dependency[];
    total: number;
  };
  routes: Route[];
  components: Component[];
  environmentVariables: EnvironmentVariable[];
  integrations: ThirdPartyIntegration[];
  build: BuildProcess;
  designSystem?: {
    cssFramework?: 'tailwind' | 'bootstrap' | 'material' | 'chakra' | 'radix' | 'custom';
    colorScheme?: string[];
    fonts?: string[];
    spacing?: string;
  };
  codeQuality: {
    typescript: boolean;
    eslint: boolean;
    prettier: boolean;
    testing: boolean;
    coverage?: number;
  };
  securityFlags: SecurityFlag[];
  licensing: {
    name: string;
    compatible: boolean;
    notes?: string;
  };
  analysisTimestamp: string;
  warnings: string[];
}

// API Import Types
export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description?: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  tags?: string[];
  security?: string[];
}

export interface APIParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  type: string;
  required: boolean;
  description?: string;
  example?: string;
}

export interface APIRequestBody {
  contentType: string;
  schema?: Record<string, unknown>;
  example?: unknown;
  required: boolean;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  contentType?: string;
  schema?: Record<string, unknown>;
  example?: unknown;
}

export interface APIAnalysis {
  name: string;
  version?: string;
  description?: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  schemas: Record<string, unknown>;
  security: string[];
  tags: string[];
  swagger?: string;
  openapi?: string;
}

// Import Compatibility Types
export interface CompatibilityReport {
  importable: ImportableFeature[];
  needsModification: ModifiedFeature[];
  conflicts: ConflictFeature[];
  securityRisks: SecurityRisk[];
  licensingConcerns: LicensingConcern[];
  estimatedEffort: {
    hours: number;
    complexity: 'low' | 'medium' | 'high' | 'very_high';
    blockers: string[];
  };
  recommendations: string[];
}

export interface ImportableFeature {
  feature: string;
  category: string;
  status: 'ready' | 'requires_config' | 'test_needed';
  notes?: string;
  confidence: number; // 0-100
}

export interface ModifiedFeature {
  feature: string;
  category: string;
  requiredChanges: string[];
  effort: 'minimal' | 'small' | 'moderate' | 'significant';
  risk: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface ConflictFeature {
  feature: string;
  conflict: string;
  resolution: string;
  requiresManualIntervention: boolean;
}

export interface SecurityRisk {
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  recommendation: string;
}

export interface SecurityFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  recommendation: string;
}

export interface LicensingConcern {
  license: string;
  implications: string;
  action: 'acceptable' | 'review_required' | 'incompatible';
}

// Smart Mapping Types
export interface ConceptMapping {
  sourceConcept: string;
  targetConcept: string;
  transform?: string;
  confidence: number;
  requiresReview: boolean;
}

export interface SmartMappingResult {
  users: ConceptMapping[];
  authentication: ConceptMapping[];
  database: ConceptMapping[];
  payments: ConceptMapping[];
  files: ConceptMapping[];
  notifications: ConceptMapping[];
  analytics: ConceptMapping[];
  api: ConceptMapping[];
  custom: ConceptMapping[];
  unmapped: string[];
  summary: {
    autoMapped: number;
    needsReview: number;
    totalConcepts: number;
  };
}

// Elevate Platform Mappings
export const ELEVATE_CONCEPT_MAPPINGS = {
  users: {
    'user': 'student',
    'users': 'students',
    'customer': 'enrollee',
    'member': 'participant',
    'account': 'profile',
    'subscription': 'enrollment',
    'membership': 'program_access',
  },
  authentication: {
    'auth': 'supabase_auth',
    'login': 'elevate_login',
    'oauth': 'supabase_oauth',
    'jwt': 'supabase_jwt',
    'session': 'supabase_session',
  },
  database: {
    'prisma': 'supabase_postgres',
    'typeorm': 'supabase_postgres',
    'mongoose': 'supabase_postgres',
    'firebase_firestore': 'supabase_realtime',
    'mongodb': 'supabase_postgres',
  },
  payments: {
    'stripe': 'elevate_stripe',
    'paypal': 'elevate_paypal',
    'square': 'elevate_paypal',
    'checkout': 'elevate_checkout',
    'subscription': 'enrollment_payment',
  },
  files: {
    's3': 'supabase_storage',
    'firebase_storage': 'supabase_storage',
    'cloudinary': 'supabase_storage',
    'upload': 'document_upload',
  },
  notifications: {
    'sendgrid': 'supabase_edge',
    'twilio': 'supabase_edge',
    'email': 'notification_system',
    'push': 'pwa_notifications',
  },
  analytics: {
    'mixpanel': 'elevate_analytics',
    'segment': 'elevate_analytics',
    'amplitude': 'elevate_analytics',
    'ga4': 'google_analytics',
  },
  api: {
    'rest': 'supabase_rest',
    'graphql': 'supabase_graphql',
    'realtime': 'supabase_realtime',
    'webhook': 'supabase_webhooks',
  },
} as const;

// Import Source Types
export type ImportSource =
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'zip'
  | 'figma'
  | 'wordpress'
  | 'webflow'
  | 'bubble'
  | 'supabase'
  | 'firebase'
  | 'airtable'
  | 'stripe'
  | 'twilio'
  | 'hubspot'
  | 'salesforce'
  | 'openapi'
  | 'graphql'
  | 'mcp';

export interface ImportRequest {
  source: ImportSource;
  url?: string;
  credentials?: Record<string, string>;
  options?: {
    includeTests?: boolean;
    includeDocs?: boolean;
    targetFramework?: Framework;
    mappingPreset?: string;
  };
}

export interface ImportResult {
  success: boolean;
  analysis?: RepositoryAnalysis | APIAnalysis;
  compatibility?: CompatibilityReport;
  mapping?: SmartMappingResult;
  errors?: string[];
  warnings?: string[];
  exportPath?: string;
}
