/**
 * PARIS AI Operating System
 * 
 * A comprehensive AI platform that combines:
 * - Import Engine: Connect external codebases, APIs, and services
 * - AI Workforce: Specialized AI agents with roles and permissions
 * - Marketing Studio: AI-powered content generation and publishing
 * - Media Studio: AI image search, generation, and management
 * - Voice Commands: Natural language interface
 * - Live Canvas: Real-time collaborative development
 * 
 * Usage:
 * 
 * ```typescript
 * import { parisCommand, hireAgent, generateContent } from '@/lib/paris';
 * 
 * // Voice/text command
 * const result = await parisCommand('Hire a recruiter agent');
 * 
 * // Or use specific modules
 * const agent = await hireAgent(userId, 'recruiter');
 * const content = await generateContent('program_announcement', { program_name: 'Medical Assistant' });
 * ```
 */

// Main entry point
export * from './dev-studio';
export * from './voice-commands';

// Re-export all modules
export * from './import-engine';
export * from './workforce';
export * from './marketing';
export * from './media-studio';

// Types
export type { ParsedCommand, CommandIntent } from './dev-studio';

/**
 * Quick start guide for PARIS
 */
export const PARIS_QUICK_START = {
  import: {
    description: 'Import external codebases and APIs',
    examples: [
      'Import this GitHub repository',
      'Connect to the Stripe API',
      'Analyze my codebase',
    ],
  },
  workforce: {
    description: 'Create and manage AI employees',
    examples: [
      'Hire a recruiter agent',
      'Create a grant writer',
      'Add a marketing specialist',
    ],
  },
  marketing: {
    description: 'Generate and publish marketing content',
    examples: [
      'Generate a video reel',
      'Create a marketing campaign',
      'Schedule social posts',
    ],
  },
  media: {
    description: 'Search and generate images',
    examples: [
      'Find a hero image',
      'Generate a promotional graphic',
      'Create brand assets',
    ],
  },
  voice: {
    description: 'Use voice commands',
    examples: [
      'Click the mic and speak',
      'Try "Create a recruiter agent"',
      'Say "Generate content about programs"',
    ],
  },
};
