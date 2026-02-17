import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, conversationId, mode } = await request.json();

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  
  // If no API key, provide helpful fallback responses
  if (!openaiKey) {
    const fallbackResponses: Record<string, string[]> = {
      chat: [
        "I'm here to help you with your studies! While my AI capabilities are being configured, here are some tips:\n\n1. **Break down complex topics** into smaller, manageable parts\n2. **Use active recall** - test yourself instead of just re-reading\n3. **Teach what you learn** to someone else\n4. **Take regular breaks** using the Pomodoro technique\n\nFor specific questions about your coursework, please reach out to your instructor or check the course materials.",
        "Great question! While I'm being set up, here's what I recommend:\n\n**Study Strategies:**\n- Create flashcards for key terms\n- Practice with sample questions\n- Join study groups in the community forum\n- Review your notes within 24 hours of class\n\nYour instructor and classmates are also great resources!",
        "I'd love to help you learn! While my full capabilities are being activated, here are some resources:\n\n📚 **Course Materials** - Review your lesson content\n👥 **Community Forums** - Ask questions and discuss with peers\n📧 **Instructor Support** - Reach out for specific help\n📖 **Study Guides** - Check the resources section\n\nKeep up the great work with your studies!"
      ],
      essay: [
        "I'm your essay writing assistant! While my AI is being configured, here's a solid essay structure:\n\n**Introduction:**\n- Hook to grab attention\n- Background context\n- Clear thesis statement\n\n**Body Paragraphs:**\n- Topic sentence\n- Evidence/examples\n- Analysis\n- Transition\n\n**Conclusion:**\n- Restate thesis\n- Summarize key points\n- Final thought/call to action\n\nRemember: Strong essays have clear arguments supported by evidence!",
        "Essay writing tips while I'm being set up:\n\n✍️ **Planning:** Outline before you write\n📝 **Drafting:** Get ideas down, don't edit yet\n🔍 **Revising:** Focus on structure and arguments\n✏️ **Editing:** Fix grammar and polish\n\n**Common mistakes to avoid:**\n- Vague thesis statements\n- Lack of evidence\n- Poor transitions\n- Weak conclusions"
      ],
      'study-guide': [
        "Let me help you create a study guide! Here's a template:\n\n**Topic: [Your Subject]**\n\n**Key Concepts:**\n1. [Main idea 1]\n2. [Main idea 2]\n3. [Main idea 3]\n\n**Important Terms:**\n- Term 1: Definition\n- Term 2: Definition\n\n**Practice Questions:**\n1. Question about concept 1\n2. Question about concept 2\n\n**Summary:**\nBrief overview of the main points.\n\nFill this in with your course content for an effective study guide!",
        "Study guide creation tips:\n\n📋 **Organize by topic** - Group related concepts\n🎯 **Focus on objectives** - What should you know?\n❓ **Include practice questions** - Test yourself\n📊 **Use visual aids** - Diagrams, charts, timelines\n🔗 **Connect concepts** - Show relationships\n\nReview your course materials and create summaries for each major topic!"
      ]
    };
    
    const responses = fallbackResponses[mode as string] || fallbackResponses.chat;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return NextResponse.json({
      message: randomResponse,
      conversationId: null,
      fallback: true
    });
  }

  try {
    // Get conversation history if exists
    let messages = [];
    if (conversationId) {
      const { data: history } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (history) {
        messages = history.messages || [];
      }
    }

    // Add system prompt based on mode
    const systemPrompts = {
      chat: 'You are a helpful AI tutor. Provide clear, educational responses to help students learn.',
      essay:
        'You are an essay writing assistant. Help students improve their writing with constructive feedback and suggestions.',
      'study-guide':
        'You are a study guide creator. Help students create comprehensive study materials and summaries.',
    };

    const systemMessage = {
      role: 'system',
      content:
        systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.chat,
    };

    // Add user message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: 'OpenAI API error' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    // Add AI response to messages
    messages.push(aiMessage);

    // Save or update conversation
    let newConversationId = conversationId;
    if (!conversationId) {
      const { data: newConv } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          mode,
          messages,
          title: message.substring(0, 50),
        })
        .select()
        .single();

      newConversationId = newConv?.id;
    } else {
      await supabase
        .from('ai_conversations')
        .update({ messages })
        .eq('id', conversationId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      message: aiMessage.content,
      conversationId: newConversationId,
    });
  } catch (error) { 
    logger.error(
      'AI Tutor error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to process request' },
      { status: 500 }
    );
  }
}
