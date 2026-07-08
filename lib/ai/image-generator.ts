import { aiGenerateImage } from './ai-service';
import type { GeneratedImage } from './types';

/**
 * High-level image generation helpers for course design.
 * Uses the configured AI_IMAGE_PROVIDER (DALL-E, Stability AI, or Azure).
 */

/** Generate a course hero/banner image */
export async function generateCourseHero(
  courseName: string,
  category?: string,
): Promise<GeneratedImage[]> {
  const categoryHint = category ? ` in the ${category} field` : '';
  return aiGenerateImage({
    prompt: `Professional, photorealistic hero banner for a workforce training course titled "${courseName}"${categoryHint}. Show diverse students in a modern training environment. Clean, well-lit, corporate training aesthetic. No text overlays.`,
    size: '1792x1024',
    style: 'natural',
  });
}

/** Generate a lesson thumbnail */
export async function generateLessonThumbnail(
  lessonTitle: string,
  courseCategory?: string,
): Promise<GeneratedImage[]> {
  return aiGenerateImage({
    prompt: `Clean, professional thumbnail for a training lesson: "${lessonTitle}". ${courseCategory || 'Workforce development'} context. Modern, minimal style with relevant visual elements. No text.`,
    size: '1024x1024',
    style: 'natural',
  });
}

/** Generate a certificate background */
export async function generateCertificateBackground(
  programName: string,
): Promise<GeneratedImage[]> {
  return aiGenerateImage({
    prompt: `Elegant certificate background for "${programName}" completion. Professional, formal design with subtle decorative borders. Gold and navy color scheme. Leave center blank for text. No text or words.`,
    size: '1792x1024',
    style: 'vivid',
  });
}
