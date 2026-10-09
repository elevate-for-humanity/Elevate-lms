const SERVICE_HOSTS = new Set([
  'www.elevateforhumanity.org',
  'app.elevateforhumanity.org',
  'admin.elevateforhumanity.org',
]);

export function classifyDeploymentEvent(event) {
  const state = event.deployment_status?.state;
  if (!['success', 'failure'].includes(state)) {
    return { notify: false, reason: 'No terminal deployment state.' };
  }
  const raw = event.deployment_status.environment_url || event.deployment_status.target_url;
  let url;
  try { url = new URL(raw); } catch { throw new Error('Deployment has no valid service URL.'); }
  if (url.protocol === 'https:' && url.hostname === 'github.com' &&
      /^\/elevate-for-humanity\/Elevate-lms\/actions\/runs\/\d+(?:\/job\/\d+)?\/?$/.test(url.pathname)) {
    return { notify: false, reason: 'Job execution status; no website release to health-check.' };
  }
  if (url.protocol !== 'https:' || !SERVICE_HOSTS.has(url.hostname) ||
      url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error('Deployment has no approved production service URL.');
  }
  return { notify: true, origin: url.origin, reason: 'Terminal production website deployment.' };
}
