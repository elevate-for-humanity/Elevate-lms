import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const aiNarrator = {
  scriptFile: 'content/homepage/ai-narrator-script.md',
  videoUrl: '', // Set when AI-generated video is ready
  title: 'AI Instructor Overview',
  description: 'AI-narrated overview of ' + PLATFORM_DEFAULTS.orgName + ' workforce programs and funding.',
};

export default aiNarrator;
