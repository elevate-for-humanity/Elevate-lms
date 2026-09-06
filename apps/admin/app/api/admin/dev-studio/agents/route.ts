import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';
import { isMissingTable, jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';
import { emitPlatformEvent } from '@/lib/platform/orchestration/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('ai_agents')
      .select('id, slug, name, role, description, capabilities, status, model_hint, voice_enabled, voice_type, updated_at')
      .order('name', { ascending: true });

    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }

    return jsonOk({ agents: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to load agents');
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    const voiceEnabled = body.voiceEnabled;
    if (!['ellie', 'lizzy', 'paris'].includes(slug) || typeof voiceEnabled !== 'boolean') {
      return Response.json({ error: 'A valid agent slug and voiceEnabled boolean are required.' }, { status: 400 });
    }

    const db = await requireAdminClient();
    const { data, error } = await db
      .from('ai_agents')
      .update({ voice_enabled: voiceEnabled, updated_at: new Date().toISOString() })
      .eq('slug', slug)
      .select('id, slug, name, voice_enabled, voice_type, updated_at')
      .single();
    if (error) throw error;

    await emitPlatformEvent(db, {
      eventType: 'ai.agent.voice.updated',
      category: 'ai',
      source: 'admin.dev-studio.agents',
      actorId: auth.userId,
      actorType: auth.effectiveRoles[0] ?? 'admin',
      subjectType: 'ai_agent',
      subjectId: data.id,
      severity: 'info',
      dispatch: false,
      payload: { slug, voice_enabled: voiceEnabled },
    });

    return jsonOk({ agent: data });
  } catch (err) {
    return safeInternalError(err, 'Failed to update agent voice configuration');
  }
}
