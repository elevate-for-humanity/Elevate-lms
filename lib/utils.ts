import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize search input for use in Supabase ilike queries.
 * Escapes special PostgreSQL pattern characters to prevent SQL injection.
 */
export function sanitizeSearchInput(input: string): string {
  if (!input) return '';
  
  // Escape PostgreSQL LIKE/ILIKE special characters: % _ \
  // Also remove any null bytes and limit length
  return input
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')    // Escape percent
    .replace(/_/g, '\\_')    // Escape underscore
    .replace(/\0/g, '')      // Remove null bytes
    .slice(0, 200);          // Limit length
}
