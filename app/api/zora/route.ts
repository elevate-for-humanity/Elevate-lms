import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 60;

// PARIS AI System Prompt
const PARIS_SYSTEM_PROMPT = `You are PARIS - Zero Obstacles, Ready Advisors.

You are an AI career guidance assistant for Elevate for Humanity, a workforce development platform offering apprenticeship programs in:
- Barber (DOL Registered)
- Cosmetology (DOL Registered)
- Esthetics (DOL Registered)
- Nail Technician (DOL Registered)
- HVAC Technician
- CDL Truck Driving
- Medical Assistant
- Phlebotomy Technician
- Peer Recovery Specialist
- And more...

Your role is to:
1. Help users discover career paths that match their interests and goals
2. Explain program details, costs, funding options (WIOA, Workforce Ready Grant, scholarships)
3. Guide users through the application process
4. Answer questions about apprenticeships, licensing, and career outcomes
5. Schedule consultations when appropriate

Be conversational, encouraging, and informative. Ask clarifying questions to understand the user's goals. Provide specific, actionable next steps.

IMPORTANT: You are NOT a medical, legal, or financial advisor. For specific questions about funding eligibility, refer them to our admissions team.

Keep responses concise but helpful. Offer to help with next steps.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ZoraRequest {
  message: string;
  history?: Message[];
  sessionId?: string;
  userId?: string;
}

async function callAI(prompt: string, history: Message[]): Promise<string> {
  // Try Groq first (fastest)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: PARIS_SYSTEM_PROMPT },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: prompt },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || 'I\'m having trouble thinking right now. Can you try again?';
      }
    } catch (e) {
      logger.warn('[zora] Groq call failed', e);
    }
  }

  // Fallback to demo response
  return getDemoResponse(prompt);
}

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('barber') || lower.includes('haircut')) {
    return `Great choice! Barbering is an excellent career path.

Our DOL-registered Barber Apprenticeship program offers:
• 2,000 hours of training (paid apprenticeship)
• Typically 12-18 months to completion
• Potential $0 tuition with WIOA funding
• Learn precision cutting, straight razor, beard design

You'll work in a real barbershop from day one, getting hands-on experience while earning wages.

**Ready to apply?** I can walk you through the next steps or schedule a tour of our partner barbershops.

What draws you to barbering - is it the creative aspect, the entrepreneurial potential, or something else?`;
  }
  
  if (lower.includes('cosmetolog') || lower.includes('hair') || lower.includes('color')) {
    return `Cosmetology opens so many doors! Whether you want to work in a luxury salon, do bridal styling, or eventually own your own business.

Our program includes:
• Hair coloring (balayage, highlights, color correction)
• Cutting and styling
• Makeup application
• Business building skills
• 2,000 training hours

The best part? Our apprenticeship model means you get PAID while you learn, rather than paying tuition upfront.

Would you like to know more about funding options or hear from some of our successful graduates?`;
  }
  
  if (lower.includes('esthetic') || lower.includes('skin') || lower.includes('facial')) {
    return `Esthetics is a growing field with amazing opportunities!

In our program, you'll learn:
• Advanced facials and skin treatments
• Chemical peels and dermaplaning
• LED therapy and hydrafacials
• Waxing and hair removal
• Client consultation

Many of our esthetics graduates work in medical spas or dermatology offices - the field has great growth potential.

**Funding available:** Programs may be covered at $0 through WIOA or the Workforce Ready Grant if you qualify.

Interested? I can help you check your eligibility or schedule a consultation.`;
  }
  
  if (lower.includes('fund') || lower.includes('wioa') || lower.includes('grant') || lower.includes('scholarship')) {
    return `Yes! Funding is often available for our programs.

**Potential $0 out-of-pocket** through:
• WIOA (Workforce Innovation and Opportunity Act)
• Indiana Workforce Ready Grant
• Vocational Rehabilitation (VR)
• Employer sponsorship
• Payment plans

Eligibility depends on factors like:
• Employment status
• Income level
• SNAP/TANF participation
• Disability status

**My recommendation:** Complete our free eligibility check to see what you qualify for. It takes just 2 minutes.

Want me to guide you there?`;
  }
  
  if (lower.includes('cost') || lower.includes('price') || lower.includes('tuition')) {
    return `Great question! Program costs vary:

