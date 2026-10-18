/** Interpret the existing Studio service contract without exposing configuration or storage paths. */
export function describeBrowserReadiness(
  httpOk: boolean,
  value: unknown,
): { ready: boolean; detail: string } {
  if (!value || typeof value !== 'object')
    return { ready: false, detail: 'Studio browser returned invalid readiness data' };
  const body = value as Record<string, unknown>;
  if (body.service !== 'studio-browser' || body.engine !== 'direct-cdp-chromium')
    return {
      ready: false,
      detail: 'Configured endpoint did not identify the Studio CDP browser runtime',
    };
  const failed: string[] = [];
  const unreported: string[] = [];
  for (const [key, label] of [
    ['providerAuthStorage', 'provider login storage'],
    ['terminalRecovery', 'terminal recovery'],
    ['browserWorkspaceRecovery', 'browser session storage'],
    ['workspaceRecovery', 'repository recovery'],
  ]) {
    const check = body[key] as
      | { ready?: boolean; lastSaveError?: unknown; storage?: { ready?: boolean } }
      | undefined;
    if (!check) unreported.push(label);
    else if (check.ready !== true || check.lastSaveError || check.storage?.ready === false)
      failed.push(label);
  }
  const ready =
    httpOk &&
    body.ok === true &&
    body.ready === true &&
    body.browserConnected === true &&
    body.browserState === 'ready' &&
    failed.length === 0;
  return {
    ready,
    detail: ready
      ? `Studio CDP runtime reports ready; browser actions and terminal execution still require functional verification${unreported.length ? `; recovery not reported: ${unreported.join(', ')}` : ''}`
      : `Studio runtime is not ready${failed.length ? `: ${failed.join(', ')}` : '; inspect browser lifecycle readiness'}`,
  };
}
