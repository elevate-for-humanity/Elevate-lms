export function checkBrokenLinks(treePaths: string[], metadata: Record<string, any>) {
  const missing: string[] = [];
  const found: string[] = [];

  if (!metadata.slug) {
    return { missing: ['Course slug is missing'], found: [] };
  }

  metadata.modules?.forEach((mod: any) => {
    if (!mod.slug) return;

    mod.lessons?.forEach((l: any) => {
      if (!l.slug) return;

      // Check for HTML file
      const htmlPath = `courses/${metadata.slug}/modules/${mod.slug}/${l.slug}.html`;
      // Check for Markdown file
      const mdPath = `courses/${metadata.slug}/modules/${mod.slug}/${l.slug}.md`;

      if (treePaths.includes(htmlPath)) {
        found.push(htmlPath);
      } else if (treePaths.includes(mdPath)) {
        found.push(mdPath);
      } else {
        missing.push(`${htmlPath} or ${mdPath}`);
      }
    });
  });

  return {
    missing,
    found,
    missingCount: missing.length,
    foundCount: found.length,
  };
}

export function checkMetadataFile(treePaths: string[], courseSlug: string): boolean {
  const metadataPath = `courses/${courseSlug}/metadata.json`;
  return treePaths.includes(metadataPath);
}

export function checkCourseStructure(treePaths: string[], courseSlug: string) {
  const structure = {
    hasMetadata: checkMetadataFile(treePaths, courseSlug),
    hasReadme: treePaths.includes(`courses/${courseSlug}/README.md`),
    modules: [] as string[],
    lessons: [] as string[],
  };

  // Find all modules
  const modulePattern = new RegExp(`^courses/${courseSlug}/modules/([^/]+)/`);
  treePaths.forEach((path) => {
    const match = path.match(modulePattern);
    if (match && !structure.modules.includes(match[1])) {
      structure.modules.push(match[1]);
    }
  });

  // Find all lessons
  const lessonPattern = new RegExp(`^courses/${courseSlug}/modules/[^/]+/(.+\\.(html|md))$`);
  treePaths.forEach((path) => {
    if (lessonPattern.test(path)) {
      structure.lessons.push(path);
    }
  });

  return structure;
}
