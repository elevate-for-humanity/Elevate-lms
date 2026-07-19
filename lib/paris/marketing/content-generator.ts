/**
 * PARIS Marketing Studio - Content Generator
 * AI-powered content creation for multiple platforms
 */

import { createClient } from '@supabase/supabase-js';
import {
  PLATFORM_LIMITS,
  PLATFORM_BEST_PRACTICES,
  CONTENT_TEMPLATES,
} from './types';
import type {
  BrandGuidelines,
  ContentTemplate,
  GeneratedContent,
  SocialPlatform,
  ContentType,
} from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Platform limits and best practices imported from types
const platformLimits: Record<SocialPlatform, { characters: number; hashtags: number; images: number }> = {
  facebook: { characters: 63206, hashtags: 30, images: 10 },
  instagram: { characters: 2200, hashtags: 30, images: 10 },
  linkedin: { characters: 3000, hashtags: 30, images: 9 },
  twitter: { characters: 280, hashtags: 10, images: 4 },
  tiktok: { characters: 2200, hashtags: 100, images: 1 },
  youtube: { characters: 5000, hashtags: 15, images: 1 },
  pinterest: { characters: 500, hashtags: 20, images: 5 },
  threads: { characters: 500, hashtags: 10, images: 10 },
};

/**
 * Get brand guidelines from database
 */
export async function getBrandGuidelines(orgId: string): Promise<BrandGuidelines | null> {
  const { data, error } = await supabase
    .from('brand_guidelines')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error || !data) {
    // Return default Elevate guidelines
    return getDefaultGuidelines();
  }

  return data as BrandGuidelines;
}

/**
 * Get default Elevate brand guidelines
 */
