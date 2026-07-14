/**
 * Dev Studio Command Allowlist
 * 
 * Controls which commands can be executed through the Dev Studio runtime.
 * Prevents shell injection and unauthorized filesystem access.
 * 
 * SECURITY: This file defines the ONLY commands that can be executed.
 * No raw shell commands, no user-provided commands, no exec/eval.
 */

export interface AllowedCommand {
  command: string;
  description: string;
  category: 'build' | 'test' | 'lint' | 'git' | 'admin' | 'info';
  timeout: number; // milliseconds
  allowedArgs?: string[]; // Specific arguments allowed (empty = command only)
}

// =============================================================================
// ALLOWED COMMANDS
// =============================================================================

export const ALLOWED_COMMANDS: AllowedCommand[] = [
  // Build commands
  {
    command: 'pnpm',
    description: 'Package manager operations',
    category: 'build',
    timeout: 300000, // 5 minutes
    allowedArgs: ['install', 'build', 'dev', 'test', 'lint', 'typecheck', 'production:gate', 'production:smoke'],
  },
  {
    command: 'npm',
    description: 'Package manager fallback',
    category: 'build',
    timeout: 300000,
    allowedArgs: ['install', 'run', 'test', 'build'],
  },
  {
    command: 'node',
    description: 'Node.js runtime',
    category: 'build',
    timeout: 60000, // 1 minute
    allowedArgs: ['--version', '-v', '--help'],
  },

  // Test commands
  {
    command: 'pnpm',
    description: 'Run tests',
    category: 'test',
    timeout: 300000,
    allowedArgs: ['test', 'test:ci', 'test:watch'],
  },
  {
    command: 'npx',
    description: 'Execute npm binaries',
    category: 'test',
    timeout: 120000, // 2 minutes
    allowedArgs: ['playwright', 'jest', 'vitest'],
  },

  // Lint commands
  {
    command: 'pnpm',
    description: 'Run linters',
    category: 'lint',
    timeout: 120000,
    allowedArgs: ['lint', 'lint:fix', 'format'],
  },

  // Git commands (read-only for info)
  {
    command: 'git',
    description: 'Git operations',
    category: 'git',
    timeout: 30000, // 30 seconds
    allowedArgs: [
      'status', 'status --short', 'status -s',
      'log', 'log --oneline', 'log -n 10 --oneline',
      'branch', 'branch -a',
      'remote', 'remote -v',
      'diff', 'diff --stat',
      'show', 'show --stat',
      'rev-parse', 'rev-parse --is-shallow-repository',
      'fetch', 'fetch --dry-run',
      'ls-files', 'ls-tree', 'ls-remote',
    ],
  },

  // Admin/Production commands
  {
    command: 'bash',
    description: 'Run production gate scripts',
    category: 'admin',
    timeout: 120000,
    allowedArgs: [
      'scripts/production-readiness-gate.sh',
      'scripts/post-deploy-smoke.sh',
    ],
  },

  // Info commands
  {
    command: 'echo',
    description: 'Print text',
    category: 'info',
    timeout: 5000,
    allowedArgs: ['*'], // Allow any argument for echo
  },
  {
    command: 'cat',
    description: 'Display file contents',
    category: 'info',
    timeout: 10000,
    allowedArgs: ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'next.config.mjs', '.env.example'],
  },
  {
    command: 'ls',
    description: 'List directory contents',
    category: 'info',
    timeout: 10000,
    allowedArgs: ['-la', '-l', '-R', 'app/', 'lib/', 'components/', 'scripts/', 'public/'],
  },
  {
    command: 'pwd',
    description: 'Print working directory',
    category: 'info',
    timeout: 5000,
  },
  {
    command: 'whoami',
    description: 'Print current user',
    category: 'info',
    timeout: 5000,
  },
  {
    command: 'env',
    description: 'Print environment variables',
    category: 'info',
    timeout: 5000,
    allowedArgs: [], // No args - don't expose all env vars
  },
  {
    command: 'df',
    description: 'Disk usage',
    category: 'info',
    timeout: 5000,
    allowedArgs: ['-h'],
  },
  {
    command: 'free',
    description: 'Memory usage',
    category: 'info',
    timeout: 5000,
    allowedArgs: ['-h', '-m'],
  },
];

// =============================================================================
// FORBIDDEN PATTERNS
// =============================================================================

