import { getOpenAIClient } from '@/lib/ai/openai-client';
import { slugify } from '@/lib/validate';
import { logger } from '@/lib/logger';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return getOpenAIClient();
}

/**
 * Safely parse JSON with error logging and recovery.
 */
function safeParseJSON(raw: string, context: string): Record<string, unknown> {
  try {
    // Try to extract JSON from markdown code blocks
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (error) {
    logger.error(`[ai-course-builder] JSON parse error in ${context}`, {
      raw: raw.slice(0, 200) + (raw.length > 200 ? '...' : ''),
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`), { cause: error };
  }
}

export async function buildCourse({ title, objectives }: { title: string; objectives: string[] }) {
  const client = getOpenAIClient();

  const prompt = `
Create a full course with modules and lessons.

Title: ${title}
Objectives: ${objectives.join(', ')}

Format output as JSON:
{
  "title": "",
  "slug": "",
  "modules": [
    {
      "title": "",
      "slug": "",
      "lessons": [
        { "title": "", "slug": "", "content": "" }
      ]
    }
  ]
}
`;

  const res = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = res.choices[0].message.content;
  if (!raw) {
    throw new Error('No response from OpenAI');
  }

  const json = safeParseJSON(raw, 'buildCourse');

  json.slug = slugify(json.title as string);
  (json.modules as Array<Record<string, unknown>>).forEach((m) => (m.slug = slugify(m.title as string)));

  return json;
}
