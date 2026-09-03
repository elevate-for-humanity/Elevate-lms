import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { NextRequest, NextResponse } from 'next/server';
import { runAITask } from '@/lib/ai/orchestrator';
import { getRecommendedTemplate } from '@/lib/templates/designs';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiAuthGuard } from '@/lib/admin/guards';

type SubmittedClaim = {
  value?: unknown;
  source?: unknown;
  verifiedAt?: unknown;
};

function readSubmittedClaim(input: unknown, key: string) {
  if (!input || typeof input !== 'object') return null;
  const claim = (input as Record<string, SubmittedClaim>)[key];
  if (!claim || typeof claim !== 'object') return null;
  const source = typeof claim.source === 'string' ? claim.source.trim() : '';
  const verifiedAt = typeof claim.verifiedAt === 'string' ? claim.verifiedAt.trim() : '';
  if (!source || !verifiedAt || Number.isNaN(Date.parse(verifiedAt))) return null;
  return { key, value: claim.value, source, verifiedAt, status: 'owner_attested' as const };
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await apiAuthGuard(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => null);
    const organizationName = typeof body?.organizationName === 'string' ? body.organizationName.trim() : '';
    const organizationType = typeof body?.organizationType === 'string' ? body.organizationType.trim() : '';
    const industry = typeof body?.industry === 'string' ? body.industry.trim() : 'General';
    const targetAudience = typeof body?.targetAudience === 'string' ? body.targetAudience.trim() : '';
    const trainingTypes = typeof body?.trainingTypes === 'string' ? body.trainingTypes.trim() : '';
    const brandColors = typeof body?.brandColors === 'string' ? body.brandColors.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const submittedClaims = body?.verifiedClaims;

    if (!organizationName || !organizationType) {
      return NextResponse.json({ error: 'Organization name and type required' }, { status: 400 });
    }

    const template = getRecommendedTemplate(industry || 'General', organizationType);
    const result = await runAITask({
      task: 'general_chat',
      context: { userId: auth.id, skipRAG: true },
      temperature: 0.6,
      maxTokens: 2200,
      prompt: `Generate an original website draft from the verified owner-supplied facts below.

Organization: ${organizationName}
Type: ${organizationType}
Industry: ${industry || 'General'}
Target audience: ${targetAudience || 'Not supplied'}
Training types: ${trainingTypes || 'Not supplied'}
Description: ${description || 'Not supplied'}

Return JSON only with homepage, programs, and seo. Homepage must include heroTitle, heroSubtitle, heroCtaText, and three features. Programs may only use programs explicitly supported by the supplied facts; otherwise return an empty array. Do not generate statistics, ratings, reviews, testimonials, accreditation, approvals, prices, contact details, outcome claims, or other facts the owner did not supply.`,
    });

    let siteConfig: any;
    try {
      siteConfig = JSON.parse(result.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim());
    } catch (error) {
      logger.warn('[generate-site] invalid structured AI response', {
        provider: result.provider,
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: 'AI returned invalid structured website content', retryable: true },
        { status: 502 },
      );
    }

    const previewId = `preview_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const claimKeys = [
      'student_count',
      'completion_rate',
      'employer_count',
      'rating',
      'testimonial',
      'accreditation',
      'pricing',
      'contact_email',
    ];
    const claims = claimKeys.map((key) =>
      readSubmittedClaim(submittedClaims, key) || {
        key,
        status: 'owner_verification_required' as const,
        value: null,
        source: null,
        verifiedAt: null,
      },
    );
    const claimMap = new Map(claims.map((claim) => [claim.key, claim]));
    const numericClaim = (key: string) => {
      const claim = claimMap.get(key);
      const value = claim?.status === 'owner_attested' ? Number(claim.value) : Number.NaN;
      return Number.isFinite(value) && value >= 0 ? value : undefined;
    };
    const textClaim = (key: string) => {
      const claim = claimMap.get(key);
      return claim?.status === 'owner_attested' && typeof claim.value === 'string' && claim.value.trim()
        ? claim.value.trim()
        : undefined;
    };
    const testimonialClaim = claimMap.get('testimonial');
    const testimonialValue = testimonialClaim?.status === 'owner_attested'
      && testimonialClaim.value
      && typeof testimonialClaim.value === 'object'
      ? testimonialClaim.value as Record<string, unknown>
      : null;
    const testimonial = testimonialValue
      && typeof testimonialValue.quote === 'string'
      && testimonialValue.quote.trim()
      && typeof testimonialValue.author === 'string'
      && testimonialValue.author.trim()
      ? { quote: testimonialValue.quote.trim(), author: testimonialValue.author.trim() }
      : undefined;

    const config = {
      template: {
        id: template.id,
        name: template.name,
        fonts: template.fonts,
        colors: template.colors,
        style: template.style,
      },
      branding: {
        primaryColor: brandColors || template.colors.primary,
        secondaryColor: template.colors.secondary,
        accentColor: template.colors.accent,
        backgroundColor: template.colors.background,
        textColor: template.colors.text,
        logoText: organizationName,
        tagline: siteConfig.homepage?.heroSubtitle?.slice(0, 60) || '',
      },
      homepage: {
        heroTitle: siteConfig.homepage?.heroTitle || organizationName,
        heroSubtitle: siteConfig.homepage?.heroSubtitle || description,
        heroCtaText: siteConfig.homepage?.heroCtaText || 'Learn More',
        features: Array.isArray(siteConfig.homepage?.features) ? siteConfig.homepage.features.slice(0, 3) : [],
      },
      programs: Array.isArray(siteConfig.programs) ? siteConfig.programs : [],
      stats: {
        students: numericClaim('student_count'),
        completionRate: textClaim('completion_rate'),
        employers: numericClaim('employer_count'),
        rating: textClaim('rating'),
      },
      testimonial,
      navigation: [
        { label: 'Home', href: '/' },
        { label: 'Programs', href: '/programs' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      footer: {
        description: description || `${organizationName} website draft.`,
        contactEmail: null,
      },
      seo: siteConfig.seo || {
        title: organizationName,
        description: description || `${organizationName} website`,
        keywords: [],
      },
      claims,
      publishing: {
        blockedClaims: claims
          .filter((claim) => claim.status !== 'owner_attested')
          .map((claim) => claim.key),
        requiresOwnerVerification: claims.some((claim) => claim.status !== 'owner_attested'),
      },
      meta: {
        organizationName,
        organizationType,
        industry: industry || 'General',
        generatedAt: new Date().toISOString(),
        previewId,
        provider: result.provider,
        generatedClaimsPolicy: 'verified-input-only',
      },
    };

    return NextResponse.json({
      success: true,
      previewId,
      config,
      previewUrl: `/preview/${previewId}`,
    });
  } catch (error) {
    logger.error('AI generation error', normalizeError(error, 'AI generation failed'), getErrorContext(error));
    return NextResponse.json({ error: 'Failed to generate site configuration' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/ai/generate-site', _POST);
