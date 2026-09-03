/**
 * PARIS Marketing Studio - Type Definitions
 * AI-powered content generation and social media management
 */

// Platform Types
export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'threads';

export type ContentType =
  | 'post'
  | 'story'
  | 'reel'
  | 'video'
  | 'article'
  | 'newsletter'
  | 'email'
  | 'sms'
  | 'blog';

// Content Status
export type ContentStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'archived';

// Brand Guidelines
export interface BrandGuidelines {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo?: string;
  tagline?: string;
  voice: {
    tone: 'professional' | 'friendly' | 'casual' | 'formal';
    values: string[];
    examples: string[];
  };
  hashtags: string[];
  mentions: string[];
  cta: string;
}

// Content Template
export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: ContentType;
  platform?: SocialPlatform[];
  prompt: string;
  variables: string[];
  examples: string[];
  engagement_tips?: string[];
}

// Generated Content
export interface GeneratedContent {
  id: string;
  type: ContentType;
  platform: SocialPlatform[];
  text: string;
  hashtags: string[];
  media?: ContentMedia[];
  meta?: {
    title?: string;
    description?: string;
    link?: string;
    cta?: string;
  };
  variations?: string[];
  best_practice_tips?: string[];
  word_count: number;
  reading_time?: number;
}

// Content Media
export interface ContentMedia {
  type: 'image' | 'video' | 'gif';
  url: string;
  alt?: string;
  caption?: string;
  duration?: number; // for video
}

// Scheduled Post
export interface ScheduledPost {
  id: string;
  contentId: string;
  platform: SocialPlatform;
  scheduledFor: string;
  status: ContentStatus;
  publishedAt?: string;
  publishedUrl?: string;
  metrics?: PostMetrics;
}

// Post Metrics
export interface PostMetrics {
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  engagement_rate?: number;
}

// Campaign
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  goals: CampaignGoal[];
  budget?: number;
  status: 'draft' | 'active' | 'completed' | 'paused';
  posts: string[]; // Post IDs
  metrics?: CampaignMetrics;
}

export interface CampaignGoal {
  type: 'awareness' | 'engagement' | 'traffic' | 'leads' | 'sales';
  metric: string;
  target: number;
  current?: number;
}

export interface CampaignMetrics {
  totalPosts: number;
  totalImpressions: number;
  totalEngagement: number;
  averageEngagementRate: number;
  leads?: number;
  conversions?: number;
}

// Content Calendar
export interface CalendarEntry {
  id: string;
  date: string;
  platform: SocialPlatform;
  contentId?: string;
  contentType: ContentType;
  status: ContentStatus;
  notes?: string;
}

// Video/Reel Generation
export interface VideoScript {
  id: string;
  title: string;
  hook: string;
  scenes: VideoScene[];
  cta: string;
  duration: number; // seconds
  voiceover?: string;
  music?: string;
  hashtags: string[];
}

export interface VideoScene {
  id: string;
  description: string;
  text?: string;
  duration: number;
  transition?: 'cut' | 'fade' | 'slide' | 'zoom';
  media?: {
    type: 'image' | 'video' | 'text' | 'graphic';
    source?: string;
  };
}

// Newsletter
export interface Newsletter {
  id: string;
  subject: string;
  preview: string;
  sections: NewsletterSection[];
  footer?: string;
  status: ContentStatus;
  scheduledFor?: string;
  sentAt?: string;
  metrics?: {
    sent: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
  };
}

export interface NewsletterSection {
  type: 'header' | 'featured' | 'article' | 'testimonial' | 'cta' | 'divider';
  content: string;
  image?: string;
  link?: string;
  linkText?: string;
}

// Email Campaign
export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  template: string;
  segments: string[]; // audience segments
  status: ContentStatus;
  scheduledFor?: string;
  sentAt?: string;
  metrics?: EmailMetrics;
}

export interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  conversion_rate?: number;
}

// SMS Campaign
export interface SMSCampaign {
  id: string;
  name: string;
  message: string;
  segments: string[];
  status: ContentStatus;
  scheduledFor?: string;
  sentAt?: string;
  metrics?: {
    sent: number;
    delivered: number;
    failed: number;
    replied: number;
  };
}

