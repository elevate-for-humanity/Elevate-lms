/**
 * Config-Based Credential Registry
 * 
 * Add credentials via YAML/JSON config files - NO CODE REQUIRED.
 * 
 * Usage:
 * 1. Create a YAML file in lib/course-builder/credentials/
 * 2. Add credential definition
 * 3. Import and use - credentials load automatically
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface CredentialConfig {
  // Basic info
  id: string;
  slug: string;
  name: string;
  provider: string;
  category: 'healthcare' | 'trades' | 'beauty' | 'safety' | 'workforce' | 'food' | 'transportation' | 'technology' | 'business' | 'government' | 'employer';
  type: 'certification' | 'licensure' | 'apprenticeship' | 'continuing-ed' | 'assessment' | 'employer' | 'internal';
  description: string;

  // Exam details
  examSections?: ExamSectionConfig[];
  totalQuestions?: number;
  passingScore: number;
  examFormat?: string;
  examFrequency?: string;
  retakePolicy?: string;

  // Validity
  validityPeriod?: string;
  renewalHours?: number;
  renewalFrequency?: string;

  // Prerequisites
  minimumAge?: number;
  educationRequirement?: string;
  experienceRequirement?: string;
  prerequisiteCredential?: string;

  // Costs
  examFee?: string;
  studyMaterialsFee?: string;

  // Compliance
  states?: string[];
  federalRequirements?: string[];
  wioaEligible?: boolean;
  dolRegistered?: boolean;

  // O*NET
  sosCodes?: string[];
  careerPathway?: string;

  // Metadata
  availableOnElevate?: boolean;
  courseSlug?: string;
  blueprintSlug?: string;
  relatedCredentials?: string[];
  
  // Exam blueprint (inline)
  blueprint?: BlueprintConfig;

  // Media
  instructorAvatar?: string;
  instructorVoice?: string;
}

export interface ExamSectionConfig {
  name: string;
  questions: number;
  passingScore?: number;
  topics?: string[];
  domainWeight?: number;
}

export interface BlueprintConfig {
  criticalNumbers?: Record<string, string>;
  vocabulary?: string[];
  practiceAreas?: string[];
  labRequirements?: string[];
  topics?: BlueprintTopicConfig[];
}

export interface BlueprintTopicConfig {
  id: string;
  section: string;
  title: string;
  content: string;
  keyFacts: string[];
  examWeight: 'critical' | 'high' | 'medium';
}

/**
 * Load all credentials from config directory
 */
export function loadCredentialConfigs(): CredentialConfig[] {
  const configDir = path.join(process.cwd(), 'lib', 'course-builder', 'credentials');
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.info('Created credentials directory:', configDir);
    return [];
  }

  const files = fs.readdirSync(configDir).filter(f => 
    f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json')
  );

  const credentials: CredentialConfig[] = [];

  for (const file of files) {
    const filePath = path.join(configDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    try {
      if (file.endsWith('.json')) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          credentials.push(...parsed);
        } else {
          credentials.push(parsed);
        }
      } else {
        const parsed = yaml.load(content) as CredentialConfig;
        if (parsed.id) {
          credentials.push(parsed);
        } else if (Array.isArray(parsed)) {
          credentials.push(...(parsed as CredentialConfig[]));
        }
      }
    } catch (err) {
      console.error(`Error loading ${file}:`, err);
    }
  }

  return credentials;
}

/**
 * Get credential by slug from configs
 */
export function getCredentialFromConfig(slug: string): CredentialConfig | undefined {
  const configs = loadCredentialConfigs();
  return configs.find(c => c.slug === slug);
}

/**
 * Search credentials in configs
 */
export function searchCredentialsInConfig(query: string): CredentialConfig[] {
  const configs = loadCredentialConfigs();
  const lower = query.toLowerCase();
  
  return configs.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.slug.toLowerCase().includes(lower) ||
    c.provider.toLowerCase().includes(lower) ||
    c.category.toLowerCase().includes(lower)
  );
}

/**
 * Get all credentials by category
 */
export function getCredentialsByCategoryInConfig(category: string): CredentialConfig[] {
  const configs = loadCredentialConfigs();
  return configs.filter(c => c.category === category);
}

/**
 * Example: Create a new credential YAML file
 * 
 * File: lib/course-builder/credentials/nccer-hvac.yaml
 * 
 * name: NCCER HVAC Level 1
 * slug: nccer-hvac
 * provider: NCCER
 * category: trades
 * type: certification
 * description: NCCER HVAC craft certification - Level 1
 * 
 * examSections:
 *   - name: Fundamentals
 *     questions: 25
 *     passingScore: 70
 *   - name: Residential Systems
 *     questions: 50
 *     passingScore: 70
 *   - name: Commercial Systems
 *     questions: 25
 *     passingScore: 70
 * 
 * passingScore: 70
 * examFormat: Module exams + performance profiles
 * sosCodes:
 *   - 49-9021.00
 * 
 * availableOnElevate: true
 * courseSlug: hvac
 */

/**
 * Template for creating new credentials
 */
export const CREDENTIAL_TEMPLATE: CredentialConfig = {
  id: 'your-credential-id',
  slug: 'your-credential-slug',
  name: 'Credential Name',
  provider: 'Provider Name',
  category: 'trades', // healthcare | trades | beauty | safety | workforce | food | transportation | technology | business | government | employer
  type: 'certification', // certification | licensure | apprenticeship | continuing-ed | assessment | employer | internal
  description: 'Brief description of the credential',
  
  // Exam sections (required for certification exams)
  examSections: [
    {
      name: 'Section Name',
      questions: 25,
      passingScore: 70,
      topics: ['Topic 1', 'Topic 2'],
      domainWeight: 25,
    },
  ],
  
  // Total questions across all sections
  totalQuestions: 100,
  
  // Passing score for the exam
  passingScore: 70,
  
  // How the exam is administered
  examFormat: '100 questions, 2 hours',
  
  // Retake policy
  retakePolicy: 'After 14 days',
  
  // Validity period
  validityPeriod: '2 years',
  renewalHours: 10,
  renewalFrequency: '2 years',
  
  // Prerequisites
  minimumAge: 18,
  educationRequirement: 'High school diploma',
  
  // Costs
  examFee: '$150',
  
  // Compliance
  states: ['IN', 'OH', 'KY'],
  federalRequirements: ['OSHA 1910'],
  wioaEligible: true,
  
  // O*NET mapping
  sosCodes: ['49-9021.00'],
  careerPathway: 'Entry → Lead → Manager',
  
  // Elevate integration
  availableOnElevate: true,
  
  // Blueprint (optional inline)
  blueprint: {
    criticalNumbers: {
      numberName: 'number value',
    },
    vocabulary: ['term1', 'term2'],
    practiceAreas: ['area1', 'area2'],
    topics: [
      {
        id: 'topic-id',
        section: 'Section Name',
        title: 'Topic Title',
        content: 'Detailed content for this topic',
        keyFacts: ['Fact 1', 'Fact 2'],
        examWeight: 'high',
      },
    ],
  },
};
