/**
 * Authoritative Data Layer - Public API
 * Single Source of Truth for all platform operations
 */

// Types
export * from './types';

// Service
export { createOperationsService, getOperationsService } from './service';
export type { OperationsService } from './types';

// Convenience functions
export { getOperationsService as default } from './service';
