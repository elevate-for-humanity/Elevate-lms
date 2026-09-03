import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { hydrateProcessEnv } from '@/lib/secrets';
import { gpuVideoAvailable } from '@/lib/video/gpu-video-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    await hydrateProcessEnv();
    const githubConfigured = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
    const supabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    const aiConfigured = Boolean(
      process.env.GROQ_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GEMINI_API_KEY,
    );
    const northflankConfigured = Boolean(
      (process.env.NORTHFLANK_API_TOKEN || process.env.NORTHFLANK_API_KEY) &&
      process.env.NORTHFLANK_PROJECT_ID,
    );
    const browserConfigured = Boolean(
      process.env.STUDIO_BROWSER_URL &&
      (process.env.STUDIO_BROWSER_PUBLIC_URL || process.env.NEXT_PUBLIC_STUDIO_BROWSER_URL) &&
      process.env.STUDIO_BROWSER_SECRET,
    );
    const stripeConfigured = Boolean(
      (process.env.STRIPE_RESTRICTED_KEY || process.env.STRIPE_SECRET_KEY) &&
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    const cloudflareAiConfigured = Boolean(
      (process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN) &&
      process.env.CLOUDFLARE_ACCOUNT_ID,
    );
    const cloudflareControlPlaneConfigured = Boolean(
      process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID,
    );
    const gpuConfigured = Boolean(process.env.GPU_VIDEO_WORKER_URL && process.env.GPU_WORKER_SECRET);
    const gpuReady = gpuConfigured ? await gpuVideoAvailable() : false;
    return buildCapabilityHealth('plugins', [
      {
        name: 'plugin-source-access',
        passed: githubConfigured,
        required: true,
        message: githubConfigured
          ? 'Plugin source access is configured.'
          : 'GitHub access for plugin sources is missing.',
      },
      {
        name: 'supabase',
        passed: supabaseConfigured,
        required: true,
        message: supabaseConfigured
          ? 'Supabase data and auth access are configured.'
          : 'Supabase service configuration is missing.',
      },
      {
        name: 'ai-provider',
        passed: aiConfigured,
        required: true,
        message: aiConfigured
          ? 'At least one governed AI provider is configured.'
          : 'No governed AI provider is configured.',
      },
      {
        name: 'northflank',
        passed: northflankConfigured,
        required: false,
        message: northflankConfigured
          ? 'Northflank deployment control is configured.'
          : 'Northflank deployment control is not configured.',
      },
      {
        name: 'cloud-browser',
        passed: browserConfigured,
        required: false,
        message: browserConfigured
          ? 'Studio Browser runtime is configured.'
          : 'Studio Browser runtime is not configured.',
      },
      {
        name: 'stripe',
        passed: stripeConfigured,
        required: false,
        message: stripeConfigured
          ? 'Stripe server and webhook access are configured.'
          : 'Stripe server or webhook configuration is incomplete.',
      },
      {
        name: 'cloudflare-workers-ai',
        passed: cloudflareAiConfigured,
        required: false,
        message: cloudflareAiConfigured
          ? 'Cloudflare Workers AI is configured.'
          : 'Cloudflare Workers AI configuration is incomplete.',
      },
      {
        name: 'instructional-gpu-video',
        passed: gpuReady,
        required: false,
        message: gpuReady
          ? 'The instructional GPU renderer is configured and model-ready.'
          : gpuConfigured
            ? 'The instructional GPU renderer is configured but not ready.'
            : 'The instructional GPU renderer is not connected to Admin.',
      },
      {
        name: 'cloudflare-control-plane',
        passed: cloudflareControlPlaneConfigured,
        required: false,
        message: cloudflareControlPlaneConfigured
          ? 'Cloudflare control-plane access is configured.'
          : 'Cloudflare control-plane access is not configured.',
      },
    ]);
  });
}
