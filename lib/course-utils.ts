export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCoursePath(
  courseSlug: string,
  moduleSlug: string,
  lessonSlug: string,
): string {
  return `courses/${courseSlug}/modules/${moduleSlug}/${lessonSlug}.html`;
}

export function buildModulePath(courseSlug: string, moduleSlug: string): string {
  return `courses/${courseSlug}/modules/${moduleSlug}`;
}

export function buildCourseMetadataPath(courseSlug: string): string {
  return `courses/${courseSlug}/metadata.json`;
}

export function validateCourseStructure(data: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!course.title) errors.push('Missing course title');
  if (!course.slug) errors.push('Missing course slug');
  if (!Array.isArray(course.modules)) errors.push('Modules must be an array');

  course.modules?.forEach((module: any, index: number) => {
    if (!module.title) errors.push(`Module ${index + 1} missing title`);
    if (!module.slug) errors.push(`Module ${index + 1} missing slug`);
    if (!Array.isArray(module.lessons)) {
      errors.push(`Module ${index + 1} lessons must be an array`);
    }
  });

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function extractCourseSlugFromPath(path: string): string | null {
  const match = path.match(/^courses\/([^/]+)/);
  return match ? match[1] : null;
}

export function extractModuleSlugFromPath(path: string): string | null {
  const match = path.match(/^courses\/[^/]+\/modules\/([^/]+)/);
  return match ? match[1] : null;
}

export function isCourseFile(path: string): boolean {
  return path.startsWith('courses/');
}

export function isMetadataFile(path: string): boolean {
  return path.endsWith('metadata.json');
}

export function isLessonFile(path: string): boolean {
  return path.endsWith('.html') || path.endsWith('.md');
}
