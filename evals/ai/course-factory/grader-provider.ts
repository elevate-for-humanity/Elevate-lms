import { aiChat } from '../../../lib/ai/ai-service';
import type { AIProviderName } from '../../../lib/ai/types';

const PROVIDERS: AIProviderName[] = ['openai', 'groq', 'gemini', 'anthropic'];
const GRADER_SYSTEM =
  'You are a strict evaluation judge. Follow the grading instructions exactly, evaluate only the supplied response, and return the grading format requested by the caller.';

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

async function callGitHubModels(prompt: string) {
  const token = process.env.GITHUB_TOKEN?.trim();
  const owner = process.env.GITHUB_REPOSITORY_OWNER?.trim();
  if (!token || !owner) throw new Error('GitHub Models token or repository owner is unavailable');

  const response = await fetch(
    `https://models.github.ai/orgs/${encodeURIComponent(owner)}/inference/chat/completions`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1',
        messages: [
          { role: 'system', content: GRADER_SYSTEM },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(`GitHub Models ${response.status}: ${payload.message || 'request failed'}`);
  }
  const output = payload.choices?.[0]?.message?.content?.trim();
  if (!output) throw new Error('GitHub Models returned an empty grading response');
  return output;
}

export default class CourseFactoryGraderProvider {
  id() {
    return 'elevate-course-factory-grader-runtime';
  }

  async callApi(prompt: string) {
    const failures: string[] = [];

    if (process.env.GITHUB_TOKEN?.trim()) {
      try {
        const output = await callGitHubModels(prompt);
        return {
          output,
          metadata: { provider: 'github-models', attemptedProviders: 1, fallbackFailures: failures },
        };
      } catch (error) {
        failures.push(`github-models: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    for (const provider of PROVIDERS) {
      if (!configured(provider)) continue;

      try {
        const result = await aiChat({
          provider,
          ...(provider === 'openai' ? { model: 'gpt-4.1' } : {}),
          messages: [
            { role: 'system', content: GRADER_SYSTEM },
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
