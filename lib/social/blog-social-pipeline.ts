import { z } from 'zod';
import { getSocialTokens } from '@/lib/social/token-resolver';

const SocialPackageSchema = z.object({
  caption: z.string().min(40).max(1800),
  hook: z.string().min(8).max(180),
  voiceover: z.string().min(40).max(1400),
  scenes: z
    .array(
      z.object({
        seconds: z.number().int().min(2).max(10),
        visual: z.string().min(8).max(300),
        overlay: z.string().min(1).max(120),
      }),
    )
    .min(3)
    .max(10),
  hashtags: z
    .array(z.string().regex(/^#[A-Za-z0-9_]+$/))
    .min(2)
    .max(12),
  cta: z.string().min(8).max(180),
});

export type SocialPackage = z.infer<typeof SocialPackageSchema>;

export type BlogSocialSource = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  social_post_caption?: string | null;
};

function plainText(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contextualHashtags(value: string): string[] {
  const normalized = value.toLowerCase();
  const tags = ['#ElevateForHumanity', '#Indianapolis', '#CareerTraining'];
  const matches: Array<[RegExp, string[]]> = [
    [/barber|barbering/, ['#BarberApprenticeship', '#IndianaBarbers']],
    [/cosmetology|beauty/, ['#CosmetologyCareer', '#BeautyIndustry']],
    [/hvac|epa 608/, ['#HVACTraining', '#SkilledTrades']],
    [/cna|nursing assistant/, ['#CNATraining', '#HealthcareCareers']],
    [/medical assistant/, ['#MedicalAssistant', '#HealthcareTraining']],
    [/bookkeep|accounting|financial/, ['#Bookkeeping', '#FinancialLiteracy']],
    [/apprentice/, ['#RegisteredApprenticeship', '#EarnWhileYouLearn']],
    [/employer|host shop/, ['#WorkforcePartners', '#TalentPipeline']],
  ];
  for (const [pattern, additions] of matches) {
    if (pattern.test(normalized)) tags.push(...additions);
  }
  return Array.from(new Set(tags)).slice(0, 8);
}

function deterministicBlogPackage(blog: BlogSocialSource): SocialPackage {
  const title = plainText(blog.title);
  const excerpt = plainText(blog.social_post_caption || blog.excerpt || blog.content).slice(0, 720);
  const canonicalUrl = `https://www.elevateforhumanity.org/blog/${blog.slug}`;
  const fundingLine =
    'Eligible participants may qualify for workforce funding that covers some or all tuition. Eligibility, program requirements, and funding availability apply.';
  const engagementCta =
    'Know someone who needs this opportunity? Share this with 10 people, follow Elevate for Humanity, and send us a message to get started.';
  const caption =
    `${title}\n\n${excerpt || 'Read the latest update from Elevate for Humanity.'}\n\nExplore short-term career and credential training designed to help qualified participants move toward their next opportunity. ${fundingLine}\n\n${engagementCta}\n\n${canonicalUrl}`.slice(
      0,
      1800,
    );
  const hook = title.slice(0, 180);
  return SocialPackageSchema.parse({
    caption,
    hook: hook.length >= 8 ? hook : 'Elevate for Humanity update',
    voiceover:
      `${title}. ${excerpt || 'Visit Elevate for Humanity for the complete update.'} Explore short-term career and credential training. ${fundingLine} Share this opportunity and contact Elevate for Humanity to check eligibility.`.slice(
        0,
        1400,
      ),
    scenes: [
      {
        seconds: 4,
        visual: 'Use the approved article hero image.',
        overlay: title.slice(0, 120) || 'Elevate update',
      },
      {
        seconds: 5,
        visual: 'Show the relevant approved program, event, or service image.',
        overlay: 'Career training and workforce support',
      },
      {
        seconds: 4,
        visual: 'Show the Elevate for Humanity website and approved contact information.',
        overlay: 'Learn more at elevateforhumanity.org',
      },
    ],
    hashtags: contextualHashtags(`${title} ${excerpt}`),
    cta: engagementCta,
  });
}

export async function generateBlogSocialPackage(blog: BlogSocialSource): Promise<{
  package: SocialPackage;
  provider: string;
  model: string;
}> {
  return {
    package: deterministicBlogPackage(blog),
    provider: 'elevate-deterministic',
    model: 'blog-social-v1',
  };
}

const graphVersion = () => process.env.META_GRAPH_API_VERSION?.trim() || 'v26.0';

function assertExternalWriteEnabled(platform: string, dryRun: boolean): void {
  if (dryRun) {
    throw new Error(
      `${platform.toUpperCase()}_DRY_RUN: Read-only verification is required before external publishing is enabled.`,
    );
  }
}

async function graphRequest(path: string, body: URLSearchParams): Promise<Record<string, unknown>> {
  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || payload.error) {
    const providerMessage =
      typeof payload.error === 'object' && payload.error
        ? String((payload.error as Record<string, unknown>).message ?? 'Meta rejected the request')
        : 'Meta rejected the request';
    throw new Error(`META_PUBLISH_FAILED: ${providerMessage}`);
  }
  return payload;
}

async function graphGet(path: string, query: URLSearchParams): Promise<Record<string, unknown>> {
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion()}/${path}?${query.toString()}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || payload.error) {
    const providerMessage =
      typeof payload.error === 'object' && payload.error
        ? String((payload.error as Record<string, unknown>).message ?? 'Meta rejected the request')
        : 'Meta rejected the request';
    throw new Error(`META_PUBLISH_FAILED: ${providerMessage}`);
  }
  return payload;
}

