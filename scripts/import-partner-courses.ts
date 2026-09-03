#!/usr/bin/env ts-node

/**
 * Partner Course Import Script
 *
 * Usage:
 *   npm run import:courses -- --provider certiport --file courses.json
 *   npm run import:courses -- --provider hsi --file courses.csv
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface CourseData {
  title: string;
  description: string;
  category: string;
  wholesalePrice: number;
  retailPrice?: number;
  duration?: number;
  prerequisites?: string;
  certificationType?: string;
  externalId?: string;
  externalUrl?: string;
}

const MARKUP_RATES: Record<string, number> = {
  certiport: 1.4, // 40% markup
  hsi: 1.59, // 59% markup
  jri: 1.5, // 50% markup
  nrf: 1.3, // 30% markup
  careersafe: 1.4, // 40% markup
  milady: 1.6, // 60% markup
  nds: 1.5, // 50% markup
};

async function getProviderId(providerType: string): Promise<string> {
  const { data, error } = await supabase
    .from('partner_lms_providers')
    .select('id')
    .eq('provider_type', providerType)
    .single();

  if (error || !data) {
    throw new Error(`Provider ${providerType} not found`);
  }

  return data.id;
}

function calculateRetailPrice(wholesalePrice: number, providerType: string): number {
  const markup = MARKUP_RATES[providerType] || 1.4;
  return Math.round(wholesalePrice * markup * 100) / 100;
}

async function importCoursesFromJSON(providerType: string, filePath: string): Promise<void> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const courses: CourseData[] = JSON.parse(fileContent);

  await importCourses(providerType, courses);
}

async function importCoursesFromCSV(providerType: string, filePath: string): Promise<void> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const courses: CourseData[] = records.map((record: any) => ({
    title: record.title || record.course_name || record.name,
    description: record.description || '',
    category: record.category || 'General',
    wholesalePrice: parseFloat(record.wholesale_price || record.price || '0'),
    retailPrice: record.retail_price ? parseFloat(record.retail_price) : undefined,
    duration: record.duration ? parseInt(record.duration) : undefined,
    prerequisites: record.prerequisites || '',
    certificationType: record.certification_type || 'Certificate',
    externalId: record.external_id || record.id || '',
    externalUrl: record.external_url || record.url || '',
  }));

  await importCourses(providerType, courses);
}

async function importCourses(providerType: string, courses: CourseData[]): Promise<void> {
  const providerId = await getProviderId(providerType);

  const coursesToInsert = courses.map((course) => ({
    provider_id: providerId,
    course_name: course.title,
    description: course.description,
    category: course.category,
    wholesale_price: course.wholesalePrice === 0 ? 0 : course.wholesalePrice || 99.99,
    retail_price: course.retailPrice || calculateRetailPrice(course.wholesalePrice, providerType),
    duration_hours: course.duration || null,
    prerequisites: course.prerequisites || null,
    certification_type: course.certificationType || 'Certificate',
    external_course_id: course.externalId || null,
    external_course_url: course.externalUrl || null,
    is_active: true,
  }));

  // Insert in batches of 100
  const batchSize = 100;
  let imported = 0;

  for (let i = 0; i < coursesToInsert.length; i += batchSize) {
    const batch = coursesToInsert.slice(i, i + batchSize);

    const { error } = await supabase.from('partner_courses_catalog').insert(batch);

    if (error) {
      throw error;
    }

    imported += batch.length;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const providerIndex = args.indexOf('--provider');
  const fileIndex = args.indexOf('--file');

  if (providerIndex === -1 || fileIndex === -1) {
    process.exit(1);
  }

  const provider = args[providerIndex + 1];
  const file = args[fileIndex + 1];

  if (!provider || !file) {
    process.exit(1);
  }

  const validProviders = Object.keys(MARKUP_RATES);
  if (!validProviders.includes(provider)) {
    process.exit(1);
  }

  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.json') {
      await importCoursesFromJSON(provider, filePath);
    } else if (ext === '.csv') {
      await importCoursesFromCSV(provider, filePath);
    } else {
      process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  }
}

main();