function getDefaultGuidelines(): BrandGuidelines {
  return {
    id: 'default',
    name: 'Elevate for Humanity',
    colors: {
      primary: '#DC2626', // brand-red-600
      secondary: '#1E3A5F', // brand-blue-800
      accent: '#F59E0B', // amber-500
      text: '#1F2937', // slate-800
      background: '#FFFFFF',
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    tagline: 'From where you are to where you want to be.',
    voice: {
      tone: 'professional',
      values: [
        'Empowering',
        'Supportive',
        'Inclusive',
        'Transformative',
        'Career-focused',
      ],
      examples: [
        'Your success is our mission.',
        'Career training that changes lives.',
        'Funding available for eligible participants.',
      ],
    },
    hashtags: [
      '#ElevateForHumanity',
      '#WorkforceDevelopment',
      '#CareerTraining',
      '#WIOA',
      '#CareerChange',
      '#NoCostTraining',
    ],
    mentions: [
      '@elevateforhumanity',
      '@WorkOneIndy',
    ],
    cta: 'Apply Now',
  };
}

/**
 * Generate content using AI
 */
export async function generateContent(
  templateId: string,
  variables: Record<string, string>,
  options?: {
    platforms?: SocialPlatform[];
    tone?: 'professional' | 'friendly' | 'urgent' | 'inspirational';
    includeVariations?: boolean;
    orgId?: string;
  }
): Promise<GeneratedContent[]> {
  // Get template
  const template = CONTENT_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Get brand guidelines
  const guidelines = options?.orgId 
    ? await getBrandGuidelines(options.orgId)
    : getDefaultGuidelines();

  // Generate content for each platform
  const platforms = options?.platforms || template.platform || ['facebook'];
  const contents: GeneratedContent[] = [];

  for (const platform of platforms) {
    const content = await generateForPlatform(template, variables, platform, guidelines, options?.tone);
    contents.push(content);

    // Generate variations if requested
    if (options?.includeVariations) {
      const variations = await generateVariations(content, platform, guidelines);
      contents.push(...variations);
    }
  }

  // Save to database
  await saveGeneratedContent(contents);

  return contents;
}

/**
 * Generate content for a specific platform
 */
async function generateForPlatform(
  template: ContentTemplate,
  variables: Record<string, string>,
  platform: SocialPlatform,
  guidelines: BrandGuidelines,
  tone?: string
): Promise<GeneratedContent> {
  const limits = platformLimits[platform];

  // Build prompt with variables
  let prompt = template.prompt;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  // Add tone instruction
  if (tone) {
    prompt += `\n\nTone: ${tone}`;
  }

  // Add brand voice
  prompt += `\n\nBrand voice: ${guidelines.voice.tone}`;
  prompt += `\nBrand values: ${guidelines.voice.values.join(', ')}`;

  // Generate content (would call AI model here)
  // For now, generate template-based content
  const text = generateFromTemplate(template, variables, platform, guidelines);
  
  // Ensure character limit
  const truncatedText = truncateToLimit(text, limits.characters, platform);

  // Generate hashtags
  const hashtags = generateHashtags(variables, platform, guidelines);

  // Build content object
  const content: GeneratedContent = {
    id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: template.type,
    platform: [platform],
    text: truncatedText,
    hashtags: hashtags.slice(0, limits.hashtags),
    best_practice_tips: template.engagement_tips,
    word_count: truncatedText.split(/\s+/).length,
    reading_time: Math.ceil(truncatedText.split(/\s+/).length / 200),
  };

  return content;
}

/**
 * Generate content from template
 */
function generateFromTemplate(
  template: ContentTemplate,
  variables: Record<string, string>,
  platform: SocialPlatform,
  guidelines: BrandGuidelines
): string {
  // Use example if available
  if (template.examples.length > 0) {
    let text = template.examples[0];
    
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    
    // Add brand elements
    text = applyBrandElements(text, guidelines);
    
    return text;
  }

  // Fallback: generate simple text
  return generateSimpleContent(template, variables, guidelines);
}

/**
 * Generate simple content
 */
function generateSimpleContent(
  template: ContentTemplate,
  variables: Record<string, string>,
  guidelines: BrandGuidelines
): string {
  const lines: string[] = [];

  // Title/Headline
  if (variables.title || variables.name) {
    lines.push(`📢 ${(variables.title || variables.name).toUpperCase()}`);
    lines.push('');
  }

  // Main content
  if (variables.description) {
    lines.push(variables.description);
    lines.push('');
  }

  // Benefits
  if (variables.benefits) {
    lines.push('✨ Key Benefits:');
    lines.push(variables.benefits);
    lines.push('');
  }

  // CTA
  lines.push(`👉 ${guidelines.cta}`);
  lines.push('');

  // Primary hashtag
  lines.push(guidelines.hashtags[0]);

  return lines.join('\n');
}

/**
 * Apply brand elements to content
 */
function applyBrandElements(text: string, guidelines: BrandGuidelines): string {
  let result = text;

  // Replace placeholder CTAs
  if (!result.includes(guidelines.cta)) {
    result += `\n\n👉 ${guidelines.cta}`;
  }

  return result;
}

/**
 * Generate hashtags for platform
 */
function generateHashtags(
  variables: Record<string, string>,
  platform: SocialPlatform,
  guidelines: BrandGuidelines
): string[] {
  const hashtags: string[] = [...guidelines.hashtags];

  // Add program-specific hashtag
  if (variables.program) {
    const programHashtag = `#${variables.program.replace(/\s+/g, '')}`;
    if (!hashtags.includes(programHashtag)) {
      hashtags.push(programHashtag);
    }
  }

  // Add industry hashtag
  if (variables.industry) {
    const industryHashtag = `#${variables.industry.replace(/\s+/g, '')}`;
    if (!hashtags.includes(industryHashtag)) {
      hashtags.push(industryHashtag);
    }
  }

  // Platform-specific hashtags
  const platformHashtags: Record<SocialPlatform, string[]> = {
    facebook: ['#Facebook', '#SocialMedia', '#Community'],
    instagram: ['#InstaGood', '#InstaDaily', '#Explore'],
    linkedin: ['#LinkedIn', '#Professional', '#Networking'],
    twitter: ['#Twitter', '#Trending'],
    tiktok: ['#TikTok', '#FYP', '#Viral'],
    youtube: ['#YouTube', '#Subscribe'],
    pinterest: ['#Pinterest', '#PinIt'],
    threads: ['#Threads', '#Meta'],
  };

  hashtags.push(...(platformHashtags[platform] || []).slice(0, 2));

  return [...new Set(hashtags)];
}

/**
 * Truncate text to platform character limit
 */
function truncateToLimit(text: string, limit: number, platform: SocialPlatform): string {
  if (text.length <= limit) {
    return text;
  }

  // For Twitter, be more careful with truncation
  if (platform === 'twitter') {
    // Leave room for hashtags
    const hashtagSpace = 30;
    const effectiveLimit = limit - hashtagSpace;
    let truncated = text.substring(0, effectiveLimit - 3);
    
    // Try to end on a complete sentence
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    const lastBreak = Math.max(lastPeriod, lastNewline);
    
    if (lastBreak > effectiveLimit * 0.5) {
      truncated = truncated.substring(0, lastBreak + 1);
    } else {
      truncated = truncated.trimEnd() + '...';
    }
    
    return truncated;
  }

  // For other platforms, just truncate cleanly
  return text.substring(0, limit - 3) + '...';
}

/**
 * Generate content variations
 */
async function generateVariations(
  original: GeneratedContent,
  platform: SocialPlatform,
  guidelines: BrandGuidelines
): Promise<GeneratedContent[]> {
  const variations: GeneratedContent[] = [];

  // Short version
  const shortVersion: GeneratedContent = {
    ...original,
    id: `${original.id}_short`,
    text: shortenContent(original.text, platform),
    variations: [],
  };
  variations.push(shortVersion);

  // With emoji
  const withEmoji: GeneratedContent = {
    ...original,
    id: `${original.id}_emoji`,
    text: addEmoji(original.text),
    hashtags: original.hashtags.map(h => `✨ ${h}`),
    variations: [],
  };
  variations.push(withEmoji);

  // Question format
  const questionFormat: GeneratedContent = {
    ...original,
    id: `${original.id}_question`,
    text: convertToQuestion(original.text),
    hashtags: [...original.hashtags, '#Question'],
    variations: [],
  };
  variations.push(questionFormat);

  return variations;
}

/**
 * Shorten content for platform
 */
function shortenContent(text: string, platform: SocialPlatform): string {
  const limits: Record<SocialPlatform, number> = {
    twitter: 140,
    instagram: 300,
    linkedin: 500,
    facebook: 500,
    tiktok: 300,
    youtube: 300,
    pinterest: 200,
    threads: 200,
  };

  const limit = limits[platform] || 500;

  if (text.length <= limit) {
    return text;
  }

  // Extract first paragraph
  const firstPara = text.split('\n\n')[0];
  if (firstPara.length <= limit) {
    return firstPara + '\n\n👉 [Link in bio]';
  }

  // Truncate first paragraph
  return firstPara.substring(0, limit - 3) + '...';
}

/**
 * Add emoji to content
 */
function addEmoji(text: string): string {
  const emojiMap: Record<string, string[]> = {
    '🚀': ['launch', 'new', 'start', 'announce'],
    '✨': ['success', 'achievement', 'great'],
    '📢': ['announce', 'news', 'update'],
    '💰': ['funding', 'money', 'cost', 'scholarship'],
    '🎓': ['graduation', 'graduate', 'education', 'training'],
    '📅': ['date', 'event', 'calendar'],
    '🏢': ['employer', 'company', 'business'],
    '💪': ['career', 'strength', 'support'],
    '👉': ['link', 'cta', 'action', 'apply'],
  };

  let result = text;

  for (const [emoji, keywords] of Object.entries(emojiMap)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(result) && !result.includes(emoji)) {
        result = result.replace(regex, `${emoji} $&`);
        break;
      }
    }
  }

  return result;
}

