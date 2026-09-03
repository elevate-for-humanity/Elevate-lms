/**
 * PARIS Marketing Studio - Video & Reel Creator
 * AI-powered video script generation and short-form content creation
 */

import type { VideoScript, VideoScene, BrandGuidelines } from './types';

/**
 * Generate a video script
 */
export async function generateVideoScript(
  topic: string,
  options?: {
    type?: 'reel' | 'tiktok' | 'youtube_short' | 'promo';
    duration?: number; // seconds
    style?: 'educational' | 'inspirational' | 'humorous' | 'informative';
    brandGuidelines?: BrandGuidelines;
    includeVoiceover?: boolean;
  }
): Promise<VideoScript> {
  const type = options?.type || 'reel';
  const duration = options?.duration || getDefaultDuration(type);
  const style = options?.style || 'informative';
  const guidelines = options?.brandGuidelines || getDefaultGuidelines();

  // Generate scenes
  const scenes = generateScenes(topic, duration, style, type);

  // Generate script
  const script: VideoScript = {
    id: `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: generateTitle(topic, type),
    hook: generateHook(topic, style, guidelines),
    scenes,
    cta: guidelines.cta,
    duration,
    hashtags: generateVideoHashtags(topic, type),
  };

  // Generate voiceover if requested
  if (options?.includeVoiceover) {
    script.voiceover = generateVoiceover(script);
  }

  // Add music suggestion
  script.music = suggestMusic(topic, type, style);

  return script;
}

/**
 * Get default duration by type
 */
function getDefaultDuration(type: string): number {
  const durations: Record<string, number> = {
    reel: 30,
    tiktok: 60,
    youtube_short: 60,
    promo: 90,
  };
  return durations[type] || 30;
}

/**
 * Generate scenes for video
 */
function generateScenes(
  topic: string,
  duration: number,
  style: string,
  type: string
): VideoScene[] {
  const scenes: VideoScene[] = [];
  const sceneCount = Math.ceil(duration / 5); // ~5 seconds per scene

  // Hook scene (1-2 seconds)
  scenes.push({
    id: 'scene_1',
    description: 'Eye-catching opening',
    text: 'START WITH A HOOK',
    duration: 2,
    transition: 'cut',
    media: { type: 'graphic' },
  });

  // Content scenes
  for (let i = 2; i <= sceneCount - 1; i++) {
    const sceneDuration = 3 + Math.floor(Math.random() * 3); // 3-6 seconds
    const sceneTypes = ['image', 'text', 'video', 'graphic'];
    
    scenes.push({
      id: `scene_${i}`,
      description: getSceneDescription(topic, i, sceneCount),
      text: getSceneText(topic, i, style),
      duration: sceneDuration,
      transition: getTransition(i),
      media: { type: sceneTypes[i % sceneTypes.length] as 'image' | 'text' | 'video' | 'graphic' },
    });
  }

  // CTA scene (1-2 seconds)
  scenes.push({
    id: `scene_cta`,
    description: 'Call to action',
    text: 'FOLLOW FOR MORE | SWIPE UP',
    duration: 2,
    transition: 'fade',
    media: { type: 'graphic' },
  });

  return scenes;
}

/**
 * Get scene description
 */
function getSceneDescription(topic: string, index: number, total: number): string {
  const descriptions = [
    `Introduce the topic: ${topic}`,
    'Share key insight #1',
    'Show proof or example',
    'Share key insight #2',
    'Address common question',
    'Show result or benefit',
    'Add supporting visual',
    'Build anticipation',
    'Reveal the solution',
  ];

  return descriptions[index % descriptions.length] || `Content scene ${index}`;
}

/**
 * Get scene text overlay
 */
function getSceneText(topic: string, index: number, style: string): string | undefined {
  const texts: Record<string, string[]> = {
    educational: [
      'Did you know...',
      'Here\'s the truth...',
      'Step 1:',
      'Step 2:',
      'Step 3:',
      'Key takeaway:',
      'Remember this...',
    ],
    inspirational: [
      'Your journey starts here',
      'Believe in yourself',
      'You can do this',
      'Success awaits',
      'Keep pushing forward',
      'Dream big',
      'You\'re closer than you think',
    ],
    humorous: [
      'POV:',
      'When you finally...',
      'Plot twist:',
      'Nobody:',
      'Me:',
      'Reality check:',
      'Fair warning:',
    ],
    informative: [
      `${topic}: Explained`,
      'The facts:',
      'What you need to know:',
      'Quick breakdown:',
      'Here\'s how it works:',
      'The result:',
      'Bottom line:',
    ],
  };

  const styleTexts = texts[style] || texts.informative;
  return styleTexts[index % styleTexts.length];
}

/**
 * Get transition effect
 */
function getTransition(index: number): VideoScene['transition'] {
  const transitions: VideoScene['transition'][] = ['cut', 'fade', 'slide', 'zoom'];
  return transitions[index % transitions.length];
}

/**
 * Generate video title
 */
function generateTitle(topic: string, type: string): string {
  const prefixes: Record<string, string[]> = {
    reel: ['🚀', '💡', '📢'],
    tiktok: ['Wait for it...', 'POV:', 'This changed everything'],
    youtube_short: ['How to', 'Why', 'The secret to'],
    promo: ['Introducing', 'Discover', 'Learn about'],
  };

  const prefix = prefixes[type]?.[Math.floor(Math.random() * prefixes[type].length)] || '';
  return `${prefix} ${topic}`.trim();
}

/**
 * Generate hook
 */
function generateHook(
  topic: string,
  style: string,
  guidelines: BrandGuidelines
): string {
  const hooks: Record<string, string[]> = {
    educational: [
      `Everything you need to know about ${topic}`,
      `The truth about ${topic} nobody tells you`,
      `Here's why ${topic} matters`,
    ],
    inspirational: [
      `Your ${topic} journey starts today`,
      `Transform your ${topic} with these tips`,
      `Ready to master ${topic}?`,
    ],
    humorous: [
      `${topic} but make it funny`,
      `POV: You're learning ${topic}`,
      `${topic} is not what you think`,
    ],
    informative: [
      `${topic}: The complete guide`,
      `What is ${topic} and why it matters`,
      `Quick guide to ${topic}`,
    ],
  };

  const styleHooks = hooks[style] || hooks.informative;
  return styleHooks[Math.floor(Math.random() * styleHooks.length)];
}

