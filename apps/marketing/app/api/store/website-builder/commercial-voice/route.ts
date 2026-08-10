import { hydrateProcessEnv } from '@/lib/secrets';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/ai/openai-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const COMMERCIAL_SCRIPT = `Running a business is already a full-time job. Your website should not become another one. Meet the Elevate AI Website Builder, built around a simple idea: tell PARIS what you want, and watch your website take shape. Talk to her or type. Say, "make this more professional," "add online booking," "rewrite my services," or "help me market this business." PARIS keeps working with you as the site changes in real time. Need more than a website? Unlock specialized tools for marketing, grant writing, images, commercial videos, courses, customer support, operations, compliance, CRM, forms, booking, email, text messaging, and automation. Start with a fourteen-day trial and a limited pool of AI credits so you can actually try the experience before you upgrade. Build on an Elevate web address, preview everything, and publish when you are ready. Then add the tools your business needs as it grows. You do not need to learn code. You do not need to start from a blank screen. Start with a conversation. Build with PARIS. Build with Elevate.`;

export async function GET() {
  await hydrateProcessEnv();

  if (!isOpenAIConfigured()) {
    return new Response('Natural voice service is not configured', { status: 503 });
  }

  const openai = getOpenAIClient();
  const response = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'coral' as any,
    input: COMMERCIAL_SCRIPT,
    instructions:
      'Deliver this as a confident, warm, conversational commercial narrator. Sound human and energetic, not robotic and not like a radio announcer. Use natural pauses, emphasis, and a persuasive but grounded tone. The pace should feel modern and premium.',
    response_format: 'mp3',
  });

  const audio = await response.arrayBuffer();
  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Disposition': 'inline; filename="elevate-website-builder-commercial.mp3"',
    },
  });
}
