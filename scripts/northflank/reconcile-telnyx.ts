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
const configuredConnectionId = process.env.TELNYX_CONNECTION_ID || '3051039365166794471';
let connectionId = configuredConnectionId;
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

function matchingKeyNames(root: unknown): string[] {
  const matches = new Set<string>();
  const seen = new Set<unknown>();
  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    for (const [key, nested] of Object.entries(value as Json)) {
      if (/tel|nyx/i.test(key)) matches.add(key);
      if (
        nested &&
        typeof nested === 'object' &&
        /tel|nyx/i.test(String((nested as Json).key ?? (nested as Json).name ?? ''))
      ) {
        matches.add(String((nested as Json).key ?? (nested as Json).name));
      }
      walk(nested);
    }
  };
  walk(root);
  return [...matches].sort();
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
  const canonicalApiKey = findSecret(secretGroup, 'TELNYX_API_KEY');
  let apiKey = suppliedApiKey || canonicalApiKey;
  let publicKey =
    suppliedPublicKey || findSecret(secretGroup, 'TELNYX_PUBLIC_KEY');
  let adminService: Json | undefined;
  const inspectedGroups: Json[] = [secretGroup];

  if (!apiKey) {
    const listing = await nfFetch<any>(projectApiPath(projectId, '/secrets'));
    const listedGroups = Array.isArray(listing)
      ? listing
      : listing?.secrets || listing?.items || listing?.results || [];
    for (const summary of listedGroups) {
      const id = String(summary?.id || summary?.name || '').trim();
      if (!id || id === secretGroupId) continue;
      try {
        const group = await nfFetch<Json>(
          projectApiPath(projectId, `/secrets/${id}`),
        );
        inspectedGroups.push(group);
        const discovered = findSecret(group, 'TELNYX_API_KEY');
        if (discovered) {
          apiKey = discovered;
          publicKey ||= findSecret(group, 'TELNYX_PUBLIC_KEY');
          console.log(`Telnyx credential located in Northflank secret group ${id}.`);
          break;
        }
      } catch {
        // A list may include a secret outside this token's readable scope.
      }
    }
  }

  if (!apiKey) {
    const adminServiceId =
      process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
    adminService = await nfFetch<Json>(
      projectApiPath(projectId, `/services/${adminServiceId}`),
    );
    apiKey = findSecret(adminService.runtimeEnvironment, 'TELNYX_API_KEY');
    publicKey ||= findSecret(
      adminService.runtimeEnvironment,
      'TELNYX_PUBLIC_KEY',
    );
  }

  if (apiKey && !canonicalApiKey) {
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
            TELNYX_API_KEY: apiKey,
            ...(publicKey ? { TELNYX_PUBLIC_KEY: publicKey } : {}),
          },
        },
      }),
    });
    console.log('Northflank Telnyx runtime credentials synchronized.');
  }

  if (!apiKey) {
    const candidateNames = [
      ...inspectedGroups.flatMap((group) => matchingKeyNames(group)),
      ...matchingKeyNames(adminService?.runtimeEnvironment),
    ];
    throw new Error(
      `TELNYX_API_KEY is absent from Northflank secret group ${secretGroupId} and the Admin service runtime. Similar key names: ${candidateNames.length ? [...new Set(candidateNames)].join(', ') : 'none'}`,
    );
  }

  const numberBefore = await telnyx<Json>(apiKey, `/phone_numbers/${numberId}`);
  const currentNumber = String(numberBefore.data?.phone_number || '');
  if (currentNumber && currentNumber !== expectedNumber) {
    throw new Error(
      `Telnyx number ID resolves to ${currentNumber}, expected ${expectedNumber}`,
    );
  }

  // Re-assert the complete inbound route even when the connection ID already
  // matches. This is intentionally idempotent and forces Telnyx to reconcile
  // the carrier-side number route after a number returns a fast busy without
  // producing a Call Control webhook.
  await telnyx(apiKey, `/phone_numbers/${numberId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      connection_id: connectionId,
      call_forwarding_enabled: false,
      number_level_routing: 'disabled',
    }),
  });

  const profiles = await telnyx<Json>(
    apiKey,
    '/outbound_voice_profiles?page[size]=250',
  );
  let outboundProfileId = String(
    process.env.TELNYX_OUTBOUND_VOICE_PROFILE_ID ||
      profiles.data?.find?.((profile: Json) => profile.name === 'Elevate Production Voice')?.id ||
      profiles.data?.[0]?.id ||
      '',
  );
  if (!outboundProfileId) {
    const created = await telnyx<Json>(apiKey, '/outbound_voice_profiles', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Elevate Production Voice',
        traffic_type: 'conversational',
        service_plan: 'global',
        whitelisted_destinations: ['US'],
      }),
    });
    outboundProfileId = String(created.data?.id || '');
    if (!outboundProfileId) throw new Error('Telnyx did not return an outbound voice profile ID');
    console.log('Telnyx production outbound voice profile created.');
  }

  const appBefore = await telnyx<Json>(
    apiKey,
    `/call_control_applications/${connectionId}`,
  );
  // One-time carrier recovery: the existing connection is correctly configured
  // but Telnyx is returning a fast busy before emitting an inbound webhook.
  // Provisioning a fresh Call Control connection replaces the defective
  // carrier-side route without changing the public number or application URL.
  const replacement = await telnyx<Json>(apiKey, '/call_control_applications', {
    method: 'POST',
    body: JSON.stringify({
      application_name: 'Elevate Communications Production',
      webhook_event_url: webhookUrl,
      webhook_event_failover_url:
        appBefore.data?.webhook_event_failover_url || `${webhookUrl}/failover`,
      webhook_api_version: '2',
      active: true,
      anchorsite_override: appBefore.data?.anchorsite_override || 'Latency',
      dtmf_type: appBefore.data?.dtmf_type || 'RFC 2833',
      first_command_timeout: true,
      first_command_timeout_secs: 15,
      inbound: appBefore.data?.inbound,
      outbound: { outbound_voice_profile_id: outboundProfileId },
    }),
  });
  const replacementConnectionId = String(replacement.data?.id || '');
  if (!replacementConnectionId) {
    throw new Error('Telnyx did not return the replacement Call Control connection ID');
  }
  connectionId = replacementConnectionId;
  await telnyx(apiKey, `/phone_numbers/${numberId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      connection_id: connectionId,
      call_forwarding_enabled: false,
      number_level_routing: 'disabled',
    }),
  });

  const variables = secretGroup.secrets?.variables;
  if (!variables || Array.isArray(variables) || typeof variables !== 'object') {
    throw new Error('Northflank secret group variables have an unsupported shape');
  }
  await nfFetch(projectApiPath(projectId, `/secrets/${secretGroupId}`), {
    method: 'POST',
    body: JSON.stringify({
      name: secretGroup.name || secretGroupId,
      description: secretGroup.description || 'Elevate shared production secrets/config',
      priority: secretGroup.priority ?? 10,
      type: secretGroup.type || 'secret',
      secretType: secretGroup.secretType || 'environment',
      restrictions: secretGroup.restrictions,
      secrets: {
        variables: { ...variables, TELNYX_CONNECTION_ID: connectionId },
      },
    }),
  });
  console.log(`TELNYX REPLACEMENT CONNECTION: ${connectionId}`);
  const outboundBefore = String(
    appBefore.data?.outbound?.outbound_voice_profile_id || '',
  );
  if (
    String(appBefore.data?.webhook_event_url || '') !== webhookUrl ||
    String(appBefore.data?.webhook_api_version || '') !== '2' ||
    appBefore.data?.active !== true ||
    outboundBefore !== outboundProfileId
  ) {
    await telnyx(apiKey, `/call_control_applications/${connectionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        webhook_event_url: webhookUrl,
        webhook_api_version: '2',
        active: true,
        outbound: { outbound_voice_profile_id: outboundProfileId },
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
  const outboundConnected =
    String(appAfter.data?.outbound?.outbound_voice_profile_id || '') ===
    outboundProfileId;

  if (!numberConnected || !webhookConnected || !outboundConnected) {
    throw new Error(
      `Telnyx verification failed: numberConnected=${numberConnected} webhookConnected=${webhookConnected} outboundConnected=${outboundConnected}`,
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
