/**
 * Centralized Error Code System
 * All API errors should use these codes for consistency
 */

export enum ErrorCode {
  // Authentication Errors (AUTH_xxx)
  AUTH_UNAUTHORIZED = 'AUTH_001',
  AUTH_INVALID_TOKEN = 'AUTH_002',
  AUTH_TOKEN_EXPIRED = 'AUTH_003',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_004',
  AUTH_SESSION_EXPIRED = 'AUTH_005',

  // Validation Errors (VAL_xxx)
  VAL_MISSING_FIELD = 'VAL_001',
  VAL_INVALID_FORMAT = 'VAL_002',
  VAL_OUT_OF_RANGE = 'VAL_003',
  VAL_INVALID_TYPE = 'VAL_004',
  VAL_FILE_TOO_LARGE = 'VAL_005',
  VAL_INVALID_FILE_TYPE = 'VAL_006',
  VAL_DUPLICATE_ENTRY = 'VAL_007',

  // Resource Errors (RES_xxx)
  RES_NOT_FOUND = 'RES_001',
  RES_ALREADY_EXISTS = 'RES_002',
  RES_CONFLICT = 'RES_003',
  RES_GONE = 'RES_004',

  // Database Errors (DB_xxx)
  DB_CONNECTION_ERROR = 'DB_001',
  DB_QUERY_ERROR = 'DB_002',
  DB_CONSTRAINT_VIOLATION = 'DB_003',
  DB_TIMEOUT = 'DB_004',
  DB_TRANSACTION_ERROR = 'DB_005',

  // External Service Errors (EXT_xxx)
  EXT_STRIPE_ERROR = 'EXT_001',
  EXT_SUPABASE_ERROR = 'EXT_002',
  EXT_RESEND_ERROR = 'EXT_003',
  EXT_OPENAI_ERROR = 'EXT_004',
  EXT_TIMEOUT = 'EXT_005',
  EXT_UNAVAILABLE = 'EXT_006',

  // Rate Limiting (RATE_xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_001',
  RATE_QUOTA_EXCEEDED = 'RATE_002',

  // Business Logic Errors (BIZ_xxx)
  BIZ_INVALID_OPERATION = 'BIZ_001',
  BIZ_PRECONDITION_FAILED = 'BIZ_002',
  BIZ_INSUFFICIENT_FUNDS = 'BIZ_003',
  BIZ_ENROLLMENT_CLOSED = 'BIZ_004',

  // Internal Errors (INT_xxx)
  INT_SERVER_ERROR = 'INT_001',
  INT_CONFIGURATION_ERROR = 'INT_002',
  INT_UNKNOWN_ERROR = 'INT_999',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.AUTH_INVALID_TOKEN]: 'Invalid authentication token',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Session has expired',

  // Validation
  [ErrorCode.VAL_MISSING_FIELD]: 'Required field is missing',
  [ErrorCode.VAL_INVALID_FORMAT]: 'Invalid format',
  [ErrorCode.VAL_OUT_OF_RANGE]: 'Value is out of acceptable range',
  [ErrorCode.VAL_INVALID_TYPE]: 'Invalid data type',
  [ErrorCode.VAL_FILE_TOO_LARGE]: 'File size exceeds limit',
  [ErrorCode.VAL_INVALID_FILE_TYPE]: 'Invalid file type',
  [ErrorCode.VAL_DUPLICATE_ENTRY]: 'Entry already exists',

  // Resource
  [ErrorCode.RES_NOT_FOUND]: 'Resource not found',
  [ErrorCode.RES_ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.RES_CONFLICT]: 'Resource conflict',
  [ErrorCode.RES_GONE]: 'Resource no longer available',

  // Database
  [ErrorCode.DB_CONNECTION_ERROR]: 'Database connection error',
  [ErrorCode.DB_QUERY_ERROR]: 'Database query error',
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: 'Database constraint violation',
  [ErrorCode.DB_TIMEOUT]: 'Database operation timed out',
  [ErrorCode.DB_TRANSACTION_ERROR]: 'Database transaction error',

  // External Services
  [ErrorCode.EXT_STRIPE_ERROR]: 'Payment service error',
  [ErrorCode.EXT_SUPABASE_ERROR]: 'Database service error',
  [ErrorCode.EXT_RESEND_ERROR]: 'Email service error',
  [ErrorCode.EXT_OPENAI_ERROR]: 'AI service error',
  [ErrorCode.EXT_TIMEOUT]: 'External service timeout',
  [ErrorCode.EXT_UNAVAILABLE]: 'External service unavailable',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.RATE_QUOTA_EXCEEDED]: 'Quota exceeded',

  // Business Logic
  [ErrorCode.BIZ_INVALID_OPERATION]: 'Invalid operation',
  [ErrorCode.BIZ_PRECONDITION_FAILED]: 'Precondition not met',
  [ErrorCode.BIZ_INSUFFICIENT_FUNDS]: 'Insufficient funds',
  [ErrorCode.BIZ_ENROLLMENT_CLOSED]: 'Enrollment is closed',

  // Internal
  [ErrorCode.INT_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.INT_CONFIGURATION_ERROR]: 'Configuration error',
  [ErrorCode.INT_UNKNOWN_ERROR]: 'An unexpected error occurred',
};

export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || ErrorMessages[ErrorCode.INT_UNKNOWN_ERROR];
}