/**
 * Generate voiceover script
 */
function generateVoiceover(script: VideoScript): string {
  const lines: string[] = [];

  // Hook voiceover
  lines.push(script.hook);

  // Scene voiceovers
  for (const scene of script.scenes) {
    if (scene.text && scene.id !== 'scene_cta') {
      lines.push(scene.text);
    }
  }

  // CTA
  lines.push(`For more information, visit our link in bio. ${script.cta}`);

  return lines.join('. ');
}

/**
 * Suggest music
 */
function suggestMusic(topic: string, type: string, style: string): string {
  const moods: Record<string, string[]> = {
    educational: ['Upbeat Uplifting', 'Corporate Motivational', 'Inspiring Light'],
    inspirational: ['Epic Emotional', 'Inspiring Piano', 'Motivational Pop'],
    humorous: ['Comedy Quirky', 'Playful Bounce', 'Fun Upbeat'],
    informative: ['Corporate Technology', 'Clean Minimal', 'News Style'],
  };

  const styleMoods = moods[style] || moods.informative;
  const music = styleMoods[Math.floor(Math.random() * styleMoods.length)];

  // Add trending sound if applicable
  if (type === 'tiktok' || type === 'reel') {
    return `${music} (Trending on TikTok)`;
  }

  return music;
}

/**
 * Generate video hashtags
 */
function generateVideoHashtags(topic: string, type: string): string[] {
  const baseHashtags = [
    '#ElevateForHumanity',
    '#CareerDevelopment',
  ];

  const typeHashtags: Record<string, string[]> = {
    reel: ['#Reels', '#InstagramReels', '#Viral', '#Trending'],
    tiktok: ['#TikTok', '#FYP', '#ForYou', '#Viral'],
    youtube_short: ['#Shorts', '#YouTubeShorts', '#YouTube'],
    promo: ['#Promo', '#Discover', '#LearnMore'],
  };

  const topicTag = `#${topic.replace(/\s+/g, '')}`;

  return [
    ...baseHashtags,
    ...(typeHashtags[type] || []),
    topicTag,
  ].slice(0, 10);
}

/**
 * Generate thumbnail ideas
 */
export function generateThumbnailIdeas(
  script: VideoScript
): { description: string; text: string; style: string }[] {
  return [
    {
      description: 'Bold headline thumbnail',
      text: script.title,
      style: 'Bold text on gradient background with topic imagery',
    },
    {
      description: 'Face camera with text overlay',
      text: script.hook,
      style: 'Person pointing at text with excitement',
    },
    {
      description: 'Before/after comparison',
      text: 'The Transformation',
      style: 'Split screen showing change',
    },
    {
      description: 'Question format',
      text: 'Are you doing this wrong?',
      style: 'Curious expression with bold text',
    },
  ];
}

