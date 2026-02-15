import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { programs, type Program } from '@/app/data/programs';

/**
 * Program Data Loader
 *
 * Supports loading programs from:
 * 1. TypeScript data file (current - app/data/programs.ts)
 * 2. JSON files (optional - data/programs/*.json)
 * 3. API endpoints (future)
 */

// Get all programs from TypeScript data
export function getAllPrograms(): Program[] {
  return programs;
}

// Get single program by slug
export function getProgramBySlug(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug);
}

// Get all program slugs for static generation
export function getAllProgramSlugs(): string[] {
  return programs.map((p) => p.slug);
}

// Optional: Load programs from JSON files (if you want to use this approach)
export function loadProgramsFromJSON(): Program[] {
  const programsDir = path.join(process.cwd(), 'data', 'programs');

  // Check if directory exists
  if (!fs.existsSync(programsDir)) {
    logger.warn('Programs directory not found, using TypeScript data');
    return programs;
  }

  try {
    const files = fs.readdirSync(programsDir);
    const jsonPrograms = files
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const filePath = path.join(programsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent) as Program;
      });

    return jsonPrograms.length > 0 ? jsonPrograms : programs;
  } catch (error) {
    logger.error('Error loading programs from JSON:', error);
    return programs;
  }
}

// Get programs by category
export function getProgramsByCategory(category: string): Program[] {
  // You can add category field to Program type if needed
  return programs.filter(
    (p) =>
      p.slug.includes(category.toLowerCase()) ||
      p.name.toLowerCase().includes(category.toLowerCase())
  );
}

// Search programs
export function searchPrograms(query: string): Program[] {
  const lowerQuery = query.toLowerCase();
  return programs.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.shortDescription.toLowerCase().includes(lowerQuery) ||
      p.heroTitle.toLowerCase().includes(lowerQuery)
  );
}

// Get featured programs
export function getFeaturedPrograms(limit: number = 3): Program[] {
  // You can add a 'featured' field to Program type
  // For now, return first N programs
  return programs.slice(0, limit);
}