// Content Analytics
export interface ContentAnalytics {
  overall: {
    totalContent: number;
    publishedContent: number;
    totalEngagement: number;
    averageEngagementRate: number;
    topPerformingContent: string[];
  };
  byPlatform: Record<SocialPlatform, PlatformAnalytics>;
  byContentType: Record<ContentType, TypeAnalytics>;
  trends: TrendData[];
}

export interface PlatformAnalytics {
  posts: number;
  followers?: number;
  engagement: number;
  reach?: number;
  topContent: string[];
}

export interface TypeAnalytics {
  count: number;
  engagement: number;
  bestPerforming: string;
}

export interface TrendData {
  date: string;
  engagement: number;
  impressions: number;
  followers: number;
}

// Pre-built Templates
export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'program_announcement',
    name: 'Program Announcement',
    description: 'Announce a new or existing program',
    type: 'post',
    platform: ['facebook', 'instagram', 'linkedin', 'twitter'],
    prompt: 'Create an engaging social media post announcing {program_name}. Include key benefits, who it\'s for, and a call to action. Keep it {length} words.',
    variables: ['program_name', 'program_benefits', 'target_audience', 'length', 'cta'],
    examples: [
      '🚀 NEW PROGRAM ALERT: Medical Assistant Training\n\nLaunch your healthcare career in just {duration}! Our comprehensive program covers:\n\n✅ {skill_1}\n✅ {skill_2}\n✅ {skill_3}\n\n💰 Funding available for eligible students\n📍 Indianapolis area\n\nReady to start your journey? Click the link to apply!',
    ],
    engagement_tips: [
      'Use emojis to break up text',
      'Include a clear call-to-action',
      'Add relevant hashtags',
      'Use high-quality imagery',
    ],
  },
  {
    id: 'student_success',
    name: 'Student Success Story',
    description: 'Share a graduate success story',
    type: 'post',
    platform: ['facebook', 'instagram', 'linkedin'],
    prompt: 'Write an inspiring post sharing {student_name}\'s journey from {before} to {after}. Include their challenge, how the program helped, and their achievement.',
    variables: ['student_name', 'program', 'before', 'after', 'achievement', 'quote'],
    examples: [
      '✨ SUCCESS STORY ✨\n\n{sample_name} came to us {before_status}. Today, she\'s {after_status}!\n\n"I never thought I could do this, but the support from Elevate made it possible."\n\n{sample_name} completed our {program} program and is now working at {employer}.\n\nYour success story could be next! 👇',
    ],
    engagement_tips: [
      'Use a photo of the student (with permission)',
      'Include a quote from the student',
      'Show before/after transformation',
      'Tag partner employers',
    ],
  },
  {
    id: 'funding_reminder',
    name: 'Funding Reminder',
    description: 'Remind followers about funding opportunities',
    type: 'post',
    platform: ['facebook', 'instagram', 'linkedin', 'twitter'],
    prompt: 'Create a post reminding people about {funding_type} funding. Explain eligibility, benefits, and how to apply.',
    variables: ['funding_type', 'eligibility', 'benefits', 'deadline', 'how_to_apply'],
    examples: [
      '💰 Did you know you could get {funding_type} for career training?\n\nYou may be eligible if you:\n• Are {eligibility_1}\n• Live in {eligibility_2}\n• Are looking to {goal}\n\n✨ Benefits include:\n{benefits}\n\n⏰ Limited spots available! Apply now through our link.',
    ],
    engagement_tips: [
      'Create urgency with deadlines',
      'List clear eligibility requirements',
      'Include a direct link to apply',
      'Use funding-specific hashtags',
    ],
  },
  {
    id: 'weekly_tip',
    name: 'Weekly Tip',
    description: 'Share a helpful career or industry tip',
    type: 'post',
    platform: ['facebook', 'instagram', 'linkedin', 'twitter'],
    prompt: 'Share a helpful {topic} tip that would benefit {audience}. Make it actionable and easy to implement.',
    variables: ['topic', 'audience', 'tip', 'actionable_step'],
    examples: [
      '💡 PRO TIP: {topic}\n\n{audience}, here\'s something that could help you:\n\n{helpful_tip}\n\nTry this {actionable_step} and let us know how it goes!\n\n#CareerAdvice #ProfessionalDevelopment',
    ],
    engagement_tips: [
      'Make the tip actionable',
      'Use relevant industry hashtags',
      'Encourage comments and shares',
      'Keep it short and scannable',
    ],
  },
  {
    id: 'employer_spotlight',
    name: 'Employer Spotlight',
    description: 'Feature a hiring partner',
    type: 'post',
    platform: ['facebook', 'instagram', 'linkedin'],
    prompt: 'Create an employer spotlight post featuring {employer_name}. Include what they do, why they partner with us, and what positions they\'re hiring for.',
    variables: ['employer_name', 'industry', 'positions', 'why_partner', 'employee_testimonial'],
    examples: [
      '🏢 EMPLOYER SPOTLIGHT: {employer_name}\n\n{employer_description}\n\nWhy they partner with Elevate:\n"{why_partner}"\n\nCurrent Openings:\n{positions}\n\nInterested? Apply through our link and mention {employer_name}!',
    ],
    engagement_tips: [
      'Include company logo',
      'Add employee testimonial if available',
      'List specific job openings',
      'Tag the employer',
    ],
  },
  {
    id: 'event_promotion',
    name: 'Event Promotion',
    description: 'Promote an upcoming event',
    type: 'post',
    platform: ['facebook', 'instagram', 'linkedin', 'twitter'],
    prompt: 'Create an event promotion post for {event_name}. Include date, time, location, what to expect, and registration link.',
    variables: ['event_name', 'date', 'time', 'location', 'what_to_expect', 'registration_link'],
    examples: [
      '📅 MARK YOUR CALENDAR: {event_name}\n\n🗓 {date}\n⏰ {time}\n📍 {location}\n\nWhat to expect:\n{what_to_expect}\n\n🎟️ FREE to attend! Register now: {link}\n\nSee you there!',
    ],
    engagement_tips: [
      'Include event graphic',
      'Create urgency',
      'Add to calendar link',
      'Share multiple times before event',
    ],
  },
  {
    id: 'testimonial_carousel',
    name: 'Testimonial Carousel',
    description: 'Share student testimonials',
    type: 'story',
    platform: ['facebook', 'instagram'],
    prompt: 'Create a carousel of {number} testimonials from {program} students. Each slide should feature a different student quote.',
    variables: ['number', 'program', 'quotes'],
    examples: [
      'Slide 1: {testimonial_1}\nSlide 2: {testimonial_2}\nSlide 3: {testimonial_3}\nFinal slide: CTA to apply',
    ],
    engagement_tips: [
      'Use student photos (with permission)',
      'Vary the testimonials',
      'End with clear CTA',
      'Use consistent branding',
    ],
  },
  {
    id: 'newsletter_header',
    name: 'Newsletter Header',
    description: 'Header section for email newsletters',
    type: 'newsletter',
    prompt: 'Create a warm, welcoming newsletter header. Include the issue date, a brief preview of contents, and set the tone for the newsletter.',
    variables: ['issue_number', 'theme', 'highlights'],
    examples: [
      'Welcome to the {issue_number} edition of the Elevate Newsletter!\n\nThis month, we\'re featuring:\n{highlights}\n\nLet\'s dive in! 🚀',
    ],
  },
  {
    id: 'graduation_announcement',
    name: 'Graduation Announcement',
    description: 'Announce graduation ceremony or new graduates',
    type: 'post',
    platform: ['facebook', 'instagram', 'linkedin'],
    prompt: 'Create an exciting graduation announcement. Celebrate the achievement, mention the programs, and congratulate the graduates.',
    variables: ['graduation_date', 'number_of_graduates', 'programs', 'location', 'honor'],
    examples: [
      '🎓 CONGRATULATIONS CLASS OF {year}!\n\nWe are SO proud of our {number} graduates who completed programs in:\n{programs}\n\nGraduation Ceremony:\n📅 {date}\n📍 {location}\n\nYou did it! We\'re cheering you on! 👏',
    ],
    engagement_tips: [
      'Use graduation imagery',
      'Tag partner employers',
      'Include graduation video if available',
      'Celebrate specific achievements',
    ],
  },
  {
    id: 'industry_news',
    name: 'Industry News Update',
    description: 'Share relevant industry news',
    type: 'post',
    platform: ['facebook', 'linkedin', 'twitter'],
    prompt: 'Share an industry news update about {topic}. Provide context for {audience} and explain why it matters.',
    variables: ['topic', 'audience', 'news_summary', 'why_matters', 'source'],
    examples: [
      '📰 INDUSTRY UPDATE: {topic}\n\n{news_summary}\n\nWhy this matters for {audience}:\n{why_matters}\n\nSource: {source}\n\nWhat do you think? Share your thoughts below! 👇',
    ],
    engagement_tips: [
      'Add your organization\'s perspective',
      'Include source link',
      'Ask a question to drive engagement',
      'Use relevant industry hashtags',
    ],
  },
];

