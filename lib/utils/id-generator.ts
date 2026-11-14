/**
 * ID Generation Utilities using UUID
 */

import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

// Namespace for deterministic UUIDs
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Generate a random UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a short ID (first 8 characters of UUID)
 */
export function generateShortId(): string {
  return uuidv4().slice(0, 8);
}

/**
 * Generate a deterministic UUID v5 from a name
 */
export function generateDeterministicId(name: string): string {
  return uuidv5(name, NAMESPACE);
}

/**
 * Generate an offline action ID
 */
export function generateOfflineActionId(): string {
  return `offline_${uuidv4()}`;
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `session_${uuidv4()}`;
}

/**
 * Generate a request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${uuidv4()}`;
}

/**
 * Generate a temporary file ID
 */
export function generateTempFileId(extension?: string): string {
  const id = uuidv4();
  return extension ? `${id}.${extension}` : id;
}

/**
 * Validate if a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
