/** Authenticated Modal broker. A proxy token is never exposed to a browser. */
export function createModalProvider({env = process.env, request = fetch} = {}) {
  if (env.EXTERNAL_COMPUTE_ENABLED !== 'true') throw new Error('EXTERNAL_COMPUTE_DISABLED');
  const endpoint = new URL(env.MODAL_COMPUTE_ENDPOINT ?? '');
  if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.modal.run') ||
      endpoint.username || endpoint.password || endpoint.search || endpoint.hash)
    throw new Error('TRUSTED_MODAL_ENDPOINT_REQUIRED');
  if (!env.MODAL_PROXY_KEY || !env.MODAL_PROXY_SECRET) throw new Error('MODAL_PROXY_AUTH_REQUIRED');
  const call = async body => {
    // Deliberately no automatic retries, redirects, or Google fallback.
    const response = await request(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
      headers: {'Content-Type': 'application/json', 'Modal-Key': env.MODAL_PROXY_KEY,
        'Modal-Secret': env.MODAL_PROXY_SECRET}, body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('MODAL_BROKER_HTTP_' + response.status);
    return response.json();
  };
  return {
    health: () => call({action: 'health'}),
    submit: ({attemptId}) => call({action: 'submit', attemptId}),
    cancel: ({executionId}) => call({action: 'cancel', executionId}),
    status: ({executionId}) => call({action: 'status', executionId}),
  };
}
