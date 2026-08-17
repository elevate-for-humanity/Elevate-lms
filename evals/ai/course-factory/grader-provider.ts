import { aiChat } from '../../../lib/ai/ai-service';
import type { AIProviderName } from '../../../lib/ai/types';

const PROVIDERS: AIProviderName[] = ['openai', 'groq', 'gemini', 'anthropic'];

function configured(provider: AIProviderName): boolean {
  switch (provider) {
    case 'openai':
      return Boolean(process.env.OPENAI_API_KEY?.trim());
    case 'groq':
      return Boolean(process.env.GROQ_API_KEY?.trim());
    case 'gemini':
      return Boolean(process.env.GEMINI_API_KEY?.trim());
    case 'anthropic':
      return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    default:
      return false;
  }
}

export default class CourseFactoryGraderProvider {
  id() {
    return 'elevate-course-factory-grader-runtime';
  }

  async callApi(prompt: string) {
    const failures: string[] = [];

    for (const provider of PROVIDERS) {
      if (!configured(provider)) continue;

      try {
        const result = await aiChat({
          provider,
          ...(provider === 'openai' ? { model: 'gpt-4.1' } : {}),
          messages: [
            {
              role: 'system',
              content:
                'You are a strict evaluation judge. Follow the grading instructions exactly, evaluate only the supplied response, and return the grading format requested by the caller.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0,
          maxTokens: 1200,
        });

        if (!result.content?.trim()) throw new Error(`${provider} returned an empty grading response`);

        return {
          output: result.content,
          metadata: {
            provider: result.provider,
            attemptedProviders: failures.length + 1,
            fallbackFailures: failures,
          },
        };
      } catch (error) {
        failures.push(`${provider}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      error:
        failures.length > 0
          ? `All configured grading providers failed. ${failures.join(' | ')}`
          : 'No AI provider credentials are configured for semantic grading.',
    };
  }
}