/**
 * Convert content to question format
 */
function convertToQuestion(text: string): string {
  const lines = text.split('\n');
  
  // Try to convert the first statement to a question
  if (lines.length > 0) {
    let firstLine = lines[0].trim();
    
    // Remove emoji
    firstLine = firstLine.replace(/[^\w\s]/g, '').trim();
    
    // Convert to question
    if (!firstLine.endsWith('?')) {
      lines[0] = `❓ ${firstLine}?\n\nCurious? Here's what you need to know:\n`;
    }
  }

  return lines.join('\n');
}

/**
 * Save generated content to database
 */
async function saveGeneratedContent(contents: GeneratedContent[]): Promise<void> {
  const records = contents.map(content => ({
    id: content.id,
    type: content.type,
    platform: content.platform,
    text: content.text,
    hashtags: content.hashtags,
    word_count: content.word_count,
    created_at: new Date().toISOString(),
  }));

  await supabase.from('generated_content').insert(records);
}

/**
 * Get content ideas based on brand and trends
 */
export async function getContentIdeas(
  options?: {
    count?: number;
    platforms?: SocialPlatform[];
    topics?: string[];
    orgId?: string;
  }
): Promise<{ template: ContentTemplate; suggested_variables: Record<string, string> }[]> {
  const count = options?.count || 5;
  const topics = options?.topics || ['programs', 'success stories', 'funding', 'events'];

  const ideas: { template: ContentTemplate; suggested_variables: Record<string, string> }[] = [];

  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const template = CONTENT_TEMPLATES.find(t => 
      t.name.toLowerCase().includes(topic.toLowerCase()) ||
      t.description.toLowerCase().includes(topic.toLowerCase())
    ) || CONTENT_TEMPLATES[Math.floor(Math.random() * CONTENT_TEMPLATES.length)];

    // Generate suggested variables based on template
    const suggested_variables = generateSuggestedVariables(template);

    ideas.push({ template, suggested_variables });
  }

  return ideas;
}

