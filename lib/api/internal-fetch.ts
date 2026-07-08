/**
 * internalFetch — fetch wrapper for service-to-service calls on ECS.
 *
 * ECS tasks have a configurable timeout (default 30s for internal calls). Internal self-calls
 * (e.g. /api/email/send, /api/ocr/extract) can stall indefinitely if the
 * target function cold-starts slowly or DNS resolution hangs. Without a
 * timeout these calls consume the full 26s budget, causing cascading
 * timeouts visible as 21-23s durations in CloudWatch logs.
 *
 * Default timeout: 10s — leaves headroom for the caller to handle the
 * error and return a response before the 30s timeout.
 */
export async function internalFetch(
  url: string,
  init?: RequestInit,
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
