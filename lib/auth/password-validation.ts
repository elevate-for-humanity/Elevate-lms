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

// Keyboard rows and common ascending/descending sequences to detect anywhere in the password
const SEQUENTIAL_PATTERNS = [
  '0123456789',
  '9876543210',
  'abcdefghijklmnopqrstuvwxyz',
  'zyxwvutsrqponmlkjihgfedcba',
  'qwertyuiop',
  'poiuytrewq',
  'asdfghjkl',
  'lkjhgfdsa',
  'zxcvbnm',
  'mnbvcxz',
];

// Returns true if `password` contains any 4+ character run from a known sequence
function containsSequentialRun(password: string, minRunLength = 4): boolean {
  const lower = password.toLowerCase();
  for (const seq of SEQUENTIAL_PATTERNS) {
    for (let start = 0; start <= seq.length - minRunLength; start++) {
      const run = seq.slice(start, start + minRunLength);
      if (lower.includes(run)) return true;
    }
  }
  return false;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common. Choose something less predictable.');
  }

  // Check for repeated characters (e.g., "aaaaaaaa")
  if (/^(.)\1+$/.test(password)) {
    errors.push('Password cannot be all the same character.');
  }

  // Check for sequential keyboard or numeric runs anywhere in the password
  if (containsSequentialRun(password)) {
    errors.push('Password cannot contain a simple sequence (e.g. "1234", "abcd", "qwer").');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
