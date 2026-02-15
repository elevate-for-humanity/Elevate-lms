import { scanRepository, analyzeRepository } from './repo-analyzer';
import {
  normalizeCourseMetadata,
  validateCourseMetadata,
} from './course-normalizer';
import { checkBrokenLinks, checkCourseStructure } from './link-checker';
export async function runAutopilot(name: string, payload: any = {}) {
  return { ok: true };
}
export async function runAutopilots(
  metadata: Record<string, any>,
  repo = 'elevateforhumanity/fix2'
) {
  try {
    // Scan repository
    const tree = await scanRepository(repo);
    // Normalize metadata
    const normalized = normalizeCourseMetadata(metadata);
    // Validate metadata
    const validation = validateCourseMetadata(normalized);
    // Check for broken links
    const linkCheck = checkBrokenLinks(tree, normalized);
    // Check course structure
    const structure = normalized.slug
      ? checkCourseStructure(tree, normalized.slug)
      : null;
    return {
      ok: validation.valid,
      normalized,
      validation,
      linkCheck,
      structure,
      errors: validation.errors,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      ok: false,
      error: 'Operation failed',
    };
  }
}
export async function runFullAnalysis(repo = 'elevateforhumanity/fix2') {
  try {
    const { files, analysis } = await analyzeRepository(repo);
    return {
      ok: true,
      files,
      analysis,
      summary: {
        totalFiles: analysis.totalFiles,
        courseFiles: analysis.courses,
        codeFiles: analysis.components + analysis.pages + analysis.api,
      },
    };
  } catch (error) { /* Error handled silently */ 
    return {
      ok: false,
      error: 'Operation failed',
    };
  }
}