• Barber Apprenticeship: $4,980
• Cosmetology: $5,980
• Esthetics: $4,980
• Nail Technician: $2,980

**BUT** - most students pay $0 out-of-pocket through funding programs like WIOA or the Workforce Ready Grant.

Our team will help you explore every funding option before you pay anything.

The best way to know your cost is to complete a quick eligibility check. Want to do that now?`;
  }
  
  if (lower.includes('job') || lower.includes('career') || lower.includes('employ')) {
    return `Career outcomes are excellent in the beauty and trades industries!

Our graduates work as:
• Licensed barbers/stylists ($35K-$80K+ annually)
• Salon owners
• Platform artists for major brands
• Educators
• Medical spa estheticians

Many of our students start their own businesses within a few years of graduation.

The beauty and trades industries are always hiring - people will always need haircuts, skincare, and home services!

Would you like to hear about specific career paths or salary ranges for any of our programs?`;
  }
  
  if (lower.includes('apply') || lower.includes('start') || lower.includes('begin')) {
    return `Exciting! Starting your application is easy.

Here's what happens:
1. Fill out our online form (5-10 minutes)
2. Our admissions team reviews it (1-2 days)
3. We check funding eligibility for you
4. You get matched with a host shop/salon
5. Orientation, then training begins!

No experience required - we teach you everything.

**Ready to start?** I can redirect you to the application or answer any questions first.

What program interests you most?`;
  }
  
  if (lower.includes('how long') || lower.includes('duration') || lower.includes('months') || lower.includes('years')) {
    return `Program length varies by specialty:

• Barber: 12-18 months
• Cosmetology: 18-24 months
• Esthetics: 12-18 months
• Nail Technician: 6-12 months
• CDL: 4-8 weeks (intensive)

The apprenticeship model is often FASTER than traditional school because:
✓ You're learning while working
✓ Real client experience accelerates learning
✓ No need to find a job after graduation

Plus, you're earning wages the whole time!

Want to compare program lengths or hear about the schedule?`;
  }
  
  // Default response
  return `I'm here to help you find the right career path!

At Elevate for Humanity, we offer programs in:
• **Beauty**: Barber, Cosmetology, Esthetics, Nail Tech
• **Trades**: HVAC, Electrical, Plumbing, CDL
• **Healthcare**: Medical Assistant, Phlebotomy, CNA
• **Social Services**: Peer Recovery Specialist

All programs offer apprenticeship models where you get paid while you learn, and funding may be available.

What kind of work interests you most - working with people, hands-on technical work, creative work, or something else?

I'm here to help you explore your options!`;
}

async function _POST(req: NextRequest) {
  // Rate limiting
  const rateLimited = await applyRateLimit(req, 'chat');
  if (rateLimited) return rateLimited;

  try {
    const body: ZoraRequest = await req.json();
    const { message, history = [], sessionId, userId } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user context if authenticated
    let userContext = '';
    if (userId || sessionId) {
      const supabase = await createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userContext = `Current user: ${user.email}`;
        }
      } catch (e) {
        // Continue without user context
      }
    }

    // Build conversation history
    const conversationHistory: Message[] = [
      ...history.slice(-10), // Last 10 messages for context
    ];

    // Generate response
    const response = await callAI(
      userContext ? `${userContext}\n\nUser question: ${message}` : message,
      conversationHistory
    );

    // Store conversation in database if session exists
    if (sessionId) {
      try {
        const supabase = await createClient();
        await supabase.from('ai_conversations').insert({
          session_id: sessionId,
          user_id: userId || null,
          role: 'user',
          content: message,
          created_at: new Date().toISOString(),
        });
        await supabase.from('ai_conversations').insert({
          session_id: sessionId,
          user_id: userId || null,
          role: 'assistant',
          content: response,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        logger.warn('[zora] Failed to save conversation', e);
      }
    }

    return NextResponse.json({
      response,
      sessionId: sessionId || `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('[zora] Error', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/zora', _POST);

// GET endpoint for session management
async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ sessionId: `session_${Date.now()}` });
  }

  try {
    const supabase = await createClient();
    const { data: messages } = await supabase
      .from('ai_conversations')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(50);

    return NextResponse.json({
      sessionId,
      messages: messages || [],
    });
  } catch (error) {
    logger.error('[zora] Failed to fetch session', error);
    return NextResponse.json({ sessionId, messages: [] });
  }
}

export const GET = _GET;
