import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, fileContext } = await req.json();

    const systemPrompt = `You are an expert coding assistant integrated into Dev Studio, a browser-based IDE.

You help users:
- Write and edit code
- Debug issues
- Explain code
- Suggest improvements
- Answer programming questions

When the user asks you to edit a file, respond with the complete updated code wrapped in a code block with the filename, like:
\`\`\`filename.tsx
// complete file content here
\`\`\`

Current file context:
${fileContext || 'No file currently open'}

Be concise and direct. Provide working code.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const assistantMessage = response.choices[0].message.content;

    // Log interaction to database
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const userMessage = messages[messages.length - 1]?.content || '';
      await supabase.from('devstudio_chat_log').insert({
        user_id: user?.id || null,
        user_message: userMessage,
        assistant_response: assistantMessage,
        file_context: fileContext || null,
        tokens_used: response.usage?.total_tokens || 0,
      }).catch(() => {});
    } catch {
      // DB logging is non-critical
    }

    return NextResponse.json({
      message: assistantMessage,
      usage: response.usage,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
