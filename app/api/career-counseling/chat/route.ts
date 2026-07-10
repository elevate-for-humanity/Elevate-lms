import { logger } from '@/lib/logger';
/**
 * AI Career Counseling Chat API
 */
import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/ai/ai-service';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an AI Career Counselor for ${PLATFORM_DEFAULTS.orgName}, a workforce development organization in Indianapolis.

Your role is to help users:
1. Explore career paths based on their skills and interests
2. Identify skill gaps and recommend training
3. Provide salary expectations and job market insights
4. Create personalized learning paths
5. Connect them with relevant Elevate programs

Available Elevate Programs:
- Healthcare: CNA ($35-45K), Medical Assistant ($38-48K), Phlebotomy ($35-42K)
- Skilled Trades: HVAC ($45-65K), Electrical ($50-70K), Welding ($40-55K), Plumbing ($45-65K)
- Technology: IT Support ($40-55K), Cybersecurity ($55-85K)
- Transportation: CDL Class A ($50-80K), CDL Class B ($45-60K)
- Beauty: Barber ($30-60K), Cosmetology ($28-50K)

All programs are FREE through WIOA funding for eligible participants.

When giving career advice:
- Be encouraging and supportive
- Provide specific, actionable recommendations
- Include salary ranges and growth projections
- Suggest relevant Elevate programs when appropriate
- Ask follow-up questions to better understand their goals

Keep responses conversational but informative (3-5 sentences).`;

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { message, conversationId, userProfile } = await req.json();

    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const { data: { user } } = await supabase.auth.getUser();

    let convId = conversationId;
    if (!convId) {
      const { data: newConv } = await supabase
        .from('career_counseling_conversations')
        .insert({ user_id: user?.id || null, user_profile: userProfile || {}, started_at: new Date().toISOString() })
        .select('id')
        .maybeSingle();
      convId = newConv?.id;
    }

    const { data: history } = await supabase
      .from('career_counseling_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    let contextPrompt = SYSTEM_PROMPT;
    if (userProfile) {
      contextPrompt += `\n\nUser Profile:\n- Current Skills: ${userProfile.skills?.join(', ') || 'Not specified'}\n- Experience Level: ${userProfile.level || 'Not specified'}\n- Career Goal: ${userProfile.goal || 'Not specified'}\n- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}`;
    }

    const messages = [
      { role: 'system' as const, content: contextPrompt },
      ...(history || []).map((msg: any) => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
      { role: 'user' as const, content: message },
    ];

    const completion = await aiChat({ model: 'gpt-4.1-mini', messages, temperature: 0.7, maxTokens: 500 });

    const assistantMessage = completion.content ||
      "I'd love to help you explore career options. Could you tell me more about your interests and current skills?";

    const suggestions = generateSuggestions(assistantMessage, userProfile);

    if (convId) {
      await supabase.from('career_counseling_messages').insert([
        { conversation_id: convId, role: 'user', content: message },
        { conversation_id: convId, role: 'assistant', content: assistantMessage },
      ]);
    }

    return NextResponse.json({ success: true, message: assistantMessage, suggestions, conversationId: convId });
  } catch (error) {
    logger.error('Career counseling error:', error);
    return NextResponse.json({
      success: true,
      message: "I'm here to help with your career planning. What skills or interests would you like to explore?",
      suggestions: ['Explore healthcare careers', 'Learn about skilled trades', 'Technology career paths'],
      conversationId: null,
    });
  }
}

function generateSuggestions(response: string, profile: any): string[] {
  const suggestions: string[] = [];
  const r = response.toLowerCase();
  if (r.includes('healthcare') || r.includes('medical')) { suggestions.push('Tell me about CNA training', 'Medical Assistant requirements'); }
  if (r.includes('technology') || r.includes('it ')) { suggestions.push('IT Support certification', 'Cybersecurity career path'); }
  if (r.includes('trade') || r.includes('hvac') || r.includes('electrical')) { suggestions.push('HVAC technician training', 'Electrical apprenticeship'); }
  if (r.includes('salary') || r.includes('pay')) { suggestions.push('Compare salaries by field', 'Highest paying entry-level jobs'); }
  if (suggestions.length === 0) suggestions.push('What careers match my skills?', 'Show me training programs', 'Help me create a career plan');
  return suggestions.slice(0, 4);
}

export async function GET() {
  return NextResponse.json({ name: 'AI Career Counseling API', version: '1.0.0', description: 'Personalized career guidance powered by AI' });
}