// Platform-specific character limits
export const PLATFORM_LIMITS: Record<SocialPlatform, { characters: number; hashtags: number; images: number }> = {
  facebook: { characters: 63206, hashtags: 30, images: 10 },
  instagram: { characters: 2200, hashtags: 30, images: 10 },
  linkedin: { characters: 3000, hashtags: 30, images: 9 },
  twitter: { characters: 280, hashtags: 10, images: 4 },
  tiktok: { characters: 2200, hashtags: 100, images: 1 },
  youtube: { characters: 5000, hashtags: 15, images: 1 },
  pinterest: { characters: 500, hashtags: 20, images: 5 },
  threads: { characters: 500, hashtags: 10, images: 10 },
};

// Platform best practices
export const PLATFORM_BEST_PRACTICES: Record<SocialPlatform, {
  optimal_posting_times: string[];
  image_ratio: string;
  video_duration?: { min: number; max: number };
  hashtag_strategy: string;
  cta_style: string;
}> = {
  facebook: {
    optimal_posting_times: ['9am-11am', '1pm-3pm'],
    image_ratio: '1200x630',
    hashtag_strategy: 'Use 3-5 relevant hashtags',
    cta_style: 'Ask a question or invite comments',
  },
  instagram: {
    optimal_posting_times: ['11am-1pm', '7pm-9pm'],
    image_ratio: '1080x1080',
    video_duration: { min: 3, max: 60 },
    hashtag_strategy: 'Use 8-15 hashtags, mix popular and niche',
    cta_style: 'Double-tap if you agree, save for later',
  },
  linkedin: {
    optimal_posting_times: ['8am-10am', '12pm-1pm', '5pm-6pm'],
    image_ratio: '1200x627',
    hashtag_strategy: 'Use 3-5 professional hashtags',
    cta_style: 'Ask for professional opinions, invite shares',
  },
  twitter: {
    optimal_posting_times: ['8am-10am', '12pm-1pm', '5pm-6pm'],
    image_ratio: '1200x675',
    hashtag_strategy: 'Use 1-2 hashtags, include in text naturally',
    cta_style: 'Keep CTAs short and punchy',
  },
  tiktok: {
    optimal_posting_times: ['7am-9am', '12pm-1pm', '7pm-9pm'],
    image_ratio: '9:16',
    video_duration: { min: 15, max: 180 },
    hashtag_strategy: 'Use trending sounds and hashtags',
    cta_style: 'Follow for more, duet/stitch',
  },
  youtube: {
    optimal_posting_times: ['12pm-4pm', '6pm-8pm'],
    image_ratio: '16:9',
    video_duration: { min: 60, max: 600 },
    hashtag_strategy: 'Use 3-5 hashtags in description',
    cta_style: 'Subscribe, like, comment, watch next',
  },
  pinterest: {
    optimal_posting_times: ['8pm-11pm', '2am-4am'],
    image_ratio: '2:3',
    hashtag_strategy: 'Use 2-5 descriptive hashtags',
    cta_style: 'Save for later, visit website',
  },
  threads: {
    optimal_posting_times: ['10am-12pm'],
    image_ratio: '1200x628',
    hashtag_strategy: 'Use 3-5 hashtags',
    cta_style: 'Join the conversation, share your thoughts',
  },
};
