// PUBLIC ROUTE: one-shot business launch (workspace + website + optional LMS seed)
import { NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeOk } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { hydrateProcessEnv } from '@/lib/secrets';
import { startWorkspaceTrial } from '@/lib/workspace/start-workspace-trial';
import { requireAdminClient } from '@/lib/supabase/admin';
import { aiChat } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';

type LaunchBody = {
  organizationName: string;
  ownerEmail: string;
  ownerName?: string;
  industry?: string;
  businessDescription?: string;
  template?: string;
  includeLms?: boolean;
};

/**
 * POST /api/onboarding/launch
 *
 * Vision flow: describe business → provision workspace → AI site config → optional LMS stub.
 */
async function _POST(request: NextRequest) {
  await hydrateProcessEnv();

  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const body = (await request.json()) as LaunchBody;
    const organizationName = body.organizationName?.trim();
    const ownerEmail = body.ownerEmail?.trim().toLowerCase();

    if (!organizationName || organizationName.length < 2) {
      return safeError('organizationName is required', 400);
    }
    if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      return safeError('Valid ownerEmail is required', 400);
    }

    const trial = await startWorkspaceTrial({
      organizationName,
      ownerEmail,
      ownerName: body.ownerName,
      industry: body.industry ?? 'Training Provider',
      plan: 'builder',
    });

    if (!trial.ok) {
      return safeError(trial.error, trial.status ?? 500);
    }

    let aiSiteEnhanced = false;
    if (body.businessDescription?.trim()) {
      try {
        const result = await aiChat({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content:
                'You write concise marketing homepage copy for workforce training businesses. Return JSON: {"heroTitle","heroSubtitle","aboutParagraph","services":[{"title","description"}]}',
            },
            {
              role: 'user',
              content: `Business: ${organizationName}. Industry: ${body.industry ?? 'training'}. Description: ${body.businessDescription}`,
            },
          ],
          temperature: 0.6,
          maxTokens: 800,
        });

        const raw = result.content ?? '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          const db = await requireAdminClient();
          const { data: site } = await db
            .from('user_websites')
            .select('id, site_config')
            .eq('organization_id', trial.organizationId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (site?.id) {
            const cfg =
              site.site_config && typeof site.site_config === 'object'
                ? { ...(site.site_config as object) }
                : {};
            await db
              .from('user_websites')
              .update({
                site_config: {
                  ...cfg,
                  homepage: {
                    heroTitle: parsed.heroTitle,
                    heroSubtitle: parsed.heroSubtitle,
                    aboutParagraph: parsed.aboutParagraph,
                  },
                  services: parsed.services,
                  aiGenerated: true,
                },
                updated_at: new Date().toISOString(),
              } as Record<string, unknown>)
              .eq('id', site.id);
            aiSiteEnhanced = true;
          }
        }
      } catch (e) {
        logger.warn('[onboarding/launch] AI site enhancement skipped', e);
      }
    }

    let lmsSeeded = false;
    if (body.includeLms) {
      const db = await requireAdminClient();
      const { data: existing } = await db
        .from('courses')
        .select('id')
        .eq('organization_id', trial.organizationId)
        .limit(1)
        .maybeSingle();

      if (!existing?.id) {
        await db.from('courses').insert({
          title: `${organizationName} Training Program`,
          slug: `${trial.slug}-intro-program`,
          status: 'draft',
          organization_id: trial.organizationId,
          description: 'Auto-generated starter program — customize in Course Studio.',
        } as Record<string, unknown>);
        lmsSeeded = true;
      }
    }

    return safeOk({
      workspaceId: trial.workspaceId,
      organizationId: trial.organizationId,
      slug: trial.slug,
      publicPreviewUrl: trial.publicPreviewUrl,
      dashboardUrl: trial.dashboardUrl,
      trialEndsAt: trial.trialEndsAt,
      aiSiteEnhanced,
      lmsSeeded,
      nextSteps: [
        { label: 'View public site', href: trial.publicPreviewUrl },
        { label: 'Open admin dashboard', href: trial.dashboardUrl },
        { label: 'Choose a plan', href: '/store/plans' },
      ],
    });
  } catch (err) {
    return safeInternalError(err, 'Launch failed');
  }
}

export const POST = withRuntime(withApiAudit('/api/onboarding/launch', _POST));
