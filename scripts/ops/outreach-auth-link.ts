/**
 * Canonical outbound auth links for ops emails.
 * Flow: Supabase magic link → /auth/callback?redirect=… → role destination.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { outboundSiteUrl } from './outbound-site-url';

export type OutreachPersona = 'program_holder' | 'partner';

/** Ordered post-login destinations per persona (shown in email + used for magic links). */
export const OUTREACH_JOURNEYS: Record<
  OutreachPersona,
  { dashboard: string; steps: { label: string; path: string }[] }
> = {
  program_holder: {
    dashboard: '/program-holder/dashboard',
    steps: [
      { label: 'Sign your Program Holder MOU', path: '/program-holder/sign-mou' },
      { label: 'Open your Program Holder Dashboard', path: '/program-holder/dashboard' },
    ],
  },
  partner: {
    dashboard: '/partner/dashboard',
    steps: [
      { label: 'Sign your Barber Host Shop MOU', path: '/partners/barber-host-shop/sign-mou' },
      { label: 'Upload required documents', path: '/partners/barber-host-shop/documents' },
      { label: 'Open your Partner Dashboard', path: '/partner/dashboard' },
    ],
  },
};

export function roleDashboardPath(role: string): string {
  return getRoleDestination(role);
}

/** `/auth/callback?redirect=…` used as Supabase `redirectTo` (chronological landing). */
export function authCallbackRedirectTo(destinationPath: string, fallback?: string): string {
  const site = outboundSiteUrl();
  const dest = validateRedirect(destinationPath, fallback ?? '/learner/dashboard');
  return `${site}/auth/callback?redirect=${encodeURIComponent(dest)}`;
}

/** Login page link when magic link cannot be generated (password users). */
export function loginRedirectUrl(destinationPath: string, fallback?: string): string {
  const site = outboundSiteUrl();
  const dest = validateRedirect(destinationPath, fallback ?? '/learner/dashboard');
  return `${site}/login?redirect=${encodeURIComponent(dest)}`;
}

export async function generateOutreachMagicLink(
  db: SupabaseClient,
  email: string,
  destinationPath: string,
  fallback?: string,
): Promise<string> {
  const redirectTo = authCallbackRedirectTo(destinationPath, fallback);
  const { data, error } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });
  if (error) {
    console.warn(`  ⚠ magic link for ${email}: ${error.message} — using login URL`);
    return loginRedirectUrl(destinationPath, fallback);
  }
  return data.properties?.action_link ?? loginRedirectUrl(destinationPath, fallback);
}

export async function buildJourneyLinks(
  db: SupabaseClient,
  email: string,
  persona: OutreachPersona,
): Promise<{ dashboard: string; steps: { label: string; path: string; url: string }[] }> {
  const journey = OUTREACH_JOURNEYS[persona];
  const steps = await Promise.all(
    journey.steps.map(async (step) => ({
      ...step,
      url: await generateOutreachMagicLink(db, email, step.path, journey.dashboard),
    })),
  );
  const dashboard = await generateOutreachMagicLink(db, email, journey.dashboard, journey.dashboard);
  return { dashboard, steps };
}

export function journeyStepsHtml(
  steps: { label: string; url: string }[],
  options?: { primaryIndex?: number },
): string {
  const primary = options?.primaryIndex ?? 0;
  const rows = steps
    .map((step, i) => {
      const n = i + 1;
      const isPrimary = i === primary;
      const btn = isPrimary
        ? `<a href="${step.url}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold;margin-top:8px">${step.label} →</a>`
        : `<a href="${step.url}" style="color:#dc2626;font-weight:bold">${step.label} →</a>`;
      return `<li style="margin-bottom:16px;font-size:14px;line-height:1.6;color:#475569"><strong>Step ${n}.</strong> ${step.label}<br/>${btn}</li>`;
    })
    .join('');
  return `<ol style="margin:0 0 20px;padding-left:20px;list-style:decimal">${rows}</ol>`;
}
