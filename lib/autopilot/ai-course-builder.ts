import { getOpenAIClient } from '@/lib/ai/openai-client';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return getOpenAIClient();
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

  const json = JSON.parse(raw);

  json.slug = slugify(json.title);
  json.modules.forEach((m: any) => (m.slug = slugify(m.title)));

  return json;
}
