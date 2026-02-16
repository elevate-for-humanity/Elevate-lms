/**
 * Password strength validation per NIST 800-63B guidelines.
 * - Minimum 8 characters
 * - No maximum length restriction (NIST recommends at least 64)
 * - Check against common breached passwords
 * - No composition rules (uppercase/special char requirements are discouraged by NIST)
 */

const COMMON_PASSWORDS = new Set([
  'password', '12345678', '123456789', '1234567890', 'qwerty123',
  'password1', 'iloveyou', 'sunshine1', 'princess1', 'football1',
  'charlie1', 'access14', 'master12', 'michael1', 'shadow12',
  'jennifer', 'trustno1', 'letmein1', 'baseball', 'superman',
  'elevate1', 'training', 'workforce', 'student1', 'admin123',
]);

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }

  if (password.length > 0 && password.length < 8) {
    // Already covered above
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common. Choose something less predictable.');
  }

  // Check for repeated characters (e.g., "aaaaaaaa")
  if (/^(.)\1+$/.test(password)) {
    errors.push('Password cannot be all the same character.');
  }

  // Check for sequential characters (e.g., "12345678", "abcdefgh")
  if (/^(?:0123456789|abcdefghij|qwertyuiop)/.test(password.toLowerCase())) {
    errors.push('Password cannot be a simple sequence.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
