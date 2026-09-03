import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/ai/openai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
  recommendation?: { name: string; reason: string; href: string };
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

function humanChangeSummary(changed: string[]): string {
  const labels: Record<string, string> = {
    businessName: 'business name', industry: 'industry', location: 'location', tone: 'visual direction',
    heroHeadline: 'headline', heroSubhead: 'intro copy', primaryColor: 'primary color', secondaryColor: 'supporting color',
    services: 'services', imageKey: 'imagery', brightness: 'image treatment', booking: 'booking', financing: 'financing',
    testimonials: 'reviews', mobilePreview: 'preview', published: 'publishing',
  };
  const readable = changed.slice(0, 3).map((key) => labels[key] || key);
  if (readable.length === 1) return readable[0];
  if (readable.length === 2) return `${readable[0]} and ${readable[1]}`;
  return `${readable[0]}, ${readable[1]}, and ${readable[2]}`;
}

function fallbackBuilder(message: string, current: BuilderState): ParisResponse {
  const lower = message.toLowerCase();
  const actions: Partial<BuilderState> = {};
  if (!current.generated) actions.generated = true;

  const businessName = extractBusinessName(message);
  if (businessName) actions.businessName = businessName;

  if (lower.includes('dental') || lower.includes('dentist')) {
    Object.assign(actions, {
      industry: 'Dental practice', imageKey: 'dental',
      services: ['Dental implants', 'Cosmetic dentistry', 'Invisalign'],
      heroHeadline: 'Confident smiles. Modern dental care.',
      heroSubhead: 'Advanced restorative and cosmetic dentistry with a patient-first experience.',
    });
  } else if (lower.includes('home health') || lower.includes('home-health') || lower.includes('caregiver')) {
    Object.assign(actions, {
      industry: 'Home healthcare', imageKey: 'home-health',
      services: ['Personal care', 'Respite support', 'Care coordination'],
      heroHeadline: 'Compassionate care that keeps families moving forward.',
      heroSubhead: 'Skilled support, personal care, respite services, and simple online consultation requests.',
    });
  } else if (lower.includes('barber') || lower.includes('salon') || lower.includes('beauty')) {
    Object.assign(actions, {
      industry: 'Beauty business', imageKey: 'beauty',
      services: ['Signature services', 'Appointments', 'Memberships'],
      heroHeadline: 'Look sharp. Feel confident. Book in seconds.',
      heroSubhead: 'Premium services, online booking, and a modern brand experience built to convert.',
    });
  } else if (lower.includes('training') || lower.includes('school') || lower.includes('academy')) {
    Object.assign(actions, {
      industry: 'Training provider', imageKey: 'training',
      services: ['Programs', 'Admissions', 'Student support'],
      heroHeadline: 'Career training built around real outcomes.',
      heroSubhead: 'Explore programs, funding options, enrollment, and support from one clear website.',
    });
  }

  if (lower.includes('indianapolis')) actions.location = 'Indianapolis, Indiana';
  if (lower.includes('luxury') || lower.includes('premium')) {
    actions.tone = 'Luxury'; actions.primaryColor = '#8a6a2f'; actions.secondaryColor = '#fffaf0';
  } else if (lower.includes('modern')) {
    actions.tone = 'Modern'; actions.primaryColor = '#0f766e'; actions.secondaryColor = '#ecfeff';
  } else if (lower.includes('warm')) {
    actions.tone = 'Warm'; actions.primaryColor = '#b45309'; actions.secondaryColor = '#fff7ed';
  }

  if (lower.includes('bright')) actions.brightness = 0.08;
  if (lower.includes('dark')) actions.brightness = 0.34;
  if (lower.includes('booking') || lower.includes('appointment')) actions.booking = true;
  if (lower.includes('financ')) actions.financing = true;
  if (lower.includes('testimonial') || lower.includes('review')) actions.testimonials = true;
  if (lower.includes('mobile') || lower.includes('phone')) actions.mobilePreview = true;
  if (lower.includes('desktop')) actions.mobilePreview = false;
  if (lower.includes('publish') || lower.includes('go live')) actions.published = true;

  const changed = Object.keys(actions).filter((key) => key !== 'generated');
  const reply = changed.length
    ? `I changed the ${humanChangeSummary(changed)}. Take a look at the preview and tell me what feels off—I can keep shaping it with you.`
    : `Tell me what you want different, the same way you'd tell a designer. For example, “make it feel more upscale,” “lead with booking,” or “the headline is too generic.”`;

  return { reply, actions };
}

