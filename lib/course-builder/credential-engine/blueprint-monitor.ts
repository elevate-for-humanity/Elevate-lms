/**
 * Blueprint Monitoring Service
 * 
 * Monitors credential providers for regulatory changes and updates.
 * 
 * Detects changes → Compares → Updates → Notifies → Regenerates
 */

import { getCredential, type CredentialDefinition } from './credential-registry-universal';

export interface BlueprintChange {
  credentialSlug: string;
  changeType: 'added' | 'removed' | 'modified';
  section?: string;
  topic?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectedAt: string;
  source: string;
}

export interface BlueprintStatus {
  credentialSlug: string;
  credentialName: string;
  lastChecked: string;
  status: 'current' | 'updated' | 'error';
  lastVersion: string;
  changes: BlueprintChange[];
}

export interface MonitorResult {
  checked: number;
  updated: number;
  errors: number;
  results: BlueprintStatus[];
}

/**
 * Monitor all credentials for changes
 */
export async function monitorAllBlueprints(): Promise<MonitorResult> {
  const results: BlueprintStatus[] = [];
  let updated = 0;
  let errors = 0;

  // Import registry
  const { UNIVERSAL_CREDENTIAL_REGISTRY } = await import('./credential-registry-universal');

  for (const [slug, credential] of Object.entries(UNIVERSAL_CREDENTIAL_REGISTRY)) {
    try {
      const status = await monitorCredential(slug);
      results.push(status);
      if (status.status === 'updated') updated++;
    } catch (err) {
      errors++;
      results.push({
        credentialSlug: slug,
        credentialName: slug,
        lastChecked: new Date().toISOString(),
        status: 'error',
        lastVersion: 'unknown',
        changes: [],
      });
    }
  }

  return { checked: results.length, updated, errors, results };
}

/**
 * Monitor a specific credential for changes
 */
