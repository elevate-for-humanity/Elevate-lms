export function normalizeCourseMetadata(metadata: Record<string, any>) {
  const clean = { ...metadata };

  // Ensure required fields
  if (!clean.title) clean.title = 'Untitled Course';
  if (!clean.summary) clean.summary = '';
  if (!clean.description) clean.description = '';
  if (!clean.objectives) clean.objectives = [];
  if (!clean.modules) clean.modules = [];

  // Generate slug from title
  clean.slug = clean.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Normalize modules
  clean.modules = (clean.modules || []).map((m: any, index: number) => {
    const mod = { ...m };

    if (!mod.title) mod.title = `Module ${index + 1}`;
    if (!mod.description) mod.description = '';
    if (!mod.lessons) mod.lessons = [];

    mod.slug = mod.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Normalize lessons
    mod.lessons = (mod.lessons || []).map((l: any, lessonIndex: number) => {
      const lesson = typeof l === 'string' ? { title: l } : { ...l };

      if (!lesson.title) lesson.title = `Lesson ${lessonIndex + 1}`;
      if (!lesson.content) lesson.content = '';

      lesson.slug = lesson.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      return lesson;
    });

    return mod;
  });

  return clean;
}

export function validateCourseMetadata(metadata: Record<string, any>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!metadata.title || metadata.title.trim() === '') {
    errors.push('Course title is required');
  }

  if (!metadata.modules || metadata.modules.length === 0) {
    errors.push('Course must have at least one module');
  }

  metadata.modules?.forEach((mod: any, index: number) => {
    if (!mod.title) {
      errors.push(`Module ${index + 1} is missing a title`);
    }

    if (!mod.lessons || mod.lessons.length === 0) {
      errors.push(`Module "${mod.title}" has no lessons`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