function fallbackInterview(message: string): ParisResponse {
  const lower = message.toLowerCase();
  if (lower.includes('website') || lower.includes('site') || lower.includes('business')) {
    return {
      reply: `Website Builder fits this. Give me the business name and what you need customers to do first; I’ll shape the rest around that instead of making you fill out a long setup form.`,
      recommendation: { name: 'AI Website Builder', reason: 'Build, edit, preview, and publish by talking with PARIS.', href: '/store/apps/website-builder' },
      starterPrompt: message,
      ready: true,
    };
  }
  if (lower.includes('course') || lower.includes('training')) {
    return {
      reply: `For training, I’d start with Course Builder and the LMS. Tell me what you’re teaching and who it’s for; PARIS can structure the course while the LMS handles delivery and progress.`,
      recommendation: { name: 'Course Builder + LMS', reason: 'Create training content and deliver it in the same platform.', href: '/store' },
      ready: true,
    };
  }
  if (lower.includes('grant')) {
    return {
      reply: `Grants Discovery is the better first move here. Once the funding workflow is clear, we can add a public website only if it actually helps the goal.`,
      recommendation: { name: 'Grants Discovery', reason: 'Find, match, organize, and track funding opportunities.', href: '/store/apps/grants' },
      ready: true,
    };
  }
  return {
    reply: `Tell me what you’re trying to get done. You don’t need to know which Elevate tool does it—I’ll match the job to the right one and keep the setup as small as possible.`,
    ready: false,
  };
}

function safeJsonParse(text: string): ParisResponse | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)) as ParisResponse; } catch { return null; }
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
        const voiceRules = `Sound like a sharp, experienced human designer sitting beside the customer. Be concise, specific, and relaxed. Never say phrases like “Done. I updated”, “Tell me the outcome in plain English”, “I can assist with”, or recite a menu of capabilities. Do not congratulate the user or repeat their request. When something is ambiguous, make the most reasonable design choice and mention it naturally. The reply may be 1-3 short sentences and should react to the actual request.`;
        const system = mode === 'builder'
          ? `${voiceRules} You are PARIS inside Elevate AI Website Builder. Translate natural-language requests into visible website changes. Return valid JSON only with this shape: {"reply":"natural response","actions":{"generated":boolean,"businessName":"string","industry":"string","location":"string","tone":"string","heroHeadline":"string","heroSubhead":"string","primaryColor":"#hex","secondaryColor":"#hex","services":["string"],"imageKey":"dental|home-health|beauty|training|general","brightness":number,"booking":boolean,"financing":boolean,"testimonials":boolean,"mobilePreview":boolean,"published":boolean}}. Include only changed action keys except on the first build, when you should create a coherent differentiated first draft. Avoid generic copy such as “quality service”, “your trusted partner”, “solutions for you”, or “welcome to”. Do not invent regulated claims, credentials, prices, or guarantees.`
          : `${voiceRules} You are PARIS, Elevate's product consultant. Recommend the smallest useful starting stack. Return valid JSON only: {"reply":"natural response","recommendation":{"name":"string","reason":"string","href":"string"},"starterPrompt":"string when Website Builder is recommended","ready":boolean}. Prefer /store/apps/website-builder for website goals, /store/apps/grants for grants, and /store for multi-product needs. Do not invent pricing or capabilities.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          temperature: 0.55,
          max_tokens: 450,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: mode === 'builder' ? `Current builder state: ${JSON.stringify(current)}\nCustomer request: ${message}` : message },
          ],
        });
        const parsed = safeJsonParse(response.choices[0]?.message?.content || '');
        if (parsed?.reply) return NextResponse.json(parsed, { headers: { 'Cache-Control': 'no-store' } });
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
