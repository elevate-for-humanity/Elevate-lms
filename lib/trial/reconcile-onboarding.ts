import { SupabaseClient } from '@supabase/supabase-js';

// In-memory cache: once an org is checked (whether reconciled or already set),
// skip further Supabase queries for this server process. Keyed by org ID.
// TTL prevents stale entries from accumulating across long-lived processes.
const reconcileCache = new Map<string, number>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Reconciles onboarding_started_at for trial organizations.
 *
 * If a trial org has no onboarding_started_at but the user is loading
 * the admin dashboard, the fire-and-forget call from the trial success
 * page must have failed. Set it now so the behavioral signal is accurate.
 *
 * Runs server-side in the admin layout. Idempotent and non-blocking.
 * Short-circuits via in-memory cache after first check per org.
 */
export async function reconcileTrialOnboarding(
  supabase: SupabaseClient,
  organizationId: string
): Promise<void> {
  try {
    // Short-circuit: already checked this org recently
    const cached = reconcileCache.get(organizationId);
    if (cached && Date.now() - cached < CACHE_TTL_MS) return;

    // Check if this org has a trial license
    const { data: license } = await supabase
      .from('licenses')
      .select('id, tier')
      .eq('organization_id', organizationId)
      .eq('tier', 'trial')
      .limit(1)
      .maybeSingle();

    if (!license) {
      reconcileCache.set(organizationId, Date.now()); // Not a trial org — cache and skip
      return;
    }

    // Check if onboarding_started_at is already set
    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_started_at')
      .eq('id', organizationId)
      .single();

    if (!org || org.onboarding_started_at) {
      reconcileCache.set(organizationId, Date.now()); // Already set — cache and skip
      return;
    }

    // User is in the admin dashboard but onboarding_started_at was never set.
    // The fire-and-forget call from trial success page must have failed.
    await supabase
      .from('organizations')
      .update({ onboarding_started_at: new Date().toISOString() })
      .eq('id', organizationId);

    // Log the reconciliation
    await supabase.from('license_events').insert({
      license_id: license.id,
      organization_id: organizationId,
      event_type: 'trial_onboarding_reconciled',
      event_data: {
        source: 'admin_layout_reconciliation',
        reason: 'onboarding_started_at was null on first dashboard load',
      },
    }).catch(() => {}); // Non-critical

    reconcileCache.set(organizationId, Date.now());
  } catch {
    // Reconciliation is best-effort — never block the admin layout
  }
}