export async function publishFacebookPageLink(input: {
  message: string;
  link: string;
}): Promise<{ postId: string; publishedUrl: string }> {
  const tokens = await getSocialTokens('facebook');
  const pageId = tokens?.organization_id?.trim();
  if (!tokens?.access_token || !pageId) {
    throw new Error(
      'META_PAGE_NOT_CONNECTED: Connect the Elevate Facebook Page in Admin settings.',
    );
  }
  assertExternalWriteEnabled('facebook', tokens.dry_run);

  const payload = await graphRequest(
    `${encodeURIComponent(pageId)}/feed`,
    new URLSearchParams({
      message: input.message,
      link: input.link,
      access_token: tokens.access_token,
    }),
  );
  const postId = String(payload.id ?? '');
  if (!postId) throw new Error('META_INVALID_RESPONSE: Facebook returned no post ID.');
  return { postId, publishedUrl: `https://www.facebook.com/${postId.replace('_', '/posts/')}` };
}

export async function publishFacebookPageReel(input: {
  description: string;
  videoUrl: string;
}): Promise<{ postId: string; publishedUrl: string }> {
  const tokens = await getSocialTokens('facebook');
  const pageId = tokens?.organization_id?.trim();
  if (!tokens?.access_token || !pageId) {
    throw new Error(
      'META_PAGE_NOT_CONNECTED: Connect the Elevate Facebook Page in Admin settings.',
    );
  }
  assertExternalWriteEnabled('facebook', tokens.dry_run);

  const start = await graphRequest(
    `${encodeURIComponent(pageId)}/video_reels`,
    new URLSearchParams({
      upload_phase: 'start',
      access_token: tokens.access_token,
    }),
  );
  const videoId = String(start.video_id ?? '');
  if (!videoId) throw new Error('META_INVALID_RESPONSE: Facebook returned no Reel video ID.');

  await graphRequest(
    `${encodeURIComponent(videoId)}`,
    new URLSearchParams({
      upload_phase: 'transfer',
      file_url: input.videoUrl,
      access_token: tokens.access_token,
    }),
  );
  await graphRequest(
    `${encodeURIComponent(pageId)}/video_reels`,
    new URLSearchParams({
      upload_phase: 'finish',
      video_id: videoId,
      video_state: 'PUBLISHED',
      description: input.description,
      access_token: tokens.access_token,
    }),
  );

  return { postId: videoId, publishedUrl: `https://www.facebook.com/reel/${videoId}` };
}

