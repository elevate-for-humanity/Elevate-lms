import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { resolvePublishedTenantFromRequest } from '@/lib/tenant/resolve-public-tenant';
import { canManageHostedWebsite } from '@/lib/websites/can-manage-hosted-website';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { applyProviderRequestLimit } from './provider-rate-limit';
export const CLEANING_SITE = 'e0fcb1f1-33f8-4b2c-abeb-ec8e0a819231';
export const CLEANING_URL = 'https://www.elevateforhumanity.org/sites/2exclusive-platinum-cleaning';
export const serviceSchema = z.enum(['standard','deep','moveout','commercial','event','carpet','valet-trash']);
export class CleaningError extends Error { constructor(message: string, readonly status = 400, readonly code?: string, readonly retryAfter?: string | null) { super(message); } }
export const hashCapability = (token: string) => createHash('sha256').update(token).digest('hex');
export const newCapability = () => randomBytes(32).toString('hex');
export const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export function sameOrigin(request: NextRequest) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new CleaningError('Use this website to continue.',403);
}
export async function cleaningContext(
  request: NextRequest,
  owner = false,
  capability: 'commerce' | 'provider-onboarding' = 'commerce',
) {
  const limited = capability === 'provider-onboarding'
    ? await applyProviderRequestLimit(request, 'profile')
    : await applyRateLimit(request, 'contact');
  if (limited) throw new CleaningError('Please wait before trying again.',429,undefined,limited.headers.get('Retry-After'));
  const db = await requireAdminClient();
  const { data: site, error } = await db.from('user_websites').select('id,site_config,is_published').eq('id',CLEANING_SITE).maybeSingle();
  if (error || !site?.is_published) throw new CleaningError('Cleaning website unavailable.',503);
  if (!owner) {
    const tenant = await resolvePublishedTenantFromRequest(request);
    const commerceEnabled = site.site_config?.meta?.cleaningNetworkEnabled === true;
    const enabled = capability === 'provider-onboarding'
      ? commerceEnabled || site.site_config?.meta?.cleaningProviderOnboardingEnabled === true
      : commerceEnabled;
    if (tenant?.websiteId !== CLEANING_SITE || !enabled)
      throw new CleaningError(capability === 'provider-onboarding'
        ? 'Cleaning provider enrollment is not enabled.'
        : 'Online cleaning booking is not enabled.',503);
  }
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (owner) {
    if (!user || !(await canManageHostedWebsite(db,CLEANING_SITE,user.id))) throw new CleaningError('Sign in as this website’s administrator.',403);
  }
  return { db, user, site, session };
}
export async function requireCleaningOwner(request:NextRequest){return cleaningContext(request,true);}
export function verifiedCustomer(user: any) {
  if (!user?.id || !user.email || !user.email_confirmed_at) throw new CleaningError('Sign in with a verified email to continue.',401);
  return { id: user.id as string, email: String(user.email).toLowerCase() };
}
export async function rpc(db: any, name: string, args: Record<string,unknown>) {
  const result = await db.rpc(name,args);
  if (result.error) throw new CleaningError('This action could not be completed. Refresh the record and review its current status.',409);
  return result.data;
}
export async function cleaningHandler(work: () => Promise<NextResponse>) {
  try { return await work(); }
  catch(error) {
    if (error instanceof CleaningError) {
      const response = reply({ error:error.message, ...(error.code ? { code: error.code } : {}) },error.status);
      if (error.retryAfter) response.headers.set('Retry-After', error.retryAfter);
      return response;
    }
    if (error instanceof z.ZodError) return reply({ error:error.issues[0]?.message || 'Check the form.' },400);
    return reply({ error:'Cleaning service is temporarily unavailable. Your payment or assignment has not been confirmed here.' },503);
  }
}
