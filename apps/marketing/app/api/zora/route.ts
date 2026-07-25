/**
 * ZORA — Zero Obstacles, Ready Advisors (simplified)
 * Marketing site career guidance endpoint.
 * Returns structured career guidance responses without requiring AI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/zora — Career guidance response
async function _POST(req: NextRequest) {
  try {
    const { message, history = [], sessionId } = await req.json().catch(() => ({}));

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    logger.info('[zora] Career guidance message', {
      messageLength: message.length,
      sessionId,
      historyLength: Array.isArray(history) ? history.length : 0,
    });

    // Structured career pathway responses
    const lowerMessage = message.toLowerCase();

    let response = '';

    if (lowerMessage.includes('healthcare') || lowerMessage.includes('medical') || lowerMessage.includes('nurse') || lowerMessage.includes('cna') || lowerMessage.includes('phlebotom')) {
      response = `**Healthcare Career Pathways**

Great choice! Healthcare is one of the fastest-growing fields with strong job security.

Here are some programs that might be perfect for you:

🩺 **Patient Care Technician** — 8-12 weeks | $35,000-$45,000/yr entry
💉 **Phlebotomy** — 4-8 weeks | $35,000-$42,000/yr entry
💊 **Pharmacy Technician** — 12-16 weeks | $38,000-$48,000/yr entry
📋 **Medical Billing & Coding** — 12-20 weeks | $40,000-$52,000/yr entry
🩻 **EKG Technician** — 4-8 weeks | $42,000-$55,000/yr entry

💡 **No prior experience needed** for most programs.
💡 **Financial aid & payment plans available.**
💡 **Day, evening, and weekend classes.**

**Next step:** Would you like to book a free career consultation, or would you prefer to browse our healthcare programs?`;
    } else if (lowerMessage.includes('hvac') || lowerMessage.includes('heating') || lowerMessage.includes('cooling') || lowerMessage.includes('refrigeration') || lowerMessage.includes('trade') || lowerMessage.includes('construction')) {
      response = `**Trades & Skilled Craft Career Pathways**

Skilled trades are in incredibly high demand — and they pay well without requiring a 4-year degree!

Here are some programs:

❄️ **HVAC/R Technician** — 12-24 weeks | $45,000-$65,000/yr entry
🔧 **Building Maintenance Technician** — 12-20 weeks | $40,000-$55,000/yr entry
⚡ **EPA 608 Universal Certification** — 2-4 weeks | $40,000-$60,000/yr entry
🚛 **CDL Truck Driving** — 4-8 weeks | $55,000-$80,000/yr entry

💡 **Apprenticeships available** in most trades.
💡 **Sign-on bonuses common** ($5,000-$15,000).
💡 **Most programs include certification exam prep.**

**Next step:** Ready to explore trades? Book a free consultation or browse our programs!`;
    } else if (lowerMessage.includes('barber') || lowerMessage.includes('cosmetology') || lowerMessage.includes('beauty') || lowerMessage.includes('esthetic') || lowerMessage.includes('nail') || lowerMessage.includes('manicurist')) {
      response = `**Beauty & Cosmetology Career Pathways**

Beauty is a $100B+ industry with tons of entrepreneurship opportunity!

Here are some programs:

✂️ **Barbering** — 12 months (apprenticeship) | $35,000-$65,000/yr entry
💇 **Cosmetology** — 12 months | $30,000-$55,000/yr entry
✨ **Esthetics** — 6 months | $35,000-$60,000/yr entry
💅 **Manicuring** — 4 months | $28,000-$45,000/yr entry

💡 **Apprenticeships** — earn while you learn!
💡 **Commission & booth rental** options available.
💡 **State licensing exam prep** included.

**Next step:** Interested in a beauty career? Let's find the right path for you!`;
    } else if (lowerMessage.includes('test') || lowerMessage.includes('certification') || lowerMessage.includes('act') || lowerMessage.includes('workkeys')) {
      response = `**Certification & Testing Programs**

Elevate offers a range of industry-recognized certification programs:

📝 **ACT WorkKeys** — Job skills assessment (NCRC Bronze/Silver/Gold)
🔒 **CareerSafe OSHA-10** — Workplace safety certification
🔌 **EPA 608 Universal** — HVAC refrigerant handling
📊 **Certiport** — IT certification testing center
❤️ **CPR/First Aid (AHA)** — Healthcare provider CPR
🏥 **NHA Certifications** — Phlebotomy, EKG, CCMA exam prep

💡 **All tests proctored** on-site at our Indianapolis location.
💡 **Practice tests available.**
💡 **Retake options** if needed.

**Next step:** Which certification are you working toward? Let's get you scheduled!`;
    } else if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('help') || lowerMessage.includes('career') || lowerMessage.includes('guide') || lowerMessage.includes('choose')) {
      response = `**Welcome to Elevate for Humanity! 👋**

I'm here to help you find the right career pathway. We offer programs in:

🏥 **Healthcare** — Medical Assistant, Phlebotomy, CNA, Pharmacy Tech, EKG, and more
⚙️ **Skilled Trades** — HVAC, CDL, Building Maintenance, EPA certifications
✂️ **Beauty & Cosmetology** — Barber, Cosmetology, Esthetics, Manicuring
📝 **Testing & Certifications** — ACT WorkKeys, OSHA, EPA 608, CPR, Certiport

**What interests you most?** Click a category above or just tell me what kind of work you're interested in, and I'll point you in the right direction!`;
    } else {
      response = `**Thanks for reaching out! 🙌**

I can help you explore career pathways at Elevate. We have programs in:

🏥 **Healthcare** — No experience needed, job placement support
⚙️ **Skilled Trades** — Earn while you learn, apprenticeship options
✂️ **Beauty & Cosmetology** — Licensure prep, booth rental opportunities
📝 **Testing & Certifications** — Industry-recognized credentials

**Tell me a bit more** — what kind of work environment sounds appealing to you? Or click one of the categories above to explore specific programs!`;
    }

    return NextResponse.json({
      response,
      sessionId,
      provider: 'zora-static',
    });

  } catch (error) {
    logger.error('[zora] Error', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or email us at info@elevateforhumanity.org' },
      { status: 500 }
    );
  }
}

export { _POST as POST };
