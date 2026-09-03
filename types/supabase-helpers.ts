/**
 * Supabase query result type helpers
 */

export type SupabaseQueryResult<T> = {
  data: T | null;
  error: Error | null;
};

export type SupabaseQueryData<T> = T extends { data: infer D } ? D : never;

// Common database record types
export interface BaseRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile extends BaseRecord {
  email: string;
  full_name: string;
  role?: string;
  organization_id?: string;
}

export interface Organization extends BaseRecord {
  name: string;
  slug: string;
  type?: string;
  status?: string;
}

export interface Enrollment extends BaseRecord {
  student_id: string;
  program_id: string;
  status: string;
  enrolled_at?: string;
  completed_at?: string;
  organization_id?: string;
}

export interface Program extends BaseRecord {
  name: string;
  code?: string;
  status?: string;
}

export interface Course extends BaseRecord {
  title: string;
  slug?: string;
  status?: string;
}

// Type guard helpers
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return isRecord(obj) && key in obj;
}

export function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error('Value is not a record');
  }
}
