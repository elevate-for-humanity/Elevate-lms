import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai-client';
import { createClient } from '@/lib/supabase/server';
import { 
  MASTER_AVATAR_PROMPT, 
  getPageScript,
  getStatusScript 
} from '@/lib/avatar-scripts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequest {
  message: string;
  route?: string;           // Current page route (e.g., "/programs/cna")
  userRole?: string;        // learner, employer, partner, staff
  enrollmentStatus?: string; // submitted, under_review, approved, denied, enrolled, etc.
  fundingType?: string;     // wioa, wrg, jri, self_pay, employer_sponsored
  hasMissingDocs?: boolean;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  // Legacy support
  context?: string;
}

/**
 * Build the system prompt based on page context
 * ONE GLOBAL AVATAR with deterministic routing
 */
function buildSystemPrompt(req: ChatRequest): string {
  let prompt = MASTER_AVATAR_PROMPT + '\n\n';

  // Add page-specific script if route provided
  if (req.route) {
    const pageScript = getPageScript(req.route);
    if (pageScript) {
      prompt += `Current page: ${req.route}\n`;
      prompt += `Opening script: ${pageScript.opening}\n`;
      prompt += `Default next action: ${pageScript.nextAction}\n\n`;
    }
  }

  // Add status-specific guidance
  if (req.enrollmentStatus) {
    const statusScript = getStatusScript(req.enrollmentStatus);
    if (statusScript) {
      prompt += `User status: ${req.enrollmentStatus}\n`;
      prompt += `Status guidance: ${statusScript}\n\n`;
    }
  }

  // Add missing docs warning
  if (req.hasMissingDocs) {
    prompt += `IMPORTANT: User has missing or incomplete documents. Prioritize document completion.\n`;
    prompt += getStatusScript('doc_pending') + '\n\n';
  }

  // Add funding context
  if (req.fundingType) {
    const fundingLabels: Record<string, string> = {
      wioa: 'WIOA (federal workforce funding)',
      wrg: 'Workforce Ready Grant (Indiana state)',
      jri: 'Justice Reinvestment Initiative',
      self_pay: 'Self-pay',
      employer_sponsored: 'Employer-sponsored',
    };
    prompt += `Funding path: ${fundingLabels[req.fundingType] || req.fundingType}\n\n`;
  }

  // Add role context
  if (req.userRole) {
    prompt += `User role: ${req.userRole}\n\n`;
  }

  prompt += `Remember: Max 3 sentences. End with ONE next action.`;

  return prompt;
}

// Fallback responses when OpenAI is not configured
const FALLBACK_RESPONSES: Record<string, string> = {
  programs: "We offer career training in Healthcare (CNA, Medical Assistant), Skilled Trades (HVAC, Electrical, Welding), Technology, CDL Transportation, Barber/Cosmetology, and Tax Preparation. Some programs may qualify for WIOA funding assistance! Call (317) 314-3757 to learn more.",
  funding: "Most of our programs are FREE through WIOA (Workforce Innovation and Opportunity Act) funding. We also offer Workforce Ready Grants and other financial assistance. Call (317) 314-3757 to check your eligibility!",
  apply: "Ready to apply? Visit elevateforhumanity.org/apply or call (317) 314-3757. You'll need a valid ID and proof of income. The process takes about 15 minutes!",
  default: "I'm here to help! We offer FREE career training in healthcare, skilled trades, technology, and more. Call (317) 314-3757 or visit /apply to get started. What would you like to know?",
};

function getFallbackResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('program') || lowerMsg.includes('course') || lowerMsg.includes('training') || lowerMsg.includes('offer')) {
    return FALLBACK_RESPONSES.programs;
  }
  if (lowerMsg.includes('free') || lowerMsg.includes('cost') || lowerMsg.includes('pay') || lowerMsg.includes('fund') || lowerMsg.includes('wioa')) {
    return FALLBACK_RESPONSES.funding;
  }
  if (lowerMsg.includes('apply') || lowerMsg.includes('start') || lowerMsg.includes('enroll') || lowerMsg.includes('sign up')) {
    return FALLBACK_RESPONSES.apply;
  }
  return FALLBACK_RESPONSES.default;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // If OpenAI is not configured, use fallback responses
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ 
        message: getFallbackResponse(message) 
      });
    }

    // Build deterministic system prompt based on context
    const systemPrompt = buildSystemPrompt(body);
    const openai = getOpenAIClient();

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-6).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 150,
      temperature: 0.3,
    });

    const reply = completion.choices[0]?.message?.content || 
      "I can help with that. What specific information do you need?";

    // Log interaction to database
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('avatar_chat_interactions').insert({
        user_id: user?.id || null,
        route: body.route || null,
        user_message: message,
        assistant_response: reply,
        context: body.context || null,
      }).catch(() => {});
    } catch {
      // DB logging is non-critical
    }

    return NextResponse.json({ message: reply });
  } catch (error) {
    logger.error('Avatar chat error:', error);
    // Fall back to static responses on any error (including quota exceeded)
    try {
      const body: ChatRequest = await request.clone().json();
      return NextResponse.json({ 
        message: getFallbackResponse(body.message || '') 
      });
    } catch {
      return NextResponse.json({ 
        message: FALLBACK_RESPONSES.default 
      });
    }
  }
}

/**
 * GET endpoint to retrieve opening script for a page
 * Used for initial avatar message on page load
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const route = searchParams.get('route');

  if (!route) {
    return NextResponse.json(
      { error: 'Route parameter required' },
      { status: 400 }
    );
  }

  const pageScript = getPageScript(route);

  if (!pageScript) {
    // Default opening for unknown pages
    return NextResponse.json({
      opening: "Welcome. I can help you navigate training, funding, enrollment, or credentials. What do you need?",
      nextAction: "Tell me what you're looking for.",
    });
  }

  return NextResponse.json(pageScript);
}
