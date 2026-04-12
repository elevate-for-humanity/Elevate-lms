import OpenAI from 'openai';
import { LessonRenderPlanDraftSchema } from './schema';
import { SCENE_GENERATION_SYSTEM_PROMPT, buildSceneGenerationUserPrompt } from './prompts';
import type { LessonRenderPlanDraft } from './types';

const MAX_ATTEMPTS = 3;

function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

export async function generateLessonScenes(opts: {
  lessonId: string;
  title: string;
  content: string;
  seed?: string;
}): Promise<LessonRenderPlanDraft> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const plainContent = stripHtml(opts.content);
  const seed = opts.seed ?? `${opts.lessonId}-${Date.now()}`;

  const userPrompt = buildSceneGenerationUserPrompt({
    lessonId: opts.lessonId,
    title: opts.title,
    content: plainContent,
    seed,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SCENE_GENERATION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const raw = res.choices[0].message.content ?? '';
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      const result = LessonRenderPlanDraftSchema.safeParse(parsed);
      if (result.success) return result.data;
      lastError = new Error(`Schema validation failed: ${JSON.stringify(result.error.issues.slice(0, 3))}`);
      console.warn(`  ⚠ Attempt ${attempt + 1} schema error: ${lastError.message}`);
    } catch (e) {
      lastError = new Error(`JSON parse failed: ${e}`);
      console.warn(`  ⚠ Attempt ${attempt + 1} parse error`);
    }
  }

  throw lastError ?? new Error('generateLessonScenes: all attempts failed');
}
