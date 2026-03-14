export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { providerApiGuard } from '@/lib/api/provider-guard';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const guard = await providerApiGuard();
  if (guard.error) return guard.error;
  const { tenantId } = guard;

  const supabase = await createClient();

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return safeError('Invalid request body', 400); }

  const { orgId, name, tagline, supportEmail, website, phone, addressLine1, city, state, zip, logoUrl } = body as Record<string, string | null>;

  if (!name?.trim()) return safeError('Organization name is required', 400);

  // Also update tenant name to stay in sync
  await supabase.from('tenants').update({ name, updated_at: new Date().toISOString() }).eq('id', tenantId);

  if (orgId) {
    const { error } = await supabase
      .from('organizations')
      .update({
        name, tagline: tagline ?? null, support_email: supportEmail ?? null,
        website: website ?? null, phone: phone ?? null,
        address_line1: addressLine1 ?? null, city: city ?? null,
        state: state ?? null, zip: zip ?? null, logo_url: logoUrl ?? null,
      })
      .eq('id', orgId)
      .eq('tenant_id', tenantId);

    if (error) return safeInternalError(error, 'Failed to update settings');
  } else {
    // Generate unique slug with suffix on collision (D6 fix)
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
    let slug = base;
    let suffix = 0;
    while (true) {
      const { count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('slug', slug);
      if ((count ?? 0) === 0) break;
      suffix++;
      slug = `${base}-${suffix}`;
      if (suffix > 100) { slug = `${base}-${Date.now()}`; break; }
    }

    const { error } = await supabase
      .from('organizations')
      .insert({
        name, slug, tenant_id: tenantId,
        tagline: tagline ?? null, support_email: supportEmail ?? null,
        website: website ?? null, phone: phone ?? null,
        address_line1: addressLine1 ?? null, city: city ?? null,
        state: state ?? null, zip: zip ?? null, logo_url: logoUrl ?? null,
        type: 'training_provider',
      });

    if (error) return safeInternalError(error, 'Failed to create organization record');
  }

  // Mark profile_complete onboarding step if name + support email are set
  if (name && supportEmail) {
    await supabase
      .from('provider_onboarding_steps')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('step', 'profile_complete')
      .eq('completed', false);
  }

  return NextResponse.json({ success: true });
}