/**
 * Generate suggested variables for template
 */
function generateSuggestedVariables(template: ContentTemplate): Record<string, string> {
  const suggestions: Record<string, Record<string, string>> = {
    program_announcement: {
      program_name: 'Medical Assistant Training',
      duration: '12 weeks',
      skill_1: 'Patient care',
      skill_2: 'EKG monitoring',
      skill_3: 'Medical billing',
    },
    student_success: {
      student_name: 'Maria',
      before: 'unemployed',
      after: 'working as a Medical Assistant',
      program: 'Healthcare',
      quote: 'This changed my life!',
    },
    funding_reminder: {
      funding_type: 'WIOA',
      eligibility_1: 'unemployed or underemployed',
      eligibility_2: 'Marion County',
      goal: 'start a new career',
      benefits: 'Full tuition coverage + materials',
    },
    weekly_tip: {
      topic: 'Resume Writing',
      audience: 'job seekers',
      tip: 'Use action verbs to describe achievements',
      actionable_step: 'action verb exercise',
    },
  };

  return suggestions[template.id] || {
    title: 'Your content title here',
    description: 'Your content description here',
  };
}

/**
 * Optimize content for platform
 */
export function optimizeForPlatform(
  content: GeneratedContent,
  platform: SocialPlatform
): GeneratedContent {
  const limits = platformLimits[platform];

  return {
    ...content,
    text: truncateToLimit(content.text, limits.characters, platform),
    hashtags: content.hashtags.slice(0, limits.hashtags),
  };
}

/**
 * Generate hashtags from keywords
 */
export function generateHashtagsFromKeywords(
  keywords: string[],
  guidelines: BrandGuidelines,
  platform: SocialPlatform
): string[] {
  const limits = platformLimits[platform];
  const hashtags: string[] = [];

  // Add brand hashtag
  hashtags.push(guidelines.hashtags[0]);

  // Generate from keywords
  for (const keyword of keywords) {
    const hashtag = `#${keyword.replace(/\s+/g, '')}`;
    if (!hashtags.includes(hashtag)) {
      hashtags.push(hashtag);
    }
  }

  return hashtags.slice(0, limits.hashtags);
}
