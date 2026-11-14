// Centralized path constants for the application

export const COURSE_ROOT = 'courses';
export const UPLOAD_ROOT = 'uploads';
export const MODULE_FOLDER = 'modules';
export const MEDIA_FOLDER = 'media';
export const ASSETS_FOLDER = 'assets';

export const METADATA_FILE = 'metadata.json';
export const README_FILE = 'README.md';

export function getCoursePath(slug: string): string {
  return `${COURSE_ROOT}/${slug}`;
}

export function getModulePath(courseSlug: string, moduleSlug: string): string {
  return `${COURSE_ROOT}/${courseSlug}/${MODULE_FOLDER}/${moduleSlug}`;
}

export function getLessonPath(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  extension = 'html',
): string {
  return `${COURSE_ROOT}/${courseSlug}/${MODULE_FOLDER}/${moduleSlug}/${lessonSlug}.${extension}`;
}

export function getMetadataPath(courseSlug: string): string {
  return `${COURSE_ROOT}/${courseSlug}/${METADATA_FILE}`;
}

export function getReadmePath(courseSlug: string): string {
  return `${COURSE_ROOT}/${courseSlug}/${README_FILE}`;
}

export function getUploadPath(filename: string): string {
  return `${UPLOAD_ROOT}/${filename}`;
}

export function getMediaPath(filename: string): string {
  return `${MEDIA_FOLDER}/${filename}`;
}