export async function publishInstagramImage(input: {
  caption: string;
  imageUrl: string;
}): Promise<{ postId: string; publishedUrl: string }> {
  const tokens = await getSocialTokens('instagram');
  const accountId = tokens?.organization_id?.trim();
  if (!tokens?.access_token || !accountId) {
    throw new Error(
      'INSTAGRAM_NOT_CONNECTED: Connect the Elevate Instagram Business account in Admin settings.',
    );
  }
  assertExternalWriteEnabled('instagram', tokens.dry_run);
  const container = await graphRequest(
    `${encodeURIComponent(accountId)}/media`,
    new URLSearchParams({
      image_url: input.imageUrl,
      caption: input.caption,
      access_token: tokens.access_token,
    }),
  );
  const creationId = String(container.id ?? '');
  if (!creationId) throw new Error('META_INVALID_RESPONSE: Instagram returned no creation ID.');
  const published = await graphRequest(
    `${encodeURIComponent(accountId)}/media_publish`,
    new URLSearchParams({
      creation_id: creationId,
      access_token: tokens.access_token,
    }),
  );
  const postId = String(published.id ?? '');
  if (!postId) throw new Error('META_INVALID_RESPONSE: Instagram returned no post ID.');
  const media = await graphGet(
    encodeURIComponent(postId),
    new URLSearchParams({
      fields: 'permalink',
      access_token: tokens.access_token,
    }),
  );
  const publishedUrl = String(media.permalink ?? '');
  if (!publishedUrl.startsWith('https://www.instagram.com/')) {
    throw new Error('META_INVALID_RESPONSE: Instagram returned no verified permalink.');
  }
  return { postId, publishedUrl };
}

async function waitForInstagramContainer(creationId: string, accessToken: string): Promise<void> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const status = await graphGet(
      encodeURIComponent(creationId),
      new URLSearchParams({
        fields: 'status_code,status',
        access_token: accessToken,
      }),
    );
    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
      throw new Error(
        `INSTAGRAM_CONTAINER_${String(status.status_code)}: ${String(status.status ?? 'Media processing failed.')}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error('INSTAGRAM_CONTAINER_TIMEOUT: Media was not ready within 60 seconds.');
}

export async function publishInstagramReel(input: {
  caption: string;
  videoUrl: string;
}): Promise<{ postId: string; publishedUrl: string }> {
  const tokens = await getSocialTokens('instagram');
  const accountId = tokens?.organization_id?.trim();
  if (!tokens?.access_token || !accountId) {
    throw new Error(
      'INSTAGRAM_NOT_CONNECTED: Connect the Elevate Instagram Business account in Admin settings.',
    );
  }
  assertExternalWriteEnabled('instagram', tokens.dry_run);
  const container = await graphRequest(
    `${encodeURIComponent(accountId)}/media`,
    new URLSearchParams({
      media_type: 'REELS',
      video_url: input.videoUrl,
      caption: input.caption,
      share_to_feed: 'true',
      access_token: tokens.access_token,
    }),
  );
  const creationId = String(container.id ?? '');
  if (!creationId) throw new Error('META_INVALID_RESPONSE: Instagram returned no creation ID.');
  await waitForInstagramContainer(creationId, tokens.access_token);
  const published = await graphRequest(
    `${encodeURIComponent(accountId)}/media_publish`,
    new URLSearchParams({
      creation_id: creationId,
      access_token: tokens.access_token,
    }),
  );
  const postId = String(published.id ?? '');
  if (!postId) throw new Error('META_INVALID_RESPONSE: Instagram returned no post ID.');
  const media = await graphGet(
    encodeURIComponent(postId),
    new URLSearchParams({
      fields: 'permalink',
      access_token: tokens.access_token,
    }),
  );
  const publishedUrl = String(media.permalink ?? '');
  if (!publishedUrl.startsWith('https://www.instagram.com/')) {
    throw new Error('META_INVALID_RESPONSE: Instagram returned no verified permalink.');
  }
  return { postId, publishedUrl };
}

export function nextRetryAt(attempt: number): string {
  const boundedAttempt = Math.max(1, Math.min(attempt, 6));
  return new Date(
    Date.now() + Math.min(6 * 60 * 60 * 1000, 30_000 * 2 ** (boundedAttempt - 1)),
  ).toISOString();
}
