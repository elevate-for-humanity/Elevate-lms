import { observeBlueprintSource } from './source-monitor';
import { requireAdminClient } from '@/lib/supabase/admin';
/**
 * Blueprint Monitoring Service
 * 
 * Monitors credential providers for regulatory changes and updates.
 * 
 * Detects changes → Compares → Updates → Notifies → Regenerates
 */

import { getCredential } from './credential-registry-universal';

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
  status: 'current' | 'updated' | 'error' | 'source_changed' | 'source_unchanged' | 'baseline_recorded';
  lastVersion: string;
  changes: BlueprintChange[];
  verificationScope?: 'official-source-bytes';
  sourceUrl?: string;
  initialObservation?: boolean;
  error?: string;
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
      if (status.status === 'updated' || status.status === 'source_changed') updated++;
      if (status.status === 'error') errors++;
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

  try { return await observeBlueprintSource(credential); }
  catch (error) {
    // No approved source, failed fetch or failed persistence is an error, never current.
    return {credentialSlug,credentialName:credential.name,lastChecked:new Date().toISOString(),status:'error',lastVersion:'unverified',changes:[],error:error instanceof Error?error.message:'Blueprint source check failed.'};
  }
}

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
  if (status.status === 'error' || status.status === 'baseline_recorded') { recommendedAction = 'review'; priority = 'this-week'; }

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
  const db = await requireAdminClient();
  const {data: admins,error: lookupError} = await db.from('profiles').select('id').in('role',['admin','super_admin']).eq('is_active',true);
  if (lookupError) throw lookupError;
  if (!admins?.length) throw new Error('BLUEPRINT_NOTIFICATION_RECIPIENTS_MISSING');
  const rows = admins.map(admin => ({user_id:admin.id,type:'system',title:'Credential blueprint review required',
    message:`${recommendation.credentialSlug}: ${recommendation.changes.length} change(s); ${recommendation.recommendedAction}; priority ${recommendation.priority}.`,
    action_url:'/studio',read:false,metadata:{kind:'blueprint-review',recommendation}}));
  const {data:saved,error} = await db.from('notifications').insert(rows).select('id');
  if (error) throw error;
  if (saved?.length !== rows.length) throw new Error('BLUEPRINT_NOTIFICATION_RECEIPT_MISSING');
}
