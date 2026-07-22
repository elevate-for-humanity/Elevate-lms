/**
 * /api/ai-chat - PARIS AI Chat API for Marketing Site
 * 
 * Handles chat messages from the LiveChatWidget and returns AI responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// PARIS AI System Prompt
const PARIS_SYSTEM_PROMPT = `You are PARIS, the AI assistant for ${PLATFORM_DEFAULTS.orgName}.

**About Us:**
- Workforce development nonprofit in Indianapolis, Indiana  
- DOL Registered Apprenticeship Sponsor
- Training is FREE for eligible participants through WIOA, Workforce Ready Grant, and Job Ready Indy

**Our Programs:**
- Healthcare: CNA, Phlebotomy, Medical Assistant
- Skilled Trades: HVAC, CDL Truck Driving, Electrical, Plumbing
- Professional: Barbering, Cosmetology, Esthetics, Nail Tech
- Technology: IT Fundamentals, Cybersecurity

**Funding Options:**
- WIOA: 100% free for low-income adults
- Workforce Ready Grant: Indiana residents
- Job Ready Indy: Justice-involved individuals
- Payment plans available

**Contact:**
- Phone: ${PLATFORM_DEFAULTS.supportPhone}
- Email: info@${PLATFORM_DEFAULTS.canonicalDomain}
- Website: ${PLATFORM_DEFAULTS.canonicalDomain}

**Response Guidelines:**
- Be warm, encouraging, and helpful
- Answer the specific question directly
- Use bullet points for lists
- Always provide a clear next step
- Keep responses under 150 words
- End with an action or helpful resource`;

function getSmartFallback(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  
  if (lower.includes('apply') || lower.includes('application')) {
    return `To apply for our programs:\n\n1. Visit elevateforhumanity.org/apply\n2. Fill out our quick eligibility check (3-5 minutes)\n3. Our team will contact you within 24 hours\n\nThe application is free and takes just a few minutes. We accept WIOA, Workforce Ready Grant, and offer payment plans.\n\nReady to apply? Click here: https://www.elevateforhumanity.org/apply`;
  }
  
  if (lower.includes('free') || lower.includes('cost') || lower.includes('price') || lower.includes('funding')) {
    return `Great news! Many of our programs are completely FREE for eligible participants:\n\n• WIOA funding - 100% tuition coverage for low-income adults\n• Workforce Ready Grant - Indiana residents\n• Job Ready Indy - Justice-involved individuals\n\nMost students pay $0 out of pocket!\n\nCheck your eligibility in just 2 minutes: https://www.elevateforhumanity.org/apply`;
  }
  
  if (lower.includes('program') || lower.includes('course') || lower.includes('training')) {
    return `We offer programs in:\n\n**Healthcare:** CNA, Phlebotomy, Medical Assistant\n**Trades:** HVAC, CDL, Electrical, Plumbing\n**Beauty:** Barber, Cosmetology, Esthetics, Nails\n**Tech:** IT Fundamentals, Cybersecurity\n\nAll programs include:\n• Hands-on training\n• Job placement assistance\n• Industry certifications\n• Career coaching\n\nView all programs: https://www.elevateforhumanity.org/programs`;
  }
  
  if (lower.includes('barber') || lower.includes('apprentice')) {
    return `Our Barber Apprenticeship is a DOL-registered program where you:\n\n• Earn while you learn (paid on-the-job training)\n• Get 2,000+ hours of hands-on experience\n• Pay $0 tuition (sponsor covers costs)\n• Earn your Barber License in 12-18 months\n• Work in real barbershops from day one\n\nApply now: https://www.elevateforhumanity.org/programs/barber-apprenticeship/apply`;
  }
  
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hi there! 👋 I'm PARIS, your AI assistant at Elevate for Humanity.\n\nI can help you:\n• Learn about our free training programs\n• Check your funding eligibility\n• Navigate the application process\n• Find the right career path\n\nWhat would you like to know?`;
  }
  
  if (lower.includes('phone') || lower.includes('call') || lower.includes('contact')) {
    return `You can reach us at:\n\n📞 ${PLATFORM_DEFAULTS.supportPhone}\n📧 info@${PLATFORM_DEFAULTS.canonicalDomain}\n🌐 ${PLATFORM_DEFAULTS.canonicalDomain}\n\nOur office is in Indianapolis, Indiana. We're here Monday-Friday 8am-6pm!`;
  }
  
  return `Thanks for your question! I can help you learn about:\n\n• Our training programs\n• Funding options (many are FREE!)\n• The application process\n• Apprenticeship opportunities\n\nWhat would you like to explore? You can also visit https://www.elevateforhumanity.org/programs to see all our offerings, or call us at ${PLATFORM_DEFAULTS.supportPhone}.`;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: Message[] = body.messages || [];
    
    const userMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
    
    if (!userMessage) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // Try Anthropic API first
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    if (anthropicKey) {
      try {
        const response = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: PARIS_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({ 
            reply: data.content?.[0]?.text || 'Thanks for chatting with us!' 
          });
        }
      } catch (apiError) {
        console.error('Anthropic API error:', apiError);
      }
    }

    // Fallback to smart keyword-based responses
    const reply = getSmartFallback(userMessage);
    return NextResponse.json({ reply });

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ 
      reply: `I'm having trouble right now. Please call us at ${PLATFORM_DEFAULTS.supportPhone} or visit elevateforhumanity.org/apply to get started!` 
    });
  }
}
