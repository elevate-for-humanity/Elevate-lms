/**
 * PARIS Import Engine
 * AI-powered system for importing external codebases, APIs, and services
 */

export * from './types';
export * from './github-analyzer';
export * from './api-importer';
export * from './smart-mapper';
export * from './compatibility-reporter';

import { importFromGitHub } from './github-analyzer';
import { importAPI } from './api-importer';
import { generateSmartMapping } from './smart-mapper';
import { generateCompatibilityReport } from './compatibility-reporter';
import type { ImportRequest, ImportResult, RepositoryAnalysis, APIAnalysis } from './types';

/**
 * Main import orchestrator
 * Automatically determines import type and executes appropriate pipeline
 */
export async function importSource(request: ImportRequest): Promise<ImportResult> {
  try {
    let result: ImportResult;

    switch (request.source) {
      case 'github':
        if (!request.url) {
          return { success: false, errors: ['GitHub URL required'] };
        }
        result = await importFromGitHub(request.url, {
          token: request.credentials?.github_token,
        });
        break;

      case 'openapi':
      case 'graphql':
      case 'mcp':
        if (!request.url) {
          return { success: false, errors: ['API specification URL required'] };
        }
        result = await importAPI(request.url, {
          apiKey: request.credentials?.api_key,
        });
        break;

      default:
        return {
          success: false,
          errors: [`Import source "${request.source}" not yet supported`],
        };
    }

    // Generate compatibility report for repositories
    if (result.success && result.analysis && 'framework' in result.analysis) {
      const analysis = result.analysis as RepositoryAnalysis;
      result.compatibility = generateCompatibilityReport(analysis);
      result.mapping = generateSmartMapping(analysis);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}

/**
 * Quick analysis without full import
 */
export async function quickAnalyze(url: string): Promise<{
  framework?: string;
  database?: string;
  components?: number;
  routes?: number;
  confidence: number;
} | null> {
  try {
    // Determine source type
    if (url.includes('github.com')) {
      const result = await importFromGitHub(url);
      if (result.success && result.analysis && 'framework' in result.analysis) {
        const analysis = result.analysis as RepositoryAnalysis;
        return {
          framework: analysis.framework,
          database: analysis.database,
          components: analysis.components.length,
          routes: analysis.routes.length,
          confidence: 90,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