export async function monitorCredential(credentialSlug: string): Promise<BlueprintStatus> {
  const credential = getCredential(credentialSlug);
  
  if (!credential) {
    throw new Error(`Credential not found: ${credentialSlug}`);
  }

  const changes: BlueprintChange[] = [];

  // Check each provider for updates
  switch (credential.provider.toLowerCase()) {
    case 'nha':
    case 'national healthcareer association':
      await checkNHAUpdates(credential, changes);
      break;
    case 'osco institute':
    case 'mainstream engineering':
      await checkEPAUpdates(credential, changes);
      break;
    case 'osha':
    case 'osha training institute':
      await checkOSHAUpdates(credential, changes);
      break;
    case 'nccer':
      await checkNCCERUpdates(credential, changes);
      break;
    case 'indiana':
      await checkIndianaUpdates(credential, changes);
      break;
    default:
      // Generic check - compare against last known version
      await genericCheck(credential, changes);
  }

  return {
    credentialSlug,
    credentialName: credential.name,
    lastChecked: new Date().toISOString(),
    status: changes.length > 0 ? 'updated' : 'current',
    lastVersion: getVersion(credentialSlug),
    changes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER-SPECIFIC CHECKS
// ─────────────────────────────────────────────────────────────────────────────

async function checkNHAUpdates(
  credential: CredentialDefinition,
  changes: BlueprintChange[]
): Promise<void> {
  // In production, this would call NHA's API or check their website
  // For now, compare against stored version
  
  const lastKnown = getLastKnownVersion(credential.slug);
  
  // Check if exam format changed
  if (credential.examFormat && lastKnown.examFormat !== credential.examFormat) {
    changes.push({
      credentialSlug: credential.slug,
      changeType: 'modified',
      section: 'exam',
      oldValue: lastKnown.examFormat,
      newValue: credential.examFormat,
      description: `Exam format updated: ${credential.examFormat}`,
      severity: 'high',
      detectedAt: new Date().toISOString(),
      source: 'NHA',
    });
  }

  // Check if passing score changed
  if (lastKnown.passingScore !== credential.passingScore) {
    changes.push({
      credentialSlug: credential.slug,
      changeType: 'modified',
      section: 'exam',
      oldValue: String(lastKnown.passingScore),
      newValue: String(credential.passingScore),
      description: `Passing score changed to ${credential.passingScore}%`,
      severity: 'critical',
      detectedAt: new Date().toISOString(),
      source: 'NHA',
    });
  }
}

async function checkEPAUpdates(
  credential: CredentialDefinition,
  changes: BlueprintChange[]
): Promise<void> {
  // EPA regulations don't change often, but when they do it's critical
  
  const lastKnown = getLastKnownVersion(credential.slug);
  
  // Check for new refrigerants covered
  // Check for regulation updates
  // Check for fine amount changes ($44,539)
  
  // In production: fetch from EPA website
  const epaUpdates = await fetchEPAUpdates();
  
  for (const update of epaUpdates) {
    changes.push({
      credentialSlug: credential.slug,
      changeType: 'modified',
      section: 'regulations',
      description: update.description,
      severity: update.severity as 'critical' | 'high' | 'medium' | 'low',
      detectedAt: new Date().toISOString(),
      source: 'EPA',
    });
  }
}

async function checkOSHAUpdates(
  credential: CredentialDefinition,
  changes: BlueprintChange[]
): Promise<void> {
  // OSHA standards changes
  
  const lastKnown = getLastKnownVersion(credential.slug);
  
  // Check for new OSHA standards
  // Check for regulation updates
  // Check for training hour requirement changes
  
  // In production: fetch from OSHA website
}

async function checkNCCERUpdates(
  credential: CredentialDefinition,
  changes: BlueprintChange[]
): Promise<void> {
  // NCCER module updates
  
  // In production: fetch from NCCER
}

async function checkIndianaUpdates(
  credential: CredentialDefinition,
  changes: BlueprintChange[]
): Promise<void> {
  // Indiana barber/cosmetology board updates
  
  const lastKnown = getLastKnownVersion(credential.slug);
  
  // Check for curriculum requirement changes
  // Check for hour requirement changes (1500 hours, etc.)
  // Check for exam content updates
  
  // In production: check Indiana Professional Licensing Agency
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC CHECKS
// ─────────────────────────────────────────────────────────────────────────────

async function genericCheck(
  credential: CredentialDefinition,
  changes: BlueprintChange[]
): Promise<void> {
  // Generic comparison against last known version
  const lastKnown = getLastKnownVersion(credential.slug);
  
  if (!lastKnown) {
    // First time monitoring this credential
    changes.push({
      credentialSlug: credential.slug,
      changeType: 'added',
      description: 'Credential added to monitoring system',
      severity: 'low',
      detectedAt: new Date().toISOString(),
      source: 'Internal',
    });
    return;
  }

  // Compare exam sections
  if (credential.examSections.length !== lastKnown.examSections?.length) {
    changes.push({
      credentialSlug: credential.slug,
      changeType: 'modified',
      section: 'examStructure',
      description: 'Exam structure has changed',
      severity: 'high',
      detectedAt: new Date().toISOString(),
      source: 'Generic',
    });
  }

  // Compare passing score
  if (credential.passingScore !== lastKnown.passingScore) {
    changes.push({
      credentialSlug: credential.slug,
      changeType: 'modified',
      section: 'passingScore',
      oldValue: String(lastKnown.passingScore),
      newValue: String(credential.passingScore),
      description: `Passing score changed from ${lastKnown.passingScore}% to ${credential.passingScore}%`,
      severity: 'high',
      detectedAt: new Date().toISOString(),
      source: 'Generic',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL API CALLS (Stubs - implement in production)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchEPAUpdates(): Promise<{ description: string; severity: 'critical' | 'high' | 'medium' | 'low' }[]> {
  // In production: fetch from EPA Section 608 website
  // For now, return empty
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// VERSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

interface LastKnownVersion {
  examFormat?: string;
  passingScore?: number;
  examSections?: { name: string; questions: number }[];
  version: string;
  lastUpdated: string;
}

const versionStore = new Map<string, LastKnownVersion>();

function getLastKnownVersion(slug: string): LastKnownVersion | undefined {
  return versionStore.get(slug);
}

function setLastKnownVersion(slug: string, version: LastKnownVersion): void {
  versionStore.set(slug, version);
}

function getVersion(slug: string): string {
  return getLastKnownVersion(slug)?.version || '1.0.0';
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE UPDATE TRIGGER
// ─────────────────────────────────────────────────────────────────────────────

export interface UpdateRecommendation {
  credentialSlug: string;
  changes: BlueprintChange[];
  affectedModules: string[];
  recommendedAction: 'regenerate' | 'review' | 'monitor';
  priority: 'immediate' | 'this-week' | 'this-month';
}

export function recommendUpdates(status: BlueprintStatus): UpdateRecommendation {
  const criticalChanges = status.changes.filter(c => c.severity === 'critical');
  const highChanges = status.changes.filter(c => c.severity === 'high');

  let recommendedAction: UpdateRecommendation['recommendedAction'] = 'monitor';
  let priority: UpdateRecommendation['priority'] = 'this-month';

  if (criticalChanges.length > 0) {
    recommendedAction = 'regenerate';
    priority = 'immediate';
  } else if (highChanges.length > 0) {
    recommendedAction = 'review';
    priority = 'this-week';
  }

  // Identify affected modules based on changed sections
  const affectedModules = status.changes
    .filter(c => c.section)
    .map(c => c.section!);

  return {
    credentialSlug: status.credentialSlug,
    changes: status.changes,
    affectedModules: [...new Set(affectedModules)],
    recommendedAction,
    priority,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyAdmins(recommendation: UpdateRecommendation): Promise<void> {
  // Send notification to admin dashboard
  // Email, Slack, etc.
  
  console.info('Blueprint update notification:', {
    credential: recommendation.credentialSlug,
    changes: recommendation.changes.length,
    action: recommendation.recommendedAction,
    priority: recommendation.priority,
  });
}
