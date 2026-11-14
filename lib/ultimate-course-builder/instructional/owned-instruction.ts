import { ElevateProvider } from '@/lib/ai/providers/elevate';
import type { ChatCompletionOptions } from '@/lib/ai/types';
/** Direct owned-provider import keeps the standalone worker free of unused paid SDKs. */
export async function ownedInstruction(options: ChatCompletionOptions) {
  const provider = new ElevateProvider();
  if (!provider.isAvailable())
    throw new Error('ULTIMATE_OWNED_INSTRUCTION_PROVIDER_NOT_CONFIGURED');
  return provider.chat({ ...options, providerPolicy: 'owned-only' });
}
