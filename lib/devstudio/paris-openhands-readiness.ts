import 'server-only';

import {getRuntimeReadiness} from '@/lib/health/service-health';
import {getHydratedOpenHandsConfig} from './openhands/client';

const REPOSITORY = 'elevate-for-humanity/Elevate-lms';
const CLOUD_ORIGIN = 'https://app.all-hands.dev';

/** One bounded, read-only Cloud request. Never starts or resumes an agent. */
export async function probeOpenHandsReadiness() {
  const runtime = getRuntimeReadiness();
  const base = {
    diagnosticVersion: 1,
    readOnly: true,
    agentStarted: false,
    writeAuthority: 'not_exercised',
    commit: runtime.commit,
    revision: runtime.revision,
    credentialAuthority: process.env.ELEVATE_RUNTIME_CONFIG_PROVIDER === 'google-secret-manager'
      ? 'google-secret-manager' : 'canonical-runtime-with-environment-fallback',
  };
  let config;
  try {
    config = await getHydratedOpenHandsConfig();
  } catch {
    return {...base, verified: false, status: 'configuration_unavailable',
      apiKeyResolved: null, repositoryMatches: null, providerRequestMade: false};
  }
  const configuration = {
    apiKeyResolved: Boolean(config.apiKey?.trim()),
    repositoryMatches: config.configuredRepository === REPOSITORY,
  };
  if (!configuration.apiKeyResolved || !configuration.repositoryMatches) {
    return {...base, ...configuration, verified: false, status: 'not_configured', providerRequestMade: false};
  }
  // Do not send the credential to an arbitrary configured URL or a redirect.
  // Other provider origins need their own verified diagnostic contract.
  if (config.origin !== CLOUD_ORIGIN) {
    return {...base, ...configuration, verified: false, status: 'origin_not_verified', providerRequestMade: false};
  }
  const result = {...base, ...configuration, providerRequestMade: true};
  try {
    const response = await fetch(`${CLOUD_ORIGIN}/api/v1/app-conversations/search?limit=1`, {
      method: 'GET',
      headers: {Authorization: `Bearer ${config.apiKey}`, Accept: 'application/json'},
      redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10_000),
    });
    if (response.status !== 200) {
      await response.body?.cancel();
      return {...result, verified: false, status: response.status === 401 || response.status === 403
        ? 'authorization_failed' : 'provider_http_failure', httpStatus: response.status};
    }
    if (!response.headers.get('content-type')?.includes('application/json')) {
      await response.body?.cancel();
      return {...result, verified: false, status: 'invalid_provider_response', httpStatus: 200};
    }
    // Check the documented response shape, then discard all account/task data.
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.items)) {
      return {...result, verified: false, status: 'invalid_provider_response', httpStatus: 200};
    }
    return {...result, verified: true, status: 'read_authorization_verified', httpStatus: 200};
  } catch {
    return {...result, verified: false, status: 'provider_request_failed'};
  }
}
