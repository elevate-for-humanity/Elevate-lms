import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/ai/openai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type BuilderState = {
  generated?: boolean;
  businessName?: string;
  industry?: string;
  location?: string;
  tone?: string;
  heroHeadline?: string;
  heroSubhead?: string;
  primaryColor?: string;
  secondaryColor?: string;
  services?: string[];
  imageKey?: string;
  brightness?: number;
  booking?: boolean;
  financing?: boolean;
  testimonials?: boolean;
  mobilePreview?: boolean;
  published?: boolean;
};

type ParisResponse = {
  reply: string;
  actions?: Partial<BuilderState>;
  recommendation?: {
    name: string;
    reason: string;
    href: string;
  };
  starterPrompt?: string;
  ready?: boolean;
};

function clampText(value: unknown, max = 700): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function extractBusinessName(message: string): string | undefined {
  const patterns = [
    /(?:called|named)\s+([A-Z][A-Za-z0-9&' -]{2,50})/i,
    /(?:for|website for)\s+([A-Z][A-Za-z0-9&' -]{2,50})(?:\s+(?:in|with|that|and)|[.,]|$)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function fallbackBuilder(message: string, current: BuilderState): ParisResponse {
  const lower = message.toLowerCase();
  const actions: Partial<BuilderState> = {};

  if (!current.generated) actions.generated = true;

  const businessName = extractBusinessName(message);
  if (businessName) actions.businessName = businessName;

  if (lower.includes('dental') || lower.includes('dentist')) {
    Object.assign(actions, {
      industry: 'Dental practice',
      imageKey: 'dental',
      services: ['Dental implants', 'Cosmetic dentistry', 'Invisalign'],
      heroHeadline: 'Confident smiles. Modern dental care.',
      heroSubhead: 'Advanced restorative and cosmetic dentistry with a patient-first experience.',
    });
  } else if (lower.includes('home health') || lower.includes('home-health') || lower.includes('caregiver')) {
    Object.assign(actions, {
      industry: 'Home healthcare',
      imageKey: 'home-health',
      services: ['Personal care', 'Respite support', 'Care coordination'],
      heroHeadline: 'Compassionate care that keeps families moving forward.',
      heroSubhead: 'Skilled support, personal care, respite services, and simple online consultation requests.',
    });
  } else if (lower.includes('barber') || lower.includes('salon') || lower.includes('beauty')) {
    Object.assign(actions, {
      industry: 'Beauty business',
      imageKey: 'beauty',
      services: ['Signature services', 'Appointments', 'Memberships'],
      heroHeadline: 'Look sharp. Feel confident. Book in seconds.',
      heroSubhead: 'Premium services, online booking, and a modern brand experience built to convert.',
    });
  } else if (lower.includes('training') || lower.includes('school') || lower.includes('academy')) {
    Object.assign(actions, {
      industry: 'Training provider',
      imageKey: 'training',
      services: ['Programs', 'Admissions', 'Student support'],
      heroHeadline: 'Career training built around real outcomes.',
      heroSubhead: 'Explore programs, funding options, enrollment, and support from one clear website.',
    });
  }

  if (lower.includes('indianapolis')) actions.location = 'Indianapolis, Indiana';
  if (lower.includes('luxury') || lower.includes('premium')) {
    actions.tone = 'Luxury';
    actions.primaryColor = '#8a6a2f';
    actions.secondaryColor = '#fffaf0';
  } else if (lower.includes('modern')) {
    actions.tone = 'Modern';
    actions.primaryColor = '#0f766e';
    actions.secondaryColor = '#ecfeff';
  } else if (lower.includes('warm')) {
    actions.tone = 'Warm';
    actions.primaryColor = '#b45309';
    actions.secondaryColor = '#fff7ed';
  }

  if (lower.includes('bright')) actions.brightness = 0.08;
  if (lower.includes('dark')) actions.brightness = 0.34;
  if (lower.includes('booking') || lower.includes('appointment')) actions.booking = true;
  if (lower.includes('financ')) actions.financing = true;
  if (lower.includes('testimonial') || lower.includes('review')) actions.testimonials = true;
  if (lower.includes('mobile') || lower.includes('phone')) actions.mobilePreview = true;
  if (lower.includes('desktop')) actions.mobilePreview = false;
  if (lower.includes('publish') || lower.includes('go live')) actions.published = true;

  if (!actions.businessName && !current.businessName && actions.industry === 'Dental practice') {
    actions.businessName = 'Luxe Dental Studio';
  }

  const changed = Object.keys(actions).filter((key) => key !== 'generated');
  const reply = changed.length
    ? `Done. I updated ${changed.slice(0, 4).join(', ').replace(/([A-Z])/g, ' $1').toLowerCase().trim()}${changed.length > 4 ? ' and more' : ''}. Keep telling me what you want changed.`
    : 'I can change the brand, hero, services, booking, financing, testimonials, mobile preview, or publish state. Tell me what you want to see.';

  return { reply, actions };
}

function fallbackInterview(message: string): ParisResponse {
  const lower = message.toLowerCase();

  if (lower.includes('website') || lower.includes('site') || lower.includes('business')) {
    return {
      reply:
        'Yes. The AI Website Builder is the simplest starting point. Tell me the business, city, services, visual style, and what the site needs to help customers do. I can carry that description directly into the interactive demo below.',
      recommendation: {
        name: 'AI Website Builder',
        reason: 'Build, edit, preview, and publish a website by talking or typing to PARIS.',
        href: '/store/apps/website-builder',
      },
      starterPrompt: message,
      ready: true,
    };
  }

  if (lower.includes('course') || lower.includes('training')) {
    return {
      reply: 'Start with Course Builder plus the LMS. PARIS can help structure the course, then the LMS handles delivery and learner progress.',
      recommendation: {
        name: 'Course Builder + LMS',
        reason: 'Create training content, then deliver it and track learners in the same platform.',
        href: '/store',
      },
      ready: true,
    };
  }

  if (lower.includes('grant')) {
    return {
      reply: 'Start with Grants Discovery. If you also need a public-facing presence, add the Website Builder after the funding workflow is clear.',
      recommendation: {
        name: 'Grants Discovery',
        reason: 'Find, match, organize, and track funding opportunities.',
        href: '/store/apps/grants',
      },
      ready: true,
    };
  }

  return {
    reply:
      'Tell me the outcome in plain English. For example: “I need a website for my dental office,” “I want to sell training,” or “I need help managing workforce programs.” I’ll recommend the smallest starting stack and explain why.',
    ready: false,
  };
}

function safeJsonParse(text: string): ParisResponse | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as ParisResponse;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = body.mode === 'interview' ? 'interview' : 'builder';
    const message = clampText(body.message);
    const current = (body.current && typeof body.current === 'object' ? body.current : {}) as BuilderState;

    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    await hydrateProcessEnv();

    if (isOpenAIConfigured()) {
      try {
        const openai = getOpenAIClient();
        const system =
          mode === 'builder'
            ? `You are PARIS inside the Elevate AI Website Builder public demo. Translate the customer's natural-language request into visible website changes. Return JSON only with this exact shape: {"reply":"short conversational response","actions":{"generated":boolean,"businessName":"string","industry":"string","location":"string","tone":"string","heroHeadline":"string","heroSubhead":"string","primaryColor":"#hex","secondaryColor":"#hex","services":["string"],"imageKey":"dental|home-health|beauty|training|general","brightness":number between 0.05 and 0.4,"booking":boolean,"financing":boolean,"testimonials":boolean,"mobilePreview":boolean,"published":boolean}}. Include only action keys the user asked to change, except on the first build where you should create a coherent first draft. Do not invent regulated claims, credentials, prices, or guarantees. Keep reply under 45 words.`
            : `You are PARIS, the Store product consultant for Elevate. The customer should be able to describe the outcome in plain English. Recommend the smallest useful starting stack. Return JSON only: {"reply":"short conversational response","recommendation":{"name":"string","reason":"string","href":"string"},"starterPrompt":"string when Website Builder is recommended","ready":boolean}. Prefer /store/apps/website-builder for website goals, /store/apps/grants for grants, and /store for multi-product needs. Do not invent pricing or capabilities.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          temperature: 0.25,
          max_tokens: 650,
          messages: [
            { role: 'system', content: system },
            {
              role: 'user',
              content:
                mode === 'builder'
                  ? `Current builder state: ${JSON.stringify(current)}\nCustomer request: ${message}`
                  : message,
            },
          ],
        });

        const parsed = safeJsonParse(response.choices[0]?.message?.content || '');
        if (parsed?.reply) {
          return NextResponse.json(parsed, { headers: { 'Cache-Control': 'no-store' } });
        }
      } catch (error) {
        console.error('PARIS Store demo AI error:', error);
      }
    }

    const fallback = mode === 'builder' ? fallbackBuilder(message, current) : fallbackInterview(message);
    return NextResponse.json(fallback, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('PARIS Store demo error:', error);
    return NextResponse.json({ error: 'PARIS could not process that request' }, { status: 500 });
  }
}
