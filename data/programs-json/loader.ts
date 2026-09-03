/**
 * Program data loader - runtime loading to reduce build memory
 * 
 * Instead of importing static data at build time,
 * load from JSON files at runtime to reduce SWC memory usage.
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';

const CACHE = new Map<string, any>();

export function getProgramData(slug: string): any | null {
  if (CACHE.has(slug)) return CACHE.get(slug);
  
  const filePath = path.join(process.cwd(), 'data/programs-json', `${slug}.json`);
  if (!existsSync(filePath)) return null;
  
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  CACHE.set(slug, data);
  return data;
}

export function getAllProgramSlugs(): string[] {
  const indexPath = path.join(process.cwd(), 'data/programs-json/index.json');
  if (!existsSync(indexPath)) return [];
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  return index.slugs || [];
}

export function getProgramDataCached(slug: string): any | null {
  return getProgramData(slug);
}
