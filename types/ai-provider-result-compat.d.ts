import '@/lib/ai/types';
import type { AIProviderName } from '@/lib/ai/types';

declare module '@/lib/ai/types' {
  interface ChatCompletionResult {
    /** Provider provenance returned by provider adapters such as Azure. */
    provider?: AIProviderName;
  }
}
