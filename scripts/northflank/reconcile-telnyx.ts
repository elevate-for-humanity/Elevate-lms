#!/usr/bin/env tsx
/**
 * Reconcile the production Telnyx number with Elevate's Call Control application.
 *
 * The Telnyx key remains in Northflank's restricted secret group. This script
 * reads it inside GitHub Actions through the existing Northflank API token,
 * never prints it, applies idempotent provider configuration, and verifies the
 * final state before deployment is considered healthy.
 */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const secretGroupId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
const numberId = process.env.TELNYX_PHONE_NUMBER_ID || '3050756061020554451';
const connectionId = process.env.TELNYX_CONNECTION_ID || '3051039365166794471';
const expectedNumber = process.env.TELNYX_PHONE_NUMBER || '+13179999620';
const webhookUrl =
  process.env.TELNYX_WEBHOOK_URL ||
  'https://admin.elevateforhumanity.org/api/webhooks/telnyx';

type Json = Record<string, any>;

function findSecret(root: unknown, key: string): string | undefined {
  const seen = new Set<unknown>();
  const walk = (value: unknown): string | undefined => {
    if (!value || typeof value !== 'object' || seen.has(value)) return undefined;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (
          item &&
          typeof item === 'object' &&
          String((item as Json).key ?? (item as Json).name ?? '') === key &&
          typeof ((item as Json).value ?? (item as Json).secret) === 'string'
        ) {
          return String((item as Json).value ?? (item as Json).secret);
        }
        const nested = walk(item);
        if (nested) return nested;
      }
      return undefined;
    }
    const record = value as Json;
    if (typeof record[key] === 'string') return record[key];
    for (const nested of Object.values(record)) {
      const found = walk(nested);
      if (found) return found;
    }
    return undefined;
  };
  return walk(root);
}

async function telnyx<T = Json>(
  apiKey: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://api.telnyx.com/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  const body = await response.text();
  let json: Json = {};
  try {
    json = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`Telnyx returned non-JSON HTTP ${response.status}`);
  }
  if (!response.ok) {
    const detail = json.errors?.map((e: Json) => e.title || e.detail).filter(Boolean).join('; ');
    throw new Error(`Telnyx HTTP ${response.status} ${options.method || 'GET'} ${path}: ${detail || 'request failed'}`);
  }
  return json as T;
}

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');

  const secretGroup = await nfFetch<Json>(
    projectApiPath(projectId, `/secrets/${secretGroupId}`),
  );
  const suppliedApiKey = process.env.TELNYX_API_KEY?.trim();
  const suppliedPublicKey = process.env.TELNYX_PUBLIC_KEY?.trim();
  let apiKey = suppliedApiKey || findSecret(secretGroup, 'TELNYX_API_KEY');

  if (suppliedApiKey && !findSecret(secretGroup, 'TELNYX_API_KEY')) {
    const variables = secretGroup.secrets?.variables;
    if (!variables || Array.isArray(variables) || typeof variables !== 'object') {
      throw new Error('Northflank secret group variables have an unsupported shape');
    }
    await nfFetch(projectApiPath(projectId, `/secrets/${secretGroupId}`), {
      method: 'POST',
      body: JSON.stringify({
        name: secretGroup.name || secretGroupId,
        description:
          secretGroup.description || 'Elevate shared production secrets/config',
        priority: secretGroup.priority ?? 10,
        type: secretGroup.type || 'secret',
        secretType: secretGroup.secretType || 'environment',
        restrictions: secretGroup.restrictions,
        secrets: {
          variables: {
            ...variables,
            TELNYX_API_KEY: suppliedApiKey,
            ...(suppliedPublicKey ? { TELNYX_PUBLIC_KEY: suppliedPublicKey } : {}),
          },
        },
      }),
    });
    console.log('Northflank Telnyx runtime credentials synchronized.');
  }

  if (!apiKey) {
    const adminServiceId =
      process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
    const adminService = await nfFetch<Json>(
      projectApiPath(projectId, `/services/${adminServiceId}`),
    );
    apiKey = findSecret(adminService.runtimeEnvironment, 'TELNYX_API_KEY');
  }

  if (!apiKey) {
    throw new Error(
      `TELNYX_API_KEY is absent from Northflank secret group ${secretGroupId} and the Admin service runtime`,
    );
  }

  const numberBefore = await telnyx<Json>(apiKey, `/phone_numbers/${numberId}`);
  const currentNumber = String(numberBefore.data?.phone_number || '');
  if (currentNumber && currentNumber !== expectedNumber) {
    throw new Error(
      `Telnyx number ID resolves to ${currentNumber}, expected ${expectedNumber}`,
    );
  }

  if (String(numberBefore.data?.connection_id || '') !== connectionId) {
    await telnyx(apiKey, `/phone_numbers/${numberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ connection_id: connectionId }),
    });
  }

  const appBefore = await telnyx<Json>(
    apiKey,
    `/call_control_applications/${connectionId}`,
  );
  if (
    String(appBefore.data?.webhook_event_url || '') !== webhookUrl ||
    String(appBefore.data?.webhook_api_version || '') !== '2'
  ) {
    await telnyx(apiKey, `/call_control_applications/${connectionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        webhook_event_url: webhookUrl,
        webhook_api_version: '2',
        active: true,
      }),
    });
  }

  const [numberAfter, appAfter] = await Promise.all([
    telnyx<Json>(apiKey, `/phone_numbers/${numberId}`),
    telnyx<Json>(apiKey, `/call_control_applications/${connectionId}`),
  ]);

  const numberConnected =
    String(numberAfter.data?.connection_id || '') === connectionId;
  const webhookConnected =
    String(appAfter.data?.webhook_event_url || '') === webhookUrl &&
    String(appAfter.data?.webhook_api_version || '') === '2';

  if (!numberConnected || !webhookConnected) {
    throw new Error(
      `Telnyx verification failed: numberConnected=${numberConnected} webhookConnected=${webhookConnected}`,
    );
  }

  console.log(
    `TELNYX VERIFIED: ${expectedNumber} -> connection ${connectionId} -> ${webhookUrl}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