/**
 * Create story/storyboard from script
 */
export function createStoryboard(
  script: VideoScript,
  options?: {
    includeNotes?: boolean;
    frameAspectRatio?: string;
  }
): {
  frames: {
    scene: VideoScene;
    frameNumber: number;
    timing: string;
    notes: string;
  }[];
  totalDuration: number;
} {
  const frames: {
    scene: VideoScene;
    frameNumber: number;
    timing: string;
    notes: string;
  }[] = [];

  let currentTime = 0;

  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const endTime = currentTime + scene.duration;

    frames.push({
      scene,
      frameNumber: i + 1,
      timing: `${formatTime(currentTime)} - ${formatTime(endTime)}`,
      notes: options?.includeNotes ? generateFrameNotes(scene) : '',
    });

    currentTime = endTime;
  }

  return {
    frames,
    totalDuration: currentTime,
  };
}

/**
 * Format time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate frame notes
 */
function generateFrameNotes(scene: VideoScene): string {
  const notes: string[] = [];

  notes.push(`Duration: ${scene.duration}s`);
  
  if (scene.media) {
    notes.push(`Media type: ${scene.media.type}`);
  }

  if (scene.transition) {
    notes.push(`Transition: ${scene.transition}`);
  }

  if (scene.text) {
    notes.push(`Text overlay: "${scene.text}"`);
  }

  return notes.join(' | ');
}

/**
 * Adapt script for different platforms
 */
export function adaptScriptForPlatform(
  script: VideoScript,
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook'
): VideoScript {
  const adaptations: Record<string, Partial<VideoScript>> = {
    instagram: {
      duration: 30,
      hook: `${script.hook} (swipe for more)`,
      cta: 'Save this | Share with someone who needs this',
    },
    tiktok: {
      duration: 60,
      hook: `${script.hook} #fyp #foryou`,
      cta: 'Follow for more | Duet this',
    },
    youtube: {
      duration: 60,
      hook: `In this short: ${script.hook}`,
      cta: 'Subscribe for more shorts',
    },
    facebook: {
      duration: 90,
      hook: script.hook,
      cta: 'Learn more in the comments',
    },
  };

  return {
    ...script,
    ...adaptations[platform],
  };
}

/**
 * Generate captions with timing
 */
export function generateCaptionWithTiming(
  script: VideoScript
): {
  text: string;
  start: number;
  end: number;
  style: 'on_screen' | 'voiceover' | 'caption';
}[] {
  const captions: {
    text: string;
    start: number;
    end: number;
    style: 'on_screen' | 'voiceover' | 'caption';
  }[] = [];

  let currentTime = 0;

  for (const scene of script.scenes) {
    if (scene.text) {
      captions.push({
        text: scene.text,
        start: currentTime,
        end: currentTime + scene.duration,
        style: scene.id === 'scene_cta' ? 'on_screen' : 'caption',
      });
    }
    currentTime += scene.duration;
  }

  return captions;
}

/**
 * Get default brand guidelines
 */
function getDefaultGuidelines(): BrandGuidelines {
  return {
    id: 'default',
    name: 'Elevate for Humanity',
    colors: {
      primary: '#DC2626',
      secondary: '#1E3A5F',
      accent: '#F59E0B',
      text: '#1F2937',
      background: '#FFFFFF',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    voice: {
      tone: 'professional',
      values: ['Empowering', 'Supportive', 'Inclusive'],
      examples: ['Your success is our mission'],
    },
    hashtags: ['#ElevateForHumanity', '#CareerTraining'],
    mentions: ['@elevateforhumanity'],
    cta: 'Apply Now',
  };
}

/**
 * Batch generate video scripts
 */
export async function batchGenerateScripts(
  topics: string[],
  options?: {
    type?: 'reel' | 'tiktok';
    countPerTopic?: number;
  }
): Promise<VideoScript[]> {
  const scripts: VideoScript[] = [];
  const count = options?.countPerTopic || 2;

  for (const topic of topics) {
    for (let i = 0; i < count; i++) {
      const script = await generateVideoScript(topic, {
        type: options?.type || (i % 2 === 0 ? 'reel' : 'tiktok'),
        style: i % 2 === 0 ? 'informative' : 'inspirational',
      });
      scripts.push(script);
    }
  }

  return scripts;
}
