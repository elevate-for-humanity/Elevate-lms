import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Save chat history
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const repoId = req.nextUrl.searchParams.get('repo_id');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = supabaseServer();
  
  let query = supabase
    .from('studio_chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);
    
  if (repoId) {
    query = query.eq('repo_id', repoId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// Streaming chat
export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const userId = req.headers.get('x-user-id');
  
  try {
    const { messages, fileContext, repo_id, session_id, stream = true } = await req.json();

    const systemPrompt = `You are an expert coding assistant in Dev Studio, a browser-based IDE.

You help users:
- Write, edit, and refactor code
- Debug issues and fix errors
- Explain code and concepts
- Suggest improvements and best practices
- Generate tests and documentation

When providing code changes, wrap them in a code block with the filename:
\`\`\`filename.tsx
// complete file content
\`\`\`

Current file context:
${fileContext || 'No file currently open'}

Be concise, direct, and provide working code. Focus on the task at hand.`;

    if (stream) {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      });

      const encoder = new TextEncoder();
      let fullContent = '';

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || '';
              fullContent += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
            
            // Save to history if user is authenticated
            if (userId && repo_id) {
              const supabase = supabaseServer();
              const updatedMessages = [...messages, { role: 'assistant', content: fullContent }];
              
              if (session_id) {
                await supabase
                  .from('studio_chat_history')
                  .update({ 
                    messages: updatedMessages,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', session_id);
              } else {
                await supabase
                  .from('studio_chat_history')
                  .insert({
                    user_id: userId,
                    repo_id,
                    messages: updatedMessages,
                    file_context: fileContext?.split('\n')[0] || null
                  });
              }
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });

      const content = response.choices[0].message.content;

      // Save to history
      if (userId && repo_id) {
        const supabase = supabaseServer();
        const updatedMessages = [...messages, { role: 'assistant', content }];
        
        if (session_id) {
          await supabase
            .from('studio_chat_history')
            .update({ 
              messages: updatedMessages,
              updated_at: new Date().toISOString()
            })
            .eq('id', session_id);
        } else {
          await supabase
            .from('studio_chat_history')
            .insert({
              user_id: userId,
              repo_id,
              messages: updatedMessages,
              file_context: fileContext?.split('\n')[0] || null
            });
        }
      }

      return NextResponse.json({
        message: content,
        usage: response.usage,
      });
    }
  } catch (error) {
    logger.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