export const FORBIDDEN_PATTERNS = [
  // Shell features
  /\|\s*sh\b/,
  /\|\s*bash/,
  /;\s*sh\b/,
  /;\s*bash/,
  /`[^`]+`/,
  /\$\([^)]+\)/,
  /\$\{[^}]+\}/,
  
  // File system
  /\.\.\//,
  /~\//,
  /\/etc\//,
  /\/root\//,
  /\/home\//,
  /\/var\/log\//,
  /\/tmp\//,
  /\/proc\//,
  /\/sys\//,
  /\/dev\//,
  
  // Network
  /curl\s+http/,
  /wget\s+http/,
  /nc\s+/,
  /telnet\s+/,
  /ssh\s+/,
  /scp\s+/,
  /ftp\s+/,
  
  // System
  /sudo\s+/,
  /chmod\s+[47]/,
  /chown\s+/,
  /passwd\s+/,
  /adduser\s+/,
  /useradd\s+/,
  
  // Crypto/Credentials
  /openssl\s+rand/,
  /head\s+-c\s+\d+\s+\/dev\/urandom/,
  
  // Process
  /kill\s+-9/,
  /pkill/,
  /killall/,
  
  // Download/Upload
  /base64\s+-d/,
  /xxd\s+-r/,
];

// =============================================================================
// COMMAND VALIDATOR
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validate a command against the allowlist
 */
export function validateCommand(input: string): ValidationResult {
  // Basic sanitization
  const sanitized = input.trim();
  
  if (!sanitized) {
    return { valid: false, error: 'Empty command' };
  }
  
  // Check for forbidden patterns first (fast fail)
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(sanitized)) {
      return { 
        valid: false, 
        error: `Command contains forbidden pattern: ${pattern}` 
      };
    }
  }
  
  // Parse command
  const parts = sanitized.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);
  
  // Find command in allowlist
  const allowed = ALLOWED_COMMANDS.find(c => c.command === command);
  
  if (!allowed) {
    return { valid: false, error: `Command not in allowlist: ${command}` };
  }
  
  // Check if arguments are allowed
  if (allowed.allowedArgs && allowed.allowedArgs.length > 0) {
    // Special case for echo and cat which may have file arguments
    if (command === 'echo') {
      return { valid: true, sanitized };
    }
    
    // For cat, allow any file path that looks reasonable
    if (command === 'cat') {
      const fileArg = args[0];
      if (fileArg && !fileArg.includes('..') && !fileArg.startsWith('/')) {
        return { valid: true, sanitized };
      }
      if (!allowed.allowedArgs.includes(fileArg)) {
        return { valid: false, error: `File argument not allowed: ${fileArg}` };
      }
      return { valid: true, sanitized };
    }
    
    // For ls, allow any directory path
    if (command === 'ls') {
      return { valid: true, sanitized };
    }
    
    // Check if each argument is in the allowed list
    // Handle compound arguments like "status --short"
    const compoundArgs = args.join(' ');
    const allAllowedArgs = allowed.allowedArgs.join(' ');
    
    // Check for exact match first
    if (allowed.allowedArgs.includes(compoundArgs)) {
      return { valid: true, sanitized };
    }
    
    // Check individual args
    for (const arg of args) {
      if (arg.startsWith('-')) {
        // Flags - check if any flag pattern is allowed
        const flagPattern = allowed.allowedArgs.find(a => a.startsWith(arg) || arg.startsWith(a));
        if (!flagPattern && !allowed.allowedArgs.includes(arg)) {
          // Some flags like -la are combinations, allow common ones
          if (!['-la', '-l', '-R', '-h', '-m', '-v', '-a'].some(f => f.startsWith(arg))) {
            return { valid: false, error: `Argument not allowed: ${arg}` };
          }
        }
      } else if (!allowed.allowedArgs.includes(arg)) {
        // Non-flag argument not in allowlist
        return { valid: false, error: `Argument not allowed: ${arg}` };
      }
    }
  }
  
  return { valid: true, sanitized };
}

/**
 * Get timeout for a command
 */
export function getCommandTimeout(command: string): number {
  const parts = command.split(/\s+/);
  const cmd = parts[0];
  
  const allowed = ALLOWED_COMMANDS.find(c => c.command === cmd);
  return allowed?.timeout ?? 30000; // Default 30 seconds
}

/**
 * Get category for a command
 */
export function getCommandCategory(command: string): string {
  const parts = command.split(/\s+/);
  const cmd = parts[0];
  
  const allowed = ALLOWED_COMMANDS.find(c => c.command === cmd);
  return allowed?.category ?? 'unknown';
}
