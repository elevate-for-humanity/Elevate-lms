// pre-auth-registry: exempt - Current signed Auth claims and a server-owned same-browser mailbox proof own provider access, never eligibility.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  cleaningContext, cleaningHandler, sameOrigin, reply,
  CLEANING_SITE, CleaningError, serviceSchema,
} from '@/lib/cleaning/server';
import { verifiedProviderEmail } from '@/lib/cleaning/provider-email-proof';
import { providerApplicationName, providerIdentityRevision } from '@/lib/cleaning/provider-snapshot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const providerFields = 'id,lead_id,name,hourly_cents,zips,services,eligibility,opted_in';
const rateSchema = z.number().int().min(1500).max(20000);
const identityFields = {
  applicationId: z.uuid(),
  confirmedBusinessName: z.string().min(1).max(200).refine(value => value.trim().length > 0),
  identityRevision: z.string().regex(/^[a-f0-9]{64}$/),
  identityConfirmed: z.literal(true),
};
const onboardingSchema = z.object({
  action: z.literal('onboard'),
  ...identityFields,
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

async function readApplication(db: any, email: string, id: string) {
  const result = await db.from('tenant_site_leads')
    .select('id,name,email,message,source_path')
    .eq('website_id', CLEANING_SITE).eq('email', email).eq('id', id)
    .like('source_path', '%/join-network').maybeSingle();
  if (result.error) throw result.error;
  const lead = result.data;
  if (!lead || lead.email !== email || !/\/join-network$/.test(lead.source_path || '')) return null;
  return lead;
}

function withIdentity(provider: any, email: string) {
  return provider ? {
    ...provider,
    identityRevision: providerIdentityRevision(CLEANING_SITE, provider.lead_id, email, provider.name),
  } : null;
}

function confirmIdentity(provider: any, input: z.infer<typeof onboardingSchema> | z.infer<typeof consentSchema>, email: string) {
  if (input.applicationId !== provider.lead_id || input.confirmedBusinessName !== provider.name ||
      input.identityRevision !== providerIdentityRevision(CLEANING_SITE, provider.lead_id, email, provider.name)) {
    throw new CleaningError('Your provider identity changed. Refresh and confirm the displayed application and business name.', 409);
  }
}

const consentSchema = z.object({ action: z.literal('consent'), ...identityFields, optedIn: z.boolean() }).strict();

export async function GET(request: NextRequest) {
  return cleaningHandler(async () => {
    const { db, user, site, session } = await cleaningContext(request, false, 'provider-onboarding');
    const actor = await verifiedProviderEmail(user, session, db);
    const provider = await readProvider(db, actor.email);
    let applications: any[] = [];
    if (!provider) {
      const result = await db.from('tenant_site_leads')
        .select('id,name,email,message,source_path,created_at')
        .eq('website_id', CLEANING_SITE).eq('email', actor.email)
        .like('source_path', '%/join-network')
        .order('created_at', { ascending: false }).limit(200);
      if (result.error) throw result.error;
      applications = (result.data || [])
        .filter((lead: any) => lead.email === actor.email && /\/join-network$/.test(lead.source_path || ''))
        .map((lead: any) => {
          const name = providerApplicationName(lead);
          return { id: lead.id, contactName: lead.name, name, createdAt: lead.created_at || null,
            identityRevision: providerIdentityRevision(CLEANING_SITE, lead.id, actor.email, name) };
        }).filter((lead: any) => lead.name);
    }
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
      provider: withIdentity(provider, actor.email),
      applications,
      jobs,
      jobOffersEnabled: site.site_config?.meta?.cleaningNetworkEnabled === true,
    });
  });
}

export async function POST(request: NextRequest) {
  return cleaningHandler(async () => {
    sameOrigin(request);
    const { db, user, session } = await cleaningContext(request, false, 'provider-onboarding');
    const actor = await verifiedProviderEmail(user, session, db);
    const raw = z.record(z.string(), z.unknown()).parse(await request.json());

    if (raw.action === 'consent') {
      const input = consentSchema.parse(raw);
      const existing = await readProvider(db, actor.email);
      if (!existing || existing.eligibility === 'pending') throw new CleaningError('Confirm your pending provider identity and save your profile before changing reviewed-profile email preferences.', 409);
      confirmIdentity(existing, input, actor.email);
      const saved = await db.from('cleaning_providers').update({ opted_in: input.optedIn })
        .eq('website_id', CLEANING_SITE).eq('email', actor.email)
        .eq('id', existing.id).eq('lead_id', existing.lead_id).eq('name', existing.name)
        .in('eligibility', ['eligible', 'suspended']).select(providerFields).maybeSingle();
      if (saved.error) throw saved.error;
      if (!saved.data) throw new CleaningError('Your provider identity or status changed. Refresh before saving your email preference.', 409);
      return reply({ saved: true, provider: withIdentity(saved.data, actor.email) });
    }

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
      confirmIdentity(existing, input, actor.email);
      const saved = await db.from('cleaning_providers').update(changes)
        .eq('website_id', CLEANING_SITE).eq('email', actor.email)
        .eq('id', existing.id).eq('eligibility', 'pending')
        .eq('lead_id', existing.lead_id).eq('name', existing.name)
        .select(providerFields).maybeSingle();
      if (saved.error) throw saved.error;
      if (!saved.data) throw new CleaningError('Your review status changed. Refresh before editing your profile.', 409);
      return reply({ saved: true, provider: withIdentity(saved.data, actor.email) });
    }

    const lead = await readApplication(db, actor.email, input.applicationId);
    if (!lead) throw new CleaningError('Submit the cleaning network application using your verified account email first.', 409);
    const name = providerApplicationName(lead);
    if (!name) throw new CleaningError('Your network application needs a contact name before the provider profile can be created.', 409);
    if (input.confirmedBusinessName !== name ||
        input.identityRevision !== providerIdentityRevision(CLEANING_SITE, lead.id, actor.email, name)) {
      throw new CleaningError('The selected application identity changed. Refresh and confirm the displayed business name before saving.', 409);
    }

    // Database defaults keep eligibility pending. Unique website/email and lead
    // constraints also cover concurrent requests; never upsert eligibility.
    const saved = await db.from('cleaning_providers').insert({
      website_id: CLEANING_SITE, lead_id: lead.id, name, email: actor.email, ...changes,
    }).select(providerFields).maybeSingle();
    if (saved.error?.code === '23505') {
      const duplicate = await readProvider(db, actor.email);
      if (duplicate?.lead_id === lead.id && duplicate.name === name) {
        return reply({ saved: true, alreadySubmitted: true, provider: withIdentity(duplicate, actor.email) });
      }
      throw new CleaningError('This application already has a provider profile. Contact the network team to review it.', 409);
    }
    if (saved.error) throw saved.error;
    if (!saved.data) throw new CleaningError('Your provider profile was not confirmed. Refresh before retrying.', 503);
    return reply({ saved: true, provider: withIdentity(saved.data, actor.email) }, 201);
  });
}
