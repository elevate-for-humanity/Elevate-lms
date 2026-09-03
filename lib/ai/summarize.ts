import { logger } from '@/lib/logger';
import { aiChat } from './ai-service';

const SYSTEM_PROMPT = 'Summarize content at 8th-grade reading level. Be concise and clear.';

export async function summarizeText(text: string, maxLength = 200): Promise<string> {
  try {
    const result = await aiChat({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.5,
      maxTokens: 150,
    });
    return result.content ?? text.slice(0, maxLength) + '...';
  } catch (error) {
    logger.error('Summarization error', error as Error, { textLength: text.length, maxLength });
    return text.slice(0, maxLength) + '...';
  }
}

export async function summarizeLessonContent(lessonContent: string): Promise<string> {
  return summarizeText(lessonContent, 300);
}

export async function summarizeModuleContent(moduleContent: string): Promise<string> {
  return summarizeText(moduleContent, 500);
}
