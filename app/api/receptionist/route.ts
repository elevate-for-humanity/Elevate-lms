export const runtime = 'edge';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai-client';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// System prompt for the AI receptionist
const RECEPTIONIST_PROMPT = `You are the AI receptionist for Elevate for Humanity, a workforce development organization in Indiana.

Your role is to:
- Answer questions quickly and professionally (keep responses under 100 words)
- Help visitors find information about programs, apply, or connect with the right person
- Be warm, helpful, and efficient like a real receptionist
- Route complex questions to human staff

Key Information:
- Programs: Medical Assistant, Barber Apprenticeship, HVAC, Building Maintenance, CDL, Workforce Readiness
- Funding: WRG, WIOA, JRI - most programs are free or low-cost
- Apply: /apply or /start
- Contact: /contact for all inquiries
- Partners: We work with barbershops, clinics, employers, workforce boards

Response Style:
- Be conversational and friendly
- Keep answers brief (2-3 sentences max)
- Offer to connect them with a person for complex questions
- Suggest next steps (apply, call, schedule)

If asked about:
- Programs → Briefly describe and link to /programs
- Applying → Direct to /start or /apply
- Funding → Mention WRG/WIOA, say most programs are free
- Speaking to someone → Offer to schedule a call or provide contact info
- Hours/Location → Say we're online 24/7, training sites across Indiana
- Specific questions → Answer briefly, offer to connect with specialist`;

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    // If OpenAI is not configured, use fallback responses
    if (!openai) {
      const response = getFallbackResponse(message);
      return NextResponse.json({ response });
    }

    // Build conversation history for context
    const messages = [
      { role: 'system' as const, content: RECEPTIONIST_PROMPT },
      ...(history || []).slice(-6).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Call OpenAI with streaming disabled for faster response
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Fast and cost-effective
      messages,
      max_tokens: 150, // Keep responses concise
      temperature: 0.7,
      stream: false,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I apologize, I'm having trouble responding right now. Please visit /contact or /faq for help.";

    return NextResponse.json({ response });
  } catch (error) { 
    logger.error('Receptionist API error:', error);

    // Return helpful fallback
    return NextResponse.json({
      response:
        "I'm having a brief technical issue. For immediate assistance, please visit /contact or email info@elevateforhumanity.org. I apologize for the inconvenience!",
    });
  }
}

// Fallback responses when OpenAI is not available
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Program inquiries
  if (
    lowerMessage.includes('program') ||
    lowerMessage.includes('training') ||
    lowerMessage.includes('course')
  ) {
    return 'We offer programs in Medical Assistant, Barber Apprenticeship, HVAC, Building Maintenance, CDL, and Workforce Readiness. Most are free or low-cost through WRG and WIOA funding. Visit /programs to learn more, or I can connect you with an advisor!';
  }

  // Application inquiries
  if (
    lowerMessage.includes('apply') ||
    lowerMessage.includes('enroll') ||
    lowerMessage.includes('sign up') ||
    lowerMessage.includes('join')
  ) {
    return 'Great! You can start your application at /start to choose your path, or go directly to /apply. The process takes about 10 minutes. Need help? I can schedule a call with an enrollment specialist!';
  }

  // Funding inquiries
  if (
    lowerMessage.includes('cost') ||
    lowerMessage.includes('price') ||
    lowerMessage.includes('pay') ||
    lowerMessage.includes('funding') ||
    lowerMessage.includes('free')
  ) {
    return 'Most of our programs are free or low-cost through workforce funding like WRG and WIOA. Eligibility depends on your situation. I can connect you with a funding specialist to check your eligibility - would you like me to schedule a call?';
  }

  // Contact/speak to someone
  if (
    lowerMessage.includes('speak') ||
    lowerMessage.includes('talk') ||
    lowerMessage.includes('call') ||
    lowerMessage.includes('person') ||
    lowerMessage.includes('human')
  ) {
    return "I'd be happy to connect you with our team! You can email info@elevateforhumanity.org or fill out our contact form at /contact. Would you like me to help you with something specific?";
  }

  // Hours/location
  if (
    lowerMessage.includes('hour') ||
    lowerMessage.includes('open') ||
    lowerMessage.includes('location') ||
    lowerMessage.includes('where')
  ) {
    return "We're available online 24/7! Our training sites are located across Indiana. Programs meet at different times - some daytime, some evening. Which program are you interested in? I can give you specific details!";
  }

  // Employer/partner inquiries
  if (
    lowerMessage.includes('employer') ||
    lowerMessage.includes('partner') ||
    lowerMessage.includes('hire') ||
    lowerMessage.includes('business')
  ) {
    return 'We work with employers and training sites across Indiana! You can learn about partnership opportunities at /partners or /employers. I can also connect you with our partnership team - would you like me to schedule a call?';
  }

  // Default response
  return 'Thanks for reaching out! I can help you with information about our programs, applying, funding, or connecting you with our team. What would you like to know? Or, I can transfer you to a specialist - just let me know!';
}
