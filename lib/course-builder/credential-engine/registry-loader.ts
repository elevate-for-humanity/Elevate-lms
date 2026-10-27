/**
 * Config-Based Credential Registry
 *
 * Add credentials via YAML/JSON config files - NO CODE REQUIRED.
 */

import fs from 'fs';
import path from 'path';
import { load as loadYaml } from 'js-yaml';

export interface CredentialConfig {
  id: string;
  slug: string;
  name: string;
  provider: string;
  category:
    | 'healthcare'
    | 'trades'
    | 'beauty'
    | 'safety'
    | 'workforce'
    | 'food'
    | 'transportation'
    | 'technology'
    | 'business'
    | 'government'
    | 'employer';
  type:
    | 'certification'
    | 'licensure'
    | 'apprenticeship'
    | 'continuing-ed'
    | 'assessment'
    | 'employer'
    | 'internal';
  description: string;
  examSections?: ExamSectionConfig[];
  totalQuestions?: number;
  passingScore: number;
  examFormat?: string;
  examFrequency?: string;
  retakePolicy?: string;
  validityPeriod?: string;
  renewalHours?: number;
  renewalFrequency?: string;
  minimumAge?: number;
  educationRequirement?: string;
  experienceRequirement?: string;
  prerequisiteCredential?: string;
  examFee?: string;
  studyMaterialsFee?: string;
  states?: string[];
  federalRequirements?: string[];
  wioaEligible?: boolean;
  dolRegistered?: boolean;
  sosCodes?: string[];
  careerPathway?: string;
  availableOnElevate?: boolean;
  courseSlug?: string;
  blueprintSlug?: string;
  relatedCredentials?: string[];
  blueprint?: BlueprintConfig;
  instructorAvatar?: string;
  instructorVoice?: string;
  authority?: {
    registryKey: string;
    sourceUrl: string;
    version: string;
    effectiveDate: string;
    status: 'active' | 'retired' | 'superseded' | 'draft';
    checkedAt: string;
  };
  objectives?: Array<{
    id: string;
    title: string;
    weightMin: number;
    weightMax: number;
    skills: string[];
    requiresLab?: boolean;
  }>;
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

function isCredentialConfig(value: unknown): value is CredentialConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Partial<CredentialConfig>;
  return Boolean(
    candidate.slug &&
    candidate.name &&
    candidate.provider &&
    candidate.category &&
    candidate.type &&
    candidate.description &&
    typeof candidate.passingScore === 'number',
  );
}

function normalizeCredentialConfig(value: unknown): CredentialConfig | null {
  if (!isCredentialConfig(value)) return null;
  return { ...value, id: value.id || value.slug };
}

export function validateCredentialAuthority(config: CredentialConfig): string[] {
  const errors: string[] = [];
  if (!config.authority) return ['authority metadata is required'];
  if (!/^https:\/\//.test(config.authority.sourceUrl))
    errors.push('authority.sourceUrl must use HTTPS');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.authority.effectiveDate))
    errors.push('authority.effectiveDate must be YYYY-MM-DD');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.authority.checkedAt))
    errors.push('authority.checkedAt must be YYYY-MM-DD');
  if (!config.authority.registryKey.trim()) errors.push('authority.registryKey is required');
  if (!config.authority.version.trim()) errors.push('authority.version is required');
  if (config.authority.status !== 'active')
    errors.push(`credential standard is ${config.authority.status}`);
  if (!config.objectives?.length) errors.push('at least one objective domain is required');
  for (const objective of config.objectives ?? []) {
    if (!objective.id.trim() || !objective.title.trim())
      errors.push('objective id and title are required');
    if (
      objective.weightMin < 0 ||
      objective.weightMax > 100 ||
      objective.weightMin > objective.weightMax
    ) {
      errors.push(`objective ${objective.id} has an invalid weight range`);
    }
    if (!objective.skills.length) errors.push(`objective ${objective.id} requires measured skills`);
  }
  return errors;
}

export function loadCredentialConfigs(): CredentialConfig[] {
  const configDir = path.join(process.cwd(), 'lib', 'course-builder', 'credentials');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.info('Created credentials directory:', configDir);
    return [];
  }

  const files = fs
    .readdirSync(configDir)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'));

  const credentials: CredentialConfig[] = [];

  for (const file of files) {
    const filePath = path.join(configDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    try {
      const parsed: unknown = file.endsWith('.json') ? JSON.parse(content) : loadYaml(content);
      if (Array.isArray(parsed)) {
        credentials.push(
          ...parsed
            .map(normalizeCredentialConfig)
            .filter((item): item is CredentialConfig => item !== null),
        );
      } else {
        const credential = normalizeCredentialConfig(parsed);
        if (credential) credentials.push(credential);
      }
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }

  return credentials;
}

export function getCredentialFromConfig(slug: string): CredentialConfig | undefined {
  return loadCredentialConfigs().find((credential) => credential.slug === slug);
}

export function getCredentialStandardByRegistryKey(
  registryKey: string,
): CredentialConfig | undefined {
  return loadCredentialConfigs().find(
    (credential) => credential.authority?.registryKey === registryKey,
  );
}

export function searchCredentialsInConfig(query: string): CredentialConfig[] {
  const lower = query.toLowerCase();
  return loadCredentialConfigs().filter(
    (credential) =>
      credential.name.toLowerCase().includes(lower) ||
      credential.slug.toLowerCase().includes(lower) ||
      credential.provider.toLowerCase().includes(lower) ||
      credential.category.toLowerCase().includes(lower),
  );
}

export function getCredentialsByCategoryInConfig(category: string): CredentialConfig[] {
  return loadCredentialConfigs().filter((credential) => credential.category === category);
}

export const CREDENTIAL_TEMPLATE: CredentialConfig = {
  id: 'your-credential-id',
  slug: 'your-credential-slug',
  name: 'Credential Name',
  provider: 'Provider Name',
  category: 'trades',
  type: 'certification',
  description: 'Brief description of the credential',
  examSections: [
    {
      name: 'Section Name',
      questions: 25,
      passingScore: 70,
      topics: ['Topic 1', 'Topic 2'],
      domainWeight: 25,
    },
  ],
  totalQuestions: 100,
  passingScore: 70,
  examFormat: '100 questions, 2 hours',
  retakePolicy: 'After 14 days',
  validityPeriod: '2 years',
  renewalHours: 10,
  renewalFrequency: '2 years',
  minimumAge: 18,
  educationRequirement: 'High school diploma',
  examFee: '$150',
  states: ['IN', 'OH', 'KY'],
  federalRequirements: ['OSHA 1910'],
  wioaEligible: true,
  sosCodes: ['49-9021.00'],
  careerPathway: 'Entry → Lead → Manager',
  availableOnElevate: true,
  blueprint: {
    criticalNumbers: { numberName: 'number value' },
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
