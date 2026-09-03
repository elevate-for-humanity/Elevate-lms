import crypto from 'node:crypto';

export const OPEN_BADGES_CONTEXT =
  'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json';
export const VC_CREDENTIAL_SCHEMA_CONTEXT = {
  '1EdTechJsonSchemaValidator2019':
    'https://purl.imsglobal.org/spec/vccs/v1p0/context.json#1EdTechJsonSchemaValidator2019',
} as const;
export const OPEN_BADGES_CREDENTIAL_SCHEMA =
  'https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json';

export type OpenBadgeStatus = 'active' | 'expired' | 'revoked';
export type OpenBadgeContext = string | Record<string, string>;

export interface OpenBadgeIssuerProfile {
  id: string;
  type: 'Profile' | ['Profile'];
  name: string;
  url: string;
  email?: string;
}

export interface OpenBadgeIdentityObject {
  type: 'IdentityObject';
  hashed: true;
  identityHash: string;
  identityType: 'email';
  salt: string;
}

export interface OpenBadgeAchievement {
  id: string;
  type: 'Achievement' | ['Achievement'];
  name: string;
  description: string;
  achievementType?: string;
  criteria: {
    narrative?: string;
    id?: string;
  };
  image?: {
    id: string;
    type: 'Image';
  };
  alignment?: Array<{
    type: 'Alignment' | ['Alignment'];
    targetCode?: string;
    targetName: string;
    targetFramework?: string;
    targetType?: string;
    targetUrl: string;
  }>;
}

export interface OpenBadgeCredential {
  '@context': OpenBadgeContext[];
  id: string;
  type: ['VerifiableCredential', 'OpenBadgeCredential'];
  issuer: OpenBadgeIssuerProfile;
  validFrom: string;
  validUntil?: string;
  name: string;
  credentialSubject: {
    type: 'AchievementSubject' | ['AchievementSubject'];
    identifier: OpenBadgeIdentityObject;
    achievement: OpenBadgeAchievement;
  };
  credentialSchema: Array<{
    id: string;
    type: '1EdTechJsonSchemaValidator2019';
  }>;
  proof?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export interface BuildOpenBadgeInput {
  credentialId: string;
  verificationCode: string;
  recipientIdentifier: string;
  recipientSalt: string;
  issuedAt: string;
  expiresAt?: string | null;
  achievement: {
    id: string;
    name: string;
    description: string;
    achievementType?: string | null;
    criteriaNarrative?: string | null;
    criteriaUrl?: string | null;
    imageUrl?: string | null;
    alignment?: OpenBadgeAchievement['alignment'];
  };
}

function getBaseUrl(): string {
  return (
    process.env.OPEN_BADGES_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.elevateforhumanity.org'
  ).replace(/\/$/, '');
}

export function getOpenBadgeIssuerProfile(): OpenBadgeIssuerProfile {
  const baseUrl = getBaseUrl();
  return {
    id: process.env.OPEN_BADGES_ISSUER_ID || `${baseUrl}/api/credentials/issuer`,
    type: 'Profile',
    name:
      process.env.OPEN_BADGES_ISSUER_NAME ||
      'Elevate for Humanity Career & Technical Institute',
    url: process.env.OPEN_BADGES_ISSUER_URL || baseUrl,
    ...(process.env.OPEN_BADGES_ISSUER_EMAIL
      ? { email: process.env.OPEN_BADGES_ISSUER_EMAIL }
      : {}),
  };
}

export function createRecipientSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashRecipientIdentifier(identifier: string, salt: string): string {
  const normalized = identifier.trim().toLowerCase();
  const digest = crypto.createHash('sha256').update(`${normalized}${salt}`).digest('hex');
  return `sha256$${digest}`;
}

export function buildOpenBadgeCredential(input: BuildOpenBadgeInput): OpenBadgeCredential {
  const baseUrl = getBaseUrl();
  const credentialUrl = `${baseUrl}/api/credentials/${encodeURIComponent(input.verificationCode)}`;

  const achievement: OpenBadgeAchievement = {
    id: input.achievement.id,
    type: 'Achievement',
    name: input.achievement.name,
    description: input.achievement.description,
    ...(input.achievement.achievementType
      ? { achievementType: input.achievement.achievementType }
      : {}),
    criteria: {
      ...(input.achievement.criteriaNarrative
        ? { narrative: input.achievement.criteriaNarrative }
        : {}),
      ...(input.achievement.criteriaUrl ? { id: input.achievement.criteriaUrl } : {}),
    },
    ...(input.achievement.imageUrl
      ? { image: { id: input.achievement.imageUrl, type: 'Image' as const } }
      : {}),
    ...(input.achievement.alignment?.length
      ? { alignment: input.achievement.alignment }
      : {}),
  };

  return {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      OPEN_BADGES_CONTEXT,
      VC_CREDENTIAL_SCHEMA_CONTEXT,
    ],
    id: credentialUrl,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: getOpenBadgeIssuerProfile(),
    validFrom: new Date(input.issuedAt).toISOString(),
    ...(input.expiresAt ? { validUntil: new Date(input.expiresAt).toISOString() } : {}),
    name: input.achievement.name,
    credentialSubject: {
      type: 'AchievementSubject',
      identifier: {
        type: 'IdentityObject',
        hashed: true,
        identityHash: hashRecipientIdentifier(input.recipientIdentifier, input.recipientSalt),
        identityType: 'email',
        salt: input.recipientSalt,
      },
      achievement,
    },
    credentialSchema: [
      {
        id: OPEN_BADGES_CREDENTIAL_SCHEMA,
        type: '1EdTechJsonSchemaValidator2019',
      },
    ],
  };
}

