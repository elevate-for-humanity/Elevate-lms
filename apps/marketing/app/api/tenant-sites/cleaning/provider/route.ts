// pre-auth-registry: exempt - A signature-verified email magic-link session owns provider access, never eligibility.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  cleaningContext, cleaningHandler, sameOrigin, reply,
  CLEANING_SITE, CleaningError, serviceSchema,
} from '@/lib/cleaning/server';
import { verifiedProviderEmail } from '@/lib/cleaning/provider-email-proof';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const providerFields = 'id,name,hourly_cents,zips,services,eligibility,opted_in';
const rateSchema = z.number().int().min(1500).max(20000);
const onboardingSchema = z.object({
  action: z.literal('onboard'),
  hourlyCents: rateSchema,
  zips: z.array(z.string().regex(/^\d{5}$/)).min(1).max(100),
  services: z.array(serviceSchema).min(1).max(7),
  // A missing checkbox value is never treated as consent.
  optedIn: z.boolean(),
}).strict();

async function readProvider(db: any, email: string) {
  const result = await db.from('cleaning_providers').select(providerFields)
    .eq('website_id', CLEANING_SITE).eq('email', email).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function readApplication(db: any, email: string) {
  const result = await db.from('tenant_site_leads')
    .select('id,name,email,message,source_path')
    .eq('website_id', CLEANING_SITE).eq('email', email)
    .like('source_path', '%/join-network').order('created_at', { ascending: false })
    .limit(1).maybeSingle();
  if (result.error) throw result.error;
  const lead = result.data;
  if (!lead || lead.email !== email || !/\/join-network$/.test(lead.source_path || '')) return null;
  return lead;
}

export async function GET(request: NextRequest) {
  return cleaningHandler(async () => {
    const { db, user, site, session } = await cleaningContext(request, false, 'provider-onboarding');
    const actor = await verifiedProviderEmail(user, session);
    const provider = await readProvider(db, actor.email);
    const application = provider ? null : await readApplication(db, actor.email);
    let jobs: any[] = [];
    if (provider?.eligibility === 'eligible') {
      const assigned = await db.from('cleaning_jobs')
        .select('id,service,starts_at,summary,customer_name,customer_email,private_details,provider_pay_cents,status')
        .eq('website_id', CLEANING_SITE).eq('provider_id', provider.id)
        .in('status', ['assigned', 'completed']).order('starts_at', { ascending: false }).limit(30);
      if (assigned.error) throw assigned.error;
      jobs = assigned.data || [];
    }
    return reply({
      provider,
      application: application ? { name: application.name } : null,
      jobs,
      jobOffersEnabled: site.site_config?.meta?.cleaningNetworkEnabled === true,
    });
  });
}

export async function POST(request: NextRequest) {
  return cleaningHandler(async () => {
    sameOrigin(request);
    const { db, user, session } = await cleaningContext(request, false, 'provider-onboarding');
    const actor = await verifiedProviderEmail(user, session);
    const raw = z.record(z.string(), z.unknown()).parse(await request.json());

    // Preserve the existing, narrow rate-update contract for reviewed providers.
    if (raw.action !== 'onboard') {
      const input = z.object({ hourlyCents: rateSchema }).strict().parse(raw);
      const saved = await db.from('cleaning_providers').update({ hourly_cents: input.hourlyCents })
        .eq('website_id', CLEANING_SITE).eq('email', actor.email).select('id').maybeSingle();
      if (saved.error) throw saved.error;
      if (!saved.data) throw new CleaningError('Complete your pending provider profile first.', 409);
      return reply({ saved: true });
    }

    const input = onboardingSchema.parse(raw);
    const existing = await readProvider(db, actor.email);
    const changes = {
      hourly_cents: input.hourlyCents,
      zips: [...new Set(input.zips)],
      services: [...new Set(input.services)],
      opted_in: input.optedIn,
    };
    if (existing) {
      if (existing.eligibility !== 'pending') {
        throw new CleaningError('Your service area has already been reviewed. Contact the network team for changes; you can still update your hourly rate here.', 409);
      }
      const saved = await db.from('cleaning_providers').update(changes)
        .eq('website_id', CLEANING_SITE).eq('email', actor.email)
        .eq('id', existing.id).eq('eligibility', 'pending')
        .select(providerFields).maybeSingle();
      if (saved.error) throw saved.error;
      if (!saved.data) throw new CleaningError('Your review status changed. Refresh before editing your profile.', 409);
      return reply({ saved: true, provider: saved.data });
    }

    const lead = await readApplication(db, actor.email);
    if (!lead) throw new CleaningError('Submit the cleaning network application using your verified account email first.', 409);
    const company = String(lead.message || '').match(/Company name, if applicable:[ \t]*([^\r\n]*)/)?.[1]?.trim();
    const name = (company || String(lead.name || '').trim()).slice(0, 200);
    if (!name) throw new CleaningError('Your network application needs a contact name before the provider profile can be created.', 409);

    // Database defaults keep eligibility pending. Unique website/email and lead
    // constraints also cover concurrent requests; never upsert eligibility.
    const saved = await db.from('cleaning_providers').insert({
      website_id: CLEANING_SITE, lead_id: lead.id, name, email: actor.email, ...changes,
    }).select(providerFields).maybeSingle();
    if (saved.error?.code === '23505') {
      const duplicate = await readProvider(db, actor.email);
      if (duplicate) return reply({ saved: true, alreadySubmitted: true, provider: duplicate });
      throw new CleaningError('This application already has a provider profile. Contact the network team to review it.', 409);
    }
    if (saved.error) throw saved.error;
    if (!saved.data) throw new CleaningError('Your provider profile was not confirmed. Refresh before retrying.', 503);
    return reply({ saved: true, provider: saved.data }, 201);
  });
}
