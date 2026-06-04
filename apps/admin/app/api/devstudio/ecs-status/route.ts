/**
 * GET /api/devstudio/ecs-status
 *
 * Returns live ECS task health for both services (LMS + Admin).
 * Uses AWS ECS API directly via SigV4-signed fetch — no extra SDK needed.
 * Admin-only.
 *
 * Response shape:
 * {
 *   services: [
 *     {
 *       name: string,
 *       status: 'ACTIVE' | 'INACTIVE' | 'DRAINING',
 *       runningCount: number,
 *       desiredCount: number,
 *       pendingCount: number,
 *       cpu: string,
 *       memory: string,
 *       lastDeployedAt: string | null,
 *       taskDefinition: string,
 *       healthy: boolean,
 *     }
 *   ],
 *   cluster: string,
 *   fetchedAt: string,
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { createHmac, createHash } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REGION  = process.env.AWS_REGION ?? 'us-east-1';
const CLUSTER = 'elevate-cluster';
const SERVICES = ['elevate-lms-service', 'elevate-admin-service', 'elevate-studio-service'];

// ── SigV4 helpers ─────────────────────────────────────────────────────────────

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function sha256hex(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate    = hmac('AWS4' + secretKey, dateStamp);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

interface SignedHeaders {
  Authorization: string;
  'x-amz-date': string;
  'x-amz-target': string;
  'Content-Type': string;
  host: string;
}

function signEcsRequest(target: string, body: string): { headers: SignedHeaders; url: string } {
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKey || !secretKey) throw new Error('AWS credentials not configured');

  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const host        = `ecs.${REGION}.amazonaws.com`;
  const endpoint    = `https://${host}/`;
  const contentType = 'application/x-amz-json-1.1';
  const payloadHash = sha256hex(body);

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;

  const signedHeadersList = 'content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeadersList,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${REGION}/ecs/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(secretKey, dateStamp, REGION, 'ecs');
  const signature  = createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeadersList}, Signature=${signature}`;

  return {
    url: endpoint,
    headers: {
      Authorization: authorization,
      'x-amz-date': amzDate,
      'x-amz-target': target,
      'Content-Type': contentType,
      host,
    },
  };
}

async function ecsPost(target: string, body: object): Promise<unknown> {
  const bodyStr = JSON.stringify(body);
  const { url, headers } = signEcsRequest(target, bodyStr);
  const res = await fetch(url, { method: 'POST', headers, body: bodyStr });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ECS API error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return safeError('AWS credentials not configured', 503);
  }

  try {
    // Describe both services in one call
    const data = await ecsPost('AmazonEC2ContainerServiceV20141113.DescribeServices', {
      cluster: CLUSTER,
      services: SERVICES,
    }) as {
      services?: Array<{
        serviceName: string;
        status: string;
        runningCount: number;
        desiredCount: number;
        pendingCount: number;
        taskDefinition: string;
        deployments?: Array<{ updatedAt: string; status: string }>;
      }>;
      failures?: Array<{ arn: string; reason: string }>;
    };

    const services = (data.services ?? []).map((svc) => {
      const primaryDeploy = (svc.deployments ?? []).find((d) => d.status === 'PRIMARY');
      // Extract cpu/memory from task def ARN family name — actual values come from task def
      const tdShort = svc.taskDefinition?.split('/').pop() ?? svc.taskDefinition ?? '';

      return {
        name: svc.serviceName,
        status: svc.status,
        runningCount: svc.runningCount,
        desiredCount: svc.desiredCount,
        pendingCount: svc.pendingCount,
        taskDefinition: tdShort,
        lastDeployedAt: primaryDeploy?.updatedAt ?? null,
        healthy: svc.status === 'ACTIVE' && svc.runningCount >= svc.desiredCount,
      };
    });

    // Include any failures (service not found, etc.)
    const failures = (data.failures ?? []).map((f) => ({
      name: f.arn?.split('/').pop() ?? f.arn,
      status: 'NOT_FOUND',
      runningCount: 0,
      desiredCount: 0,
      pendingCount: 0,
      taskDefinition: '',
      lastDeployedAt: null,
      healthy: false,
      reason: f.reason,
    }));

    return NextResponse.json({
      cluster: CLUSTER,
      services: [...services, ...failures],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to fetch legacy ECS status');
  }
}
