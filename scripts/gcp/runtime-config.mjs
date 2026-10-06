import { spawnSync } from 'node:child_process';

export const PROJECT = 'elegant-racer-299721';
export const COMPONENTS = ['marketing', 'admin', 'lms', 'store', 'ultimate-worker', 'studio-browser'];
export function configSecret(component) {
  if (!COMPONENTS.includes(component)) throw new Error('Unsupported runtime component');
  return `elevate-${component}-runtime-config`;
}
export function googleFailureCode(stderr = '') {
  if (/SERVICE_DISABLED|API .*not enabled|has not been used.*before|is disabled/i.test(stderr)) return 'api_disabled';
  if (/PERMISSION_DENIED|permission denied|does not have permission|Permission .* denied/i.test(stderr)) return 'permission_denied';
  if (/NOT_FOUND|was not found|does not exist/i.test(stderr)) return 'not_found';
  if (/UNAUTHENTICATED|invalid_grant|authentication failed/i.test(stderr)) return 'authentication_failed';
  if (/RESOURCE_EXHAUSTED|quota exceeded/i.test(stderr)) return 'quota_exceeded';
  return 'command_failed';
}
export function google(args, input) {
  const result = spawnSync('gcloud', args, { input, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  // CLI errors may include credential values. Never emit stdout/stderr on failure.
  if (result.status !== 0) {
    const error = new Error(`Google operation failed: ${args.slice(0, 3).join(' ')}`);
    error.code = googleFailureCode(result.stderr); throw error;
  }
  return result.stdout.trim();
}
export function validateConfig(config, component) {
  if (config?.version !== 1 || config.component !== component || !config.runtimeEnvironment || typeof config.runtimeEnvironment !== 'object' || Array.isArray(config.runtimeEnvironment))
    throw new Error('Invalid Google runtime configuration');
  for (const [key, value] of Object.entries(config.runtimeEnvironment)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== 'string' || /\$\{[^}]+\}/.test(value))
      throw new Error('Invalid runtime variable');
  }
  if (!Array.isArray(config.volumes) || !config.runtimeFiles || typeof config.runtimeFiles !== 'object' || Array.isArray(config.runtimeFiles))
    throw new Error('Runtime persistence inventory required');
  if (Buffer.byteLength(JSON.stringify(config), 'utf8') > 65536) throw new Error('Configuration exceeds Secret Manager payload limit; split secrets before import');
  return config;
}
export function loadGoogleConfig(component, run = google) {
  const name = configSecret(component);
  const raw = run(['secrets', 'versions', 'access', 'latest', '--secret', name, '--project', PROJECT]);
  let config;
  try { config = JSON.parse(raw); } catch { throw new Error('Invalid Google configuration payload'); }
  return validateConfig(config, component);
}
