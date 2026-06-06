import {
  closestDalle3Size,
  COURSE_COVER,
  MEDIA_SLOTS,
  PROGRAM_CARD,
  PROGRAM_HERO_SOURCE,
} from '@/lib/images/media-dimensions';
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
    prompt: `Professional hero banner for workforce training course "${courseName}"${categoryHint}. Target export ${COURSE_COVER.width}×${COURSE_COVER.height} WebP, 16:9. Diverse students, modern training environment. No text overlays.`,
    size: closestDalle3Size(COURSE_COVER),
    style: 'natural',
  });
}

/** Generate a lesson thumbnail */
export async function generateLessonThumbnail(
  lessonTitle: string,
  courseCategory?: string,
): Promise<GeneratedImage[]> {
  const thumb = MEDIA_SLOTS.lmsCourseThumbnail.desktop;
  return aiGenerateImage({
    prompt: `LMS course thumbnail for "${lessonTitle}". ${courseCategory || 'Workforce development'}. Target ${thumb.width}×${thumb.height} WebP, 16:9. No text.`,
    size: closestDalle3Size(thumb),
    style: 'natural',
  });
}

/** Generate a certificate background */
export async function generateCertificateBackground(
  programName: string,
): Promise<GeneratedImage[]> {
  const cert = MEDIA_SLOTS.certificateBackground.desktop;
  return aiGenerateImage({
    prompt: `Certificate background for "${programName}". Target ${cert.width}×${cert.height} landscape print. Formal borders, leave center blank. No text.`,
    size: closestDalle3Size(cert),
    style: 'vivid',
  });
}

/** Program grid card — 1200×900 (4:3) */
export async function generateProgramCardImage(
  programTitle: string,
  sector?: string,
): Promise<GeneratedImage[]> {
  const sectorHint = sector ? ` ${sector} workforce training` : '';
  return aiGenerateImage({
    prompt: `Program card image for "${programTitle}"${sectorHint}. Target ${PROGRAM_CARD.width}×${PROGRAM_CARD.height} WebP, 4:3. Real training scene, no text overlays.`,
    size: closestDalle3Size(PROGRAM_CARD),
    style: 'natural',
  });
}

/** Marketing/program page hero — source 2560×1440 */
export async function generateProgramHeroImage(
  programTitle: string,
  sector?: string,
): Promise<GeneratedImage[]> {
  const sectorHint = sector ? ` ${sector}` : '';
  return aiGenerateImage({
    prompt: `Hero banner for "${programTitle}"${sectorHint} workforce program. Target ${PROGRAM_HERO_SOURCE.width}×${PROGRAM_HERO_SOURCE.height} WebP, 16:9. No text on image.`,
    size: closestDalle3Size(PROGRAM_HERO_SOURCE),
    style: 'natural',
  });
}
