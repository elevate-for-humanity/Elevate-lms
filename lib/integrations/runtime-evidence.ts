import type { SupabaseClient } from '@supabase/supabase-js';
import type { SiteHealthSnapshot } from '@/lib/admin/get-site-health';
import { RUNTIME_INTEGRATIONS, runtimeConfiguration } from './runtime-status';

const healthNames: Record<string, string> = {
  supabase: 'Supabase Database', quickbooks: 'QuickBooks', paypal: 'PayPal Billing',
  'sendgrid-inbound': 'SendGrid', resend: 'Resend',
};

export function runtimeComponent(): string {
  const component = process.env.ELEVATE_RUNTIME_COMPONENT || process.env.APP_NAME || '';
  if (['marketing', 'admin', 'lms', 'store', 'ultimate-worker'].includes(component)) return component;
  const service = process.env.K_SERVICE || '';
  const match = /^elevate-(marketing|admin|lms|store)(?:-migration)?$/.exec(service);
  return match?.[1] || 'admin';
}

/** Provider authentication, configuration and data delivery remain separate facts. */
export async function recordRuntimeIntegrationEvidence(db: SupabaseClient, snapshot: SiteHealthSnapshot) {
  const component = runtimeComponent();
  const rawCommit = process.env.GIT_SHA || process.env.GITHUB_SHA || process.env.NEXT_PUBLIC_GIT_SHA;
  const commit = /^[a-f0-9]{40}$/.test(rawCommit || '') ? rawCommit : null;
  const observations = RUNTIME_INTEGRATIONS.map(item => {
    const health = snapshot.services.find(row => row.name === healthNames[item.id]);
    // A successful database query proves the DB connection even if configuration
    // was hydrated through the canonical client rather than process.env.
    const configured = runtimeConfiguration(item.id).configured || (item.id === 'supabase' && health?.status === 'healthy');
    const authenticated = configured && health?.status === 'healthy';
    return { provider: item.id, configured, authenticated,
      reason: authenticated ? 'authentication_verified' : !configured ? 'configuration_missing' : health ? 'authentication_unverified' : 'provider_probe_required' };
  });
  // Await every receipt; never return a successful durable snapshot on a failed write.
  for (const observation of observations) {
    const { error } = await db.rpc('record_runtime_integration_probe', {
      p_provider: observation.provider, p_component: component,
      p_configured: observation.configured, p_authenticated: observation.authenticated,
      p_reason: observation.reason, p_commit: commit,
    });
    if (error) throw new Error('Integration monitoring receipt could not be saved');
  }
  return { component, recorded: observations.length, checkedAt: snapshot.checkedAt, observations };
}
