import { buildCourse } from './ai-course-builder';
import { scanRepo } from './repo-scanner';
import { enhanceImages } from './media-enhancer';
import { generateSitemap } from './sitemap-generator';
import { prepareDeploy } from './deploy-prep';

/**
 * Autopilot Runner - Orchestrates automated tasks
 * @param type - The type of autopilot task to run
 * @param payload - Optional payload data for the task
 * @returns Result of the autopilot task
 */
export async function runAutopilot(
  type: string,
  payload: any = {},
): Promise<{ success?: boolean; error?: string; data?: any }> {
  try {
    switch (type) {
      case 'course':
        // Build AI-powered course content
        const courseResult = await buildCourse(payload);
        return { success: true, data: courseResult };

      case 'scan':
        // Scan repository for content and structure
        const scanResult = await scanRepo();
        return { success: true, data: scanResult };

      case 'media':
        // Enhance and optimize media files
        const mediaResult = await enhanceImages();
        return { success: true, data: mediaResult };

      case 'sitemap':
        // Generate sitemap for SEO
        const sitemapResult = await generateSitemap();
        return { success: true, data: sitemapResult };

      case 'deploy':
        // Prepare deployment configuration
        const deployResult = await prepareDeploy();
        return { success: true, data: deployResult };

      default:
        return {
          success: false,
          error: `Unknown autopilot mode: ${type}. Valid modes: course, scan, media, sitemap, deploy`,
        };
    }
  } catch (error) {
    /* Error handled silently */
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Autopilot task failed',
    };
  }
}

/**
 * Get list of available autopilot tasks
 */
export function getAvailableAutopilotTasks(): string[] {
  return ['course', 'scan', 'media', 'sitemap', 'deploy'];
}

/**
 * Validate autopilot task type
 */
export function isValidAutopilotTask(type: string): boolean {
  return getAvailableAutopilotTasks().includes(type);
}
