/**
 * URL Slug Generation using slugify
 */

import slugify from 'slugify';

/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

/**
 * Generate a course slug
 */
export function generateCourseSlug(courseName: string): string {
  return `course-${generateSlug(courseName)}`;
}

/**
 * Generate a program slug
 */
export function generateProgramSlug(programName: string): string {
  return `program-${generateSlug(programName)}`;
}

/**
 * Generate a blog post slug with date
 */
export function generateBlogSlug(title: string, date?: Date): string {
  const slug = generateSlug(title);
  if (date) {
    const dateStr = date.toISOString().split('T')[0];
    return `${dateStr}-${slug}`;
  }
  return slug;
}

/**
 * Generate a user profile slug
 */
export function generateUserSlug(firstName: string, lastName: string, id?: string): string {
  const nameSlug = generateSlug(`${firstName} ${lastName}`);
  return id ? `${nameSlug}-${id.slice(0, 8)}` : nameSlug;
}

/**
 * Generate a certificate slug
 */
export function generateCertificateSlug(courseName: string, userName: string): string {
  return generateSlug(`${courseName}-${userName}-certificate`);
}
