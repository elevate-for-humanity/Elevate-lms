/**
 * Domain layer — canonical app-facing types and DB row mappers.
 *
 * Import from here instead of consuming raw Supabase query results directly.
 * Null handling, naming normalization, and status defaults live in each
 * domain file and are applied once at the boundary.
 */

export * from './credentials';
export * from './programs';
export * from './courses';
export * from './courses';
export * from './certificates';
export * from './reports';
