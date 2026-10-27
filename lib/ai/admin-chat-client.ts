import 'server-only';
import OpenAI from 'openai';

/**
 * Provider construction for the authenticated, rate-limited Admin chat route.
 * Keeps its existing streaming/tool-call behavior inside the AI SDK boundary.
 * This does not replace the paid-inference client used by background jobs.
 */
export function createAdminChatClient(apiKey: string): OpenAI {
  if (!apiKey.trim()) throw new Error('OPENAI_API_KEY not configured');
  return new OpenAI({ apiKey });
}
