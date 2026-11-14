/** One endpoint selection contract for Paris chat, engineering, course jobs,
 * diagnostics and deployment readback. Never serialize this result to clients. */
export function resolveOwnedModelConnection(env=process.env) {
  const gpu = env.PARIS_GPU_ENABLED === 'true' && env.PARIS_INFERENCE_TIER === 'gpu';
  const tier = gpu ? 'gpu' : 'cpu';
  const raw = (gpu ? env.ELEVATE_LLM_GPU_URL : env.ELEVATE_LLM_CPU_URL || env.ELEVATE_LLM_URL)?.trim();
  const token = (gpu ? env.ELEVATE_LLM_GPU_SECRET : env.ELEVATE_LLM_CPU_SECRET || env.ELEVATE_LLM_SECRET)?.trim() || null;
  const configured = Boolean(raw && token);
  if (!raw) return {base:null, token, tier, configured};
  const base = raw.replace(/\/+$/, '');
  try {
    const url = new URL(base);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        /(^|\.)(?:code\.run|northflank\.app|northflank\.com)$/i.test(url.hostname)) return {base:null, token, tier, configured};
    return {base, token, tier, configured};
  } catch { return {base:null, token, tier, configured}; }
}
