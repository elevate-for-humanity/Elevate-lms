import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getRecommendedTemplate } from '@/lib/templates/designs';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiAuthGuard } from '@/lib/admin/guards';

// Lazy-load OpenAI client to prevent build-time errors
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return new OpenAI({ apiKey });
}

/**
 * POST /api/ai/generate-site
 * 
 * AI generates a complete site configuration based on user input.
 * Returns preview config that can be used to render a preview site.
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;


    const body = await request.json();
    const { 
      organizationName,
      organizationType,
      industry,
      targetAudience,
      trainingTypes,
      brandColors,
      description,
    } = body;

    if (!organizationName || !organizationType) {
      return NextResponse.json(
        { error: 'Organization name and type required' },
        { status: 400 }
      );
    }

    // Get recommended template based on industry/org type
    const template = getRecommendedTemplate(industry || 'General', organizationType || 'Training Provider');

    // Generate site configuration using AI
    const prompt = `You are a learning management system configuration expert. Generate compelling content for a training organization website.

Organization Details:
- Name: ${organizationName}
- Type: ${organizationType}
- Industry: ${industry || 'General'}
- Target Audience: ${targetAudience || 'Adult learners'}
- Training Types: ${trainingTypes || 'Professional development'}
- Description: ${description || 'Not provided'}

Generate a JSON configuration with COMPELLING, SPECIFIC content:
1. homepage: { 
   heroTitle: (powerful headline, 6-10 words, specific to their industry),
   heroSubtitle: (benefit-focused, 15-25 words),
   heroCtaText: (action verb + benefit, 2-4 words),
   features: [3 objects with { title, description } - specific to their training type]
}
2. programs: [3 training programs with { name, description (2 sentences), duration, level }]
3. stats: { students: number, completionRate: "XX%", employers: number, rating: "X.X" }
4. testimonial: { quote: (realistic student success story, 2 sentences), author: "Name, Title" }
5. seo: { title, description, keywords: [5 relevant keywords] }

Be specific to ${industry || 'their'} industry. Use real-sounding program names.
Return ONLY valid JSON, no markdown.`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a site configuration generator. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    let siteConfig;
    try {
      // Remove markdown code blocks if present
      const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
      siteConfig = JSON.parse(jsonStr);
    } catch (parseError) {
      logger.error('Failed to parse AI response:', responseText);
      // Return default config if parsing fails
      siteConfig = getDefaultConfig(organizationName, organizationType);
    }

    // Generate unique preview ID
    const previewId = `preview_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Merge AI content with template design
    const finalConfig = {
      // Template design system
      template: {
        id: template.id,
        name: template.name,
        fonts: template.fonts,
        colors: template.colors,
        style: template.style,
      },
      // Branding (use template colors, override with user preference if provided)
      branding: {
        primaryColor: brandColors || template.colors.primary,
        secondaryColor: template.colors.secondary,
        accentColor: template.colors.accent,
        backgroundColor: template.colors.background,
        textColor: template.colors.text,
        logoText: organizationName,
        tagline: siteConfig.homepage?.heroSubtitle?.slice(0, 60) || 'Empowering learners',
      },
      // AI-generated content
      homepage: {
        heroTitle: siteConfig.homepage?.heroTitle || `Welcome to ${organizationName}`,
        heroSubtitle: siteConfig.homepage?.heroSubtitle || 'Start your learning journey today.',
        heroCtaText: siteConfig.homepage?.heroCtaText || 'Explore Programs',
        features: siteConfig.homepage?.features || [
          { title: 'Expert Training', description: 'Learn from industry professionals' },
          { title: 'Flexible Learning', description: 'Study at your own pace' },
          { title: 'Career Support', description: 'Job placement assistance' },
        ],
      },
      programs: siteConfig.programs || [
        { name: 'Fundamentals', description: 'Build your foundation', duration: '4 weeks', level: 'Beginner' },
        { name: 'Advanced', description: 'Take skills further', duration: '8 weeks', level: 'Intermediate' },
        { name: 'Professional', description: 'Industry certification', duration: '12 weeks', level: 'Advanced' },
      ],
      stats: siteConfig.stats || {
        students: 500,
        completionRate: '94%',
        employers: 50,
        rating: '4.9',
      },
      testimonial: siteConfig.testimonial || {
        quote: 'This program changed my career trajectory completely. The instructors were amazing.',
        author: 'Recent Graduate',
      },
      navigation: [
        { label: 'Home', href: '/' },
        { label: 'Programs', href: '/programs' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      footer: {
        description: `${organizationName} provides quality training and education for career advancement.`,
        contactEmail: `info@${organizationName.toLowerCase().replace(/\s+/g, '')}.org`,
      },
      seo: siteConfig.seo || {
        title: `${organizationName} - Professional Training`,
        description: `${organizationName} offers industry-recognized training programs.`,
        keywords: ['training', 'education', 'career'],
      },
      meta: {
        organizationName,
        organizationType,
        industry: industry || 'General',
        generatedAt: new Date().toISOString(),
        previewId,
      },
    };
    
    return NextResponse.json({
      success: true,
      previewId,
      config: finalConfig,
      previewUrl: `/preview/${previewId}`,
    });
  } catch (error) {
    logger.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate site configuration' },
      { status: 500 }
    );
  }
}

function getDefaultConfig(name: string, type: string) {
  const colors = {
    workforce_board: { primary: '#1e40af', secondary: '#3b82f6', accent: '#f59e0b' },
    training_provider: { primary: '#059669', secondary: '#10b981', accent: '#f97316' },
    nonprofit: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#ec4899' },
    employer: { primary: '#0f172a', secondary: '#334155', accent: '#3b82f6' },
  };

  const colorSet = colors[type as keyof typeof colors] || colors.training_provider;

  return {
    branding: {
      primaryColor: colorSet.primary,
      secondaryColor: colorSet.secondary,
      accentColor: colorSet.accent,
      logoText: name,
      tagline: 'Empowering learners through quality training',
    },
    homepage: {
      heroTitle: `Welcome to ${name}`,
      heroSubtitle: 'Start your learning journey today with industry-recognized training programs.',
      heroCtaText: 'Explore Programs',
      features: [
        { title: 'Expert Instructors', description: 'Learn from industry professionals' },
        { title: 'Flexible Learning', description: 'Study at your own pace, anywhere' },
        { title: 'Career Support', description: 'Job placement assistance included' },
      ],
    },
    programs: [
      { name: 'Fundamentals Course', description: 'Build your foundation', duration: '4 weeks', level: 'Beginner' },
      { name: 'Advanced Training', description: 'Take your skills further', duration: '8 weeks', level: 'Intermediate' },
      { name: 'Professional Certification', description: 'Industry-recognized credential', duration: '12 weeks', level: 'Advanced' },
    ],
    navigation: [
      { label: 'Home', href: '/' },
      { label: 'Programs', href: '/programs' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    footer: {
      description: `${name} is dedicated to providing quality training and education.`,
      contactEmail: `info@${name.toLowerCase().replace(/\s+/g, '')}.org`,
    },
    seo: {
      title: `${name} - Professional Training Programs`,
      description: `${name} offers training programs for career advancement.`,
      keywords: ['training', 'education', 'professional development', 'certification'],
    },
  };
}
export const POST = withApiAudit('/api/ai/generate-site', _POST);
