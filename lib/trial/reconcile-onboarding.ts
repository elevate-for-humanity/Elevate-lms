import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Reconciles onboarding_started_at for trial organizations.
 *
 * If a trial org has no onboarding_started_at but the user is loading
 * the admin dashboard, the fire-and-forget call from the trial success
 * page must have failed. Set it now so the behavioral signal is accurate.
 *
 * Runs server-side in the admin layout. Idempotent and non-blocking.
 */
export async function reconcileTrialOnboarding(
  supabase: SupabaseClient,
  organizationId: string
): Promise<void> {
  try {
    // Check if this org has a trial license
    const { data: license } = await supabase
      .from('licenses')
      .select('id, tier')
      .eq('organization_id', organizationId)
      .eq('tier', 'trial')
      .limit(1)
      .maybeSingle();

    if (!license) return; // Not a trial org, nothing to reconcile

    // Check if onboarding_started_at is already set
    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_started_at')
      .eq('id', organizationId)
      .single();

    if (!org || org.onboarding_started_at) return; // Already set or org not found

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
  } catch {
    // Reconciliation is best-effort — never block the admin layout
  }
}