export function validateOpenBadgeStructure(credential: OpenBadgeCredential): string[] {
  const errors: string[] = [];

  if (!credential['@context']?.includes(OPEN_BADGES_CONTEXT)) {
    errors.push('Missing Open Badges 3.0 JSON-LD context');
  }
  const hasSchemaContext = credential['@context']?.some(
    (context) =>
      typeof context === 'object' &&
      context !== null &&
      context['1EdTechJsonSchemaValidator2019'] ===
        VC_CREDENTIAL_SCHEMA_CONTEXT['1EdTechJsonSchemaValidator2019'],
  );
  if (!hasSchemaContext) {
    errors.push('Missing 1EdTech credential schema validator JSON-LD mapping');
  }
  if (!credential.type?.includes('OpenBadgeCredential')) {
    errors.push('type must include OpenBadgeCredential');
  }
  if (!credential.id?.startsWith('https://') && !credential.id?.startsWith('urn:uuid:')) {
    errors.push('Credential id must be a stable HTTPS URL or UUID URN');
  }
  if (!credential.issuer?.id || !credential.issuer?.name) {
    errors.push('Issuer profile is incomplete');
  }
  if (!credential.validFrom) {
    errors.push('validFrom is required');
  }
  if (!credential.credentialSubject?.achievement?.id) {
    errors.push('Achievement id is required');
  }
  if (!credential.credentialSubject?.achievement?.name) {
    errors.push('Achievement name is required');
  }
  if (!credential.credentialSubject?.achievement?.description) {
    errors.push('Achievement description is required');
  }
  const identity = credential.credentialSubject?.identifier;
  if (!identity?.identityHash || !identity?.salt || identity.identityType !== 'email') {
    errors.push('Hashed recipient IdentityObject is required');
  }
  if (!identity?.identityHash?.startsWith('sha256$')) {
    errors.push('Recipient identityHash must declare sha256');
  }
  if (!credential.credentialSchema?.some((schema) => schema.id === OPEN_BADGES_CREDENTIAL_SCHEMA)) {
    errors.push('Open Badges 3.0 credentialSchema is required');
  }

  return errors;
}

export function getOpenBadgeStatus(args: {
  status?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
}): OpenBadgeStatus {
  if (args.status === 'revoked' || args.revokedAt) return 'revoked';
  if (args.expiresAt && new Date(args.expiresAt).getTime() < Date.now()) return 'expired';
  return 'active';
}
