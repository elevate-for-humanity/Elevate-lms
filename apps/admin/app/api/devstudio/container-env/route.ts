/**
 * /api/devstudio/container-env
 *
 * Legacy AWS-only environment mutation endpoint. Northflank production env vars are configured in Northflank.
 * Legacy variables are stored in AWS SSM Parameter Store at /elevate/<KEY> and
 * referenced from the task definition secrets array.
 *
 * GET  — returns current legacy AWS env vars from the active task definition
 * POST { key, value, services? } — legacy SSM + task-def update flow
 * DELETE { key, services? }      — legacy SSM + task-def delete flow
 *
 * Admin-only. Legacy AWS credentials resolved from platform_secrets → process.env.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SSMClient, PutParameterCommand, DeleteParameterCommand } from '@aws-sdk/client-ssm';
import {
  ECSClient,
  DescribeTaskDefinitionCommand,
  RegisterTaskDefinitionCommand,
  UpdateServiceCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REGION  = 'us-east-1';
const CLUSTER = 'elevate-cluster';
const SSM_PATH = '/elevate/';

const SERVICE_MAP: Record<string, string> = {
  lms:    'elevate-lms-service',
  admin:  'elevate-admin-service',
  studio: 'elevate-studio-service',
};

const TASK_DEF_MAP: Record<string, string> = {
  lms:    'elevate-lms',
  admin:  'elevate-admin',
  studio: 'elevate-studio',
};

async function resolveSecret(db: Awaited<ReturnType<typeof requireAdminClient>>, key: string): Promise<string | null> {
  const envVal = process.env[key];
  if (envVal?.trim()) return envVal.trim();
  const { data } = await db.from('platform_secrets').select('value_enc').eq('key', key).maybeSingle();
  return data?.value_enc?.trim() || null;
}

async function getClients(db: Awaited<ReturnType<typeof requireAdminClient>>) {
  const accessKeyId     = await resolveSecret(db, 'AWS_ACCESS_KEY_ID');
  const secretAccessKey = await resolveSecret(db, 'AWS_SECRET_ACCESS_KEY');
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in platform_secrets');
  }
  const creds = { credentials: { accessKeyId, secretAccessKey }, region: REGION };
  return {
    ssm: new SSMClient(creds),
    ecs: new ECSClient(creds),
  };
}

// ── GET — list env vars from active task definitions ─────────────────────────

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { ecs } = await getClients(db);

    const results: Record<string, { environment: { name: string; value: string }[]; secrets: { name: string; valueFrom: string }[] }> = {};

    for (const [svc, taskFamily] of Object.entries(TASK_DEF_MAP)) {
      const { taskDefinition } = await ecs.send(new DescribeTaskDefinitionCommand({ taskDefinition: taskFamily }));
      const container = taskDefinition?.containerDefinitions?.[0];
      results[svc] = {
        environment: container?.environment ?? [],
        secrets: container?.secrets ?? [],
      };
    }

    return NextResponse.json({ services: results, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return safeInternalError(err, 'Failed to read container env');
  }
}

// ── POST — set a variable on one or both task definitions ────────────────────

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => null);
    const { key, value, services = ['lms', 'admin'] } = body ?? {};

    if (!key || typeof key !== 'string') return safeError('key is required', 400);
    if (value === undefined || value === null) return safeError('value is required', 400);
    if (!/^[A-Z0-9_]+$/.test(key)) return safeError('key must be uppercase letters, digits, underscores', 400);

    const db = await requireAdminClient();
    const { ssm, ecs } = await getClients(db);

    // 1. Write to SSM
    const ssmKey = `${SSM_PATH}${key}`;
    await ssm.send(new PutParameterCommand({
      Name: ssmKey,
      Value: value,
      Type: 'SecureString',
      Overwrite: true,
    }));

    // 2. Also upsert into platform_secrets so the admin dashboard reflects it
    await db.from('platform_secrets').upsert({
      key,
      value_enc: value,
      category: inferCategory(key),
      updated_by: auth.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    // 3. Update each requested task definition
    const updated: string[] = [];
    for (const svc of services as string[]) {
      const taskFamily = TASK_DEF_MAP[svc];
      const serviceName = SERVICE_MAP[svc];
      if (!taskFamily || !serviceName) continue;

      const { taskDefinition: td } = await ecs.send(new DescribeTaskDefinitionCommand({ taskDefinition: taskFamily }));
      if (!td) continue;

      const container = { ...td.containerDefinitions![0] };

      // Add/update in secrets array (SSM reference)
      const secrets = (container.secrets ?? [])
        .filter((s) => s.name !== key)
        .map((s) => ({ name: s.name ?? '', valueFrom: s.valueFrom ?? '' }));
      secrets.push({ name: key, valueFrom: `arn:aws:ssm:${REGION}:954718262498:parameter${ssmKey}` });
      container.secrets = secrets;

      // Remove from plain environment array if it was there
      container.environment = (container.environment ?? [])
        .filter((e) => e.name !== key)
        .map((e) => ({ name: e.name ?? '', value: e.value ?? '' }));

      // Register new task def revision
      const { taskDefinition: newTd } = await ecs.send(new RegisterTaskDefinitionCommand({
        family:                  td.family,
        networkMode:             td.networkMode,
        requiresCompatibilities: td.requiresCompatibilities,
        cpu:                     td.cpu,
        memory:                  td.memory,
        executionRoleArn:        td.executionRoleArn,
        taskRoleArn:             td.taskRoleArn,
        containerDefinitions:    [container],
        volumes:                 td.volumes,
      }));

      // Update service to use new revision
      await ecs.send(new UpdateServiceCommand({
        cluster: CLUSTER,
        service: serviceName,
        taskDefinition: newTd!.taskDefinitionArn,
        forceNewDeployment: true,
      }));

      updated.push(svc);
    }

    logger.info('[container-env] set', { key, services: updated, actor: auth.id });
    return NextResponse.json({ success: true, key, updatedServices: updated });
  } catch (err) {
    return safeInternalError(err, 'Failed to set container env var');
  }
}

// ── DELETE — remove a variable from task definitions ─────────────────────────

export async function DELETE(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const servicesParam = searchParams.get('services');
    const services = servicesParam ? servicesParam.split(',') : ['lms', 'admin'];

    if (!key) return safeError('key param required', 400);

    const db = await requireAdminClient();
    const { ssm, ecs } = await getClients(db);

    // Delete from SSM
    try {
      await ssm.send(new DeleteParameterCommand({ Name: `${SSM_PATH}${key}` }));
    } catch {
      // Parameter may not exist in SSM — continue
    }

    const updated: string[] = [];
    for (const svc of services) {
      const taskFamily = TASK_DEF_MAP[svc];
      const serviceName = SERVICE_MAP[svc];
      if (!taskFamily || !serviceName) continue;

      const { taskDefinition: td } = await ecs.send(new DescribeTaskDefinitionCommand({ taskDefinition: taskFamily }));
      if (!td) continue;

      const container = { ...td.containerDefinitions![0] };
      container.secrets     = (container.secrets ?? []).filter((s) => s.name !== key).map((s) => ({ name: s.name ?? '', valueFrom: s.valueFrom ?? '' }));
      container.environment = (container.environment ?? []).filter((e) => e.name !== key).map((e) => ({ name: e.name ?? '', value: e.value ?? '' }));

      const { taskDefinition: newTd } = await ecs.send(new RegisterTaskDefinitionCommand({
        family:                  td.family,
        networkMode:             td.networkMode,
        requiresCompatibilities: td.requiresCompatibilities,
        cpu:                     td.cpu,
        memory:                  td.memory,
        executionRoleArn:        td.executionRoleArn,
        taskRoleArn:             td.taskRoleArn,
        containerDefinitions:    [container],
        volumes:                 td.volumes,
      }));

      await ecs.send(new UpdateServiceCommand({
        cluster: CLUSTER,
        service: serviceName,
        taskDefinition: newTd!.taskDefinitionArn,
        forceNewDeployment: true,
      }));

      updated.push(svc);
    }

    logger.info('[container-env] deleted', { key, services: updated, actor: auth.id });
    return NextResponse.json({ success: true, key, updatedServices: updated });
  } catch (err) {
    return safeInternalError(err, 'Failed to delete container env var');
  }
}

function inferCategory(key: string): string {
  if (/^(GROQ|OPENAI|ANTHROPIC|GEMINI|AZURE_OPENAI|ELEVENLABS|HEYGEN|DID_|STABILITY|RUNWAY|SUNO)/.test(key)) return 'ai';
  if (/^(AWS|CLOUDFLARE|R2_|REDIS|UPSTASH|SUPABASE|DATABASE|POSTGRES|VAPID|SSN_|SESSION|NEXTAUTH|CRON|AUDIT|INTERNAL|STUDIO_SHELL)/.test(key)) return 'infra';
  if (/^(STRIPE|AFFIRM|SEZZLE|QB_)/.test(key)) return 'payments';
  if (/^(SMTP|SENDGRID|RESEND|EMAIL|MAIL|REPLY_TO|ALERT_EMAIL|ADMIN_ALERT|SPONSOR_FINANCE|MOU_ARCHIVE|NOTIFY|LEAD_NOTIFICATION|LICENSE_NOTIFICATION|SECURITY_EMAIL)/.test(key)) return 'email';
  if (/^(GITHUB|GOOGLE|LINKEDIN|FACEBOOK|TWITTER|INSTAGRAM|YOUTUBE|SLACK|TWILIO|HUBSPOT|SALESFORCE|ZAPIER|CALENDLY|JOTFORM|SENTRY|DURABLE|WORKOS|ZOOM|TEAMS)/.test(key)) return 'integrations';
  return 'general';
}
