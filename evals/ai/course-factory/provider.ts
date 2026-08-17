import { aiChat } from '../../../lib/ai/ai-service';

export default class CourseFactoryAIProvider {
  id() {
    return 'elevate-course-factory-ai-runtime';
  }

  async callApi(prompt: string) {
    try {
      const result = await aiChat({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert instructional designer for workforce training. Follow the requested JSON contract exactly and return raw JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        maxTokens: 2500,
      });

      return {
        output: result.content,
        metadata: { provider: result.provider },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
