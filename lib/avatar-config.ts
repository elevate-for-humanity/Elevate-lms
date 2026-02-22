/**
 * Avatar Configuration System
 * 
 * Rules:
 * 1. Avatars are DISABLED by default - pages must explicitly enable
 * 2. No global scripts - every message is page-scoped
 * 3. Same avatar identity, different context per page
 * 4. Marketing language never leaks into LMS
 * 5. Silence is better than repetition
 * 6. Speak ONCE on page load, then stop
 */

export type AvatarRole = 'guide' | 'system' | 'instructor' | 'assistant';
export type AvatarIntent = 'orient' | 'explain' | 'assist' | 'warn' | 'celebrate';
export type AvatarAudience = 'student' | 'applicant' | 'partner' | 'government' | 'admin';

/**
 * Tone characteristics by audience:
 * - student: procedural, neutral, calm
 * - applicant: reassuring, factual
 * - partner: authoritative, formal
 * - government: compliance-first, restrained
 * - admin: operational, exact
 */

export interface AvatarContext {
  /** Whether avatar is enabled on this page - DEFAULT: false */
  enabled: boolean;
  /** Whether avatar speaks automatically on page load */
  speakOnLoad: boolean;
  /** Avatar's role on this page */
  role: AvatarRole;
  /** What the avatar is trying to accomplish */
  intent: AvatarIntent;
  /** Target audience - affects tone */
  audience?: AvatarAudience;
  /** Page-specific message - NEVER reuse across pages (1-2 sentences max) */
  message: string;
  /** Optional follow-up ONLY if user clicks/interacts */
  followUp?: string;
  /** Max messages before avatar goes silent - DEFAULT: 1 */
  maxMessages: number;
}

// Default: Avatar is SILENT
export const DEFAULT_AVATAR_CONTEXT: AvatarContext = {
  enabled: false,
  speakOnLoad: false,
  role: 'guide',
  intent: 'orient',
  message: '',
  maxMessages: 0,
};

/**
 * Page-specific avatar configs
 * 
 * RULES:
 * - If a page is not listed here, avatar is SILENT
 * - Messages must be unique per page (1-2 sentences max)
 * - No marketing language in LMS pages
 * - No brand introductions after homepage
 * - Speak once on load, then stop
 */
export const PAGE_AVATAR_CONFIGS: Record<string, AvatarContext> = {
  
  // ============================================
  // MARKETING PAGES
  // ============================================
  
  '/': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'orient',
    message: "Programs are grouped by career path. Pick one to see duration, outcomes, and funding options.",
    maxMessages: 1,
  },
  
  '/programs': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Programs are grouped by career path. You can open any program to see outcomes, duration, and eligibility.",
    maxMessages: 1,
  },
  
  // Healthcare Programs
  '/programs/cna': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "This page explains the CNA program — how long it takes, what certification you earn, and your funding options.",
    maxMessages: 1,
  },
  
  '/programs/healthcare': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Healthcare programs include CNA, Medical Assistant, and Phlebotomy. Each has different timelines and certifications.",
    maxMessages: 1,
  },
  
  '/programs/phlebotomy': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Phlebotomy training covers blood draw techniques and lab procedures. Certification included.",
    maxMessages: 1,
  },
  
  '/programs/medical-assistant': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Medical Assistant training covers clinical and administrative skills. This page shows duration and certification details.",
    maxMessages: 1,
  },
  
  // Apprenticeship Programs
  '/programs/barber-apprenticeship': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "This is a USDOL-registered apprenticeship. You'll train in a real shop while earning toward your license.",
    maxMessages: 1,
  },
  
  '/programs/barber': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Barber training options include apprenticeship and traditional programs. This page compares both paths.",
    maxMessages: 1,
  },
  
  '/programs/esthetician-apprenticeship': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Esthetician apprenticeship lets you train in a salon while earning hours toward licensure.",
    maxMessages: 1,
  },
  
  '/programs/cosmetology-apprenticeship': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Cosmetology apprenticeship covers hair, skin, and nails. You'll train with a licensed professional.",
    maxMessages: 1,
  },
  
  '/programs/nail-technician-apprenticeship': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Nail tech apprenticeship focuses on manicure, pedicure, and nail art. Shorter than full cosmetology.",
    maxMessages: 1,
  },
  
  // Trades Programs
  '/programs/skilled-trades': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Skilled trades include HVAC, CDL, welding, and electrical. High demand, good pay, hands-on work.",
    maxMessages: 1,
  },
  
  '/programs/cdl': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "CDL training takes 3-4 weeks. This page covers Class A vs Class B, endorsements, and job placement.",
    maxMessages: 1,
  },
  
  '/programs/hvac': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "HVAC training covers heating, cooling, and refrigeration systems. EPA certification included.",
    maxMessages: 1,
  },
  
  '/programs/welding': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Welding training covers MIG, TIG, and stick welding. AWS certification available.",
    maxMessages: 1,
  },
  
  // Technology Programs
  '/programs/technology': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Technology programs include IT Support, Cybersecurity, and Web Development. All lead to industry certifications.",
    maxMessages: 1,
  },
  
  '/programs/it-help-desk': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "IT Help Desk training prepares you for Certiport IT Specialist certification. 8 weeks, in-person at our Indianapolis Training Center.",
    maxMessages: 1,
  },
  
  '/programs/cybersecurity-analyst': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Cybersecurity training covers network defense and Security+ certification prep.",
    maxMessages: 1,
  },
  
  // Business Programs
  '/programs/business': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Business programs include tax preparation and entrepreneurship. Good for self-employment paths.",
    maxMessages: 1,
  },
  
  '/programs/tax-preparation': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "Tax prep training covers individual and small business returns. VITA certification included.",
    maxMessages: 1,
  },
  
  // ============================================
  // ENROLLMENT / APPLICATION
  // ============================================
  
  '/apply': {
    enabled: true,
    speakOnLoad: true,
    role: 'assistant',
    intent: 'assist',
    message: "This is the application page. Nothing is submitted until you complete all required steps.",
    maxMessages: 1,
  },
  
  '/wioa-eligibility': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'explain',
    message: "This checks if you qualify for free training. Answer honestly — it's confidential and takes 2 minutes.",
    maxMessages: 1,
  },
  
  '/enroll/success': {
    enabled: true,
    speakOnLoad: true,
    role: 'guide',
    intent: 'celebrate',
    message: "You're enrolled. Next steps are listed below — orientation is usually first.",
    maxMessages: 1,
  },
  
  // ============================================
  // LMS PAGES (Functional, no marketing)
  // ============================================
  
  '/student-portal': {
    enabled: true,
    speakOnLoad: true,
    role: 'assistant',
    intent: 'orient',
    message: "This dashboard shows your progress, required hours, and any tasks that need attention.",
    maxMessages: 1,
  },
  
  '/lms/courses': {
    enabled: false, // Silent - UI is self-explanatory
    speakOnLoad: false,
    role: 'assistant',
    intent: 'orient',
    message: '',
    maxMessages: 0,
  },
  
  '/student-portal/progress': {
    enabled: true,
    speakOnLoad: true,
    role: 'assistant',
    intent: 'explain',
    message: "These hours count toward your program requirements. Green is complete, yellow is in progress, red is overdue.",
    maxMessages: 1,
  },
  
  '/student-portal/hours': {
    enabled: true,
    speakOnLoad: true,
    role: 'assistant',
    intent: 'explain',
    message: "Log your training hours here. I'll flag anything that doesn't match your program requirements.",
    maxMessages: 1,
  },
  
  '/student-portal/documents': {
    enabled: true,
    speakOnLoad: true,
    role: 'assistant',
    intent: 'assist',
    message: "Upload required documents here. Missing items are marked in red.",
    maxMessages: 1,
  },
  
  '/student-portal/messages': {
    enabled: false, // Silent - messaging UI is obvious
    speakOnLoad: false,
    role: 'assistant',
    intent: 'orient',
    message: '',
    maxMessages: 0,
  },
  
  // ============================================
  // INSTRUCTOR / STAFF PORTALS
  // ============================================
  
  '/instructor': {
    enabled: true,
    speakOnLoad: true,
    role: 'assistant',
    intent: 'orient',
    message: "Your instructor dashboard shows classes, student progress, and pending approvals.",
    maxMessages: 1,
  },
  
  '/staff-portal': {
    enabled: true,
    speakOnLoad: true,
    role: 'assistant',
    intent: 'orient',
    message: "Staff portal shows student records, enrollment status, and compliance tracking.",
    maxMessages: 1,
  },
  
  // ============================================
  // STORE (Minimal)
  // ============================================
  
  '/store': {
    enabled: false, // Silent - browsing doesn't need narration
    speakOnLoad: false,
    role: 'assistant',
    intent: 'assist',
    message: '',
    maxMessages: 0,
  },
  
  '/store/checkout': {
    enabled: true,
    speakOnLoad: true,
    role: 'assistant',
    intent: 'assist',
    message: "Review your order before completing. Payment is processed securely.",
    maxMessages: 1,
  },
  
  // ============================================
  // SILENT PAGES (No avatar speech)
  // ============================================
  
  '/policies/ferpa': {
    enabled: false,
    speakOnLoad: false,
    role: 'system',
    intent: 'explain',
    message: '',
    maxMessages: 0,
  },
  
  '/privacy': {
    enabled: false,
    speakOnLoad: false,
    role: 'system',
    intent: 'explain',
    message: '',
    maxMessages: 0,
  },
  
  '/terms': {
    enabled: false,
    speakOnLoad: false,
    role: 'system',
    intent: 'explain',
    message: '',
    maxMessages: 0,
  },
  
  '/governance': {
    enabled: false,
    speakOnLoad: false,
    role: 'system',
    intent: 'explain',
    message: '',
    maxMessages: 0,
  },
};

/**
 * Get avatar config for a page
 * Returns DEFAULT (disabled) if page not configured
 */
export function getAvatarConfig(pathname: string): AvatarContext {
  // Exact match first
  if (PAGE_AVATAR_CONFIGS[pathname]) {
    return PAGE_AVATAR_CONFIGS[pathname];
  }
  
  // Try pattern matching for dynamic routes
  for (const [pattern, config] of Object.entries(PAGE_AVATAR_CONFIGS)) {
    if (pathname.startsWith(pattern) && pattern !== '/') {
      return config;
    }
  }
  
  return DEFAULT_AVATAR_CONTEXT;
}

/**
 * Check if avatar should speak on this page
 */
export function isAvatarEnabled(pathname: string): boolean {
  const config = getAvatarConfig(pathname);
  return config.enabled && config.message.length > 0;
}

/**
 * Check if avatar should speak on page load
 */
export function shouldSpeakOnLoad(pathname: string): boolean {
  const config = getAvatarConfig(pathname);
  return config.enabled && config.speakOnLoad && config.message.length > 0;
}

// ============================================
// AVATAR SPEECH GENERATOR
// Anti-duplication + session tracking
// ============================================

// Track which pages have already spoken this session
const spokenPages = new Set<string>();

/**
 * Get the message to speak on page load
 * Returns null if:
 * - Avatar is disabled for this page
 * - speakOnLoad is false
 * - Already spoken on this page this session
 * - maxMessages exceeded
 */
export function getPageLoadMessage(pathname: string): string | null {
  const config = getAvatarConfig(pathname);
  
  // Check if should speak
  if (!config.enabled || !config.speakOnLoad) {
    return null;
  }
  
  // Check if already spoken this session
  if (spokenPages.has(pathname)) {
    return null;
  }
  
  // Check if message exists
  if (!config.message || config.message.length === 0) {
    return null;
  }
  
  // Mark as spoken
  spokenPages.add(pathname);
  
  return config.message;
}

/**
 * Get follow-up message (only if user interacts)
 * Returns null if no follow-up or already at max messages
 */
export function getFollowUpMessage(pathname: string): string | null {
  const config = getAvatarConfig(pathname);
  
  if (!config.enabled || !config.followUp) {
    return null;
  }
  
  // Only allow follow-up if maxMessages > 1
  if (config.maxMessages <= 1) {
    return null;
  }
  
  return config.followUp;
}

/**
 * Reset spoken pages (call on logout or session end)
 */
export function resetSpokenPages(): void {
  spokenPages.clear();
}

/**
 * Check if a message would be duplicate
 * Used to validate new configs
 */
export function isDuplicateMessage(message: string, excludePath?: string): boolean {
  for (const [path, config] of Object.entries(PAGE_AVATAR_CONFIGS)) {
    if (path !== excludePath && config.message === message) {
      return true;
    }
  }
  return false;
}

/**
 * Validate all configs for duplicates
 * Run this in tests to catch duplicate messages
 */
export function validateNoDuplicates(): { valid: boolean; duplicates: string[] } {
  const messages = new Map<string, string[]>();
  
  for (const [path, config] of Object.entries(PAGE_AVATAR_CONFIGS)) {
    if (config.message) {
      const existing = messages.get(config.message) || [];
      existing.push(path);
      messages.set(config.message, existing);
    }
  }
  
  const duplicates: string[] = [];
  for (const [message, paths] of messages.entries()) {
    if (paths.length > 1) {
      duplicates.push(`"${message.substring(0, 50)}..." used on: ${paths.join(', ')}`);
    }
  }
  
  return {
    valid: duplicates.length === 0,
    duplicates,
  };
}

// ============================================
// TONE TUNING SYSTEM
// ============================================

/**
 * Word replacements by audience
 * Tone is enforced programmatically, not emotionally
 */
const TONE_REPLACEMENTS: Record<AvatarAudience, Record<string, string>> = {
  student: {
    'manage': 'track',
    'compliance': 'requirements',
    'verify': 'check',
    'authorize': 'approve',
  },
  applicant: {
    'required': 'needed',
    'mandatory': 'required',
    'failure': 'issue',
    'rejected': 'not approved',
  },
  partner: {
    'help': 'support',
    'show': 'demonstrate',
    'use': 'utilize',
  },
  government: {
    'help': 'manage',
    'guide': 'direct',
    'support': 'facilitate',
    'show': 'present',
    'easy': 'streamlined',
  },
  admin: {
    'help': 'assist',
    'show': 'display',
    'check': 'verify',
  },
};

/**
 * Apply tone adjustments to a message based on audience
 * 
 * @param message - Original message
 * @param audience - Target audience
 * @returns Tone-adjusted message
 */
export function applyTone(message: string, audience: AvatarAudience): string {
  const replacements = TONE_REPLACEMENTS[audience];
  if (!replacements) return message;
  
  let adjusted = message;
  for (const [find, replace] of Object.entries(replacements)) {
    // Case-insensitive replacement, preserving original case
    const regex = new RegExp(`\\b${find}\\b`, 'gi');
    adjusted = adjusted.replace(regex, (match) => {
      // Preserve capitalization
      if (match[0] === match[0].toUpperCase()) {
        return replace.charAt(0).toUpperCase() + replace.slice(1);
      }
      return replace;
    });
  }
  
  return adjusted;
}

/**
 * Get tone-adjusted message for a page
 */
export function getTonedMessage(pathname: string): string | null {
  const config = getAvatarConfig(pathname);
  
  if (!config.enabled || !config.message) {
    return null;
  }
  
  // Apply tone if audience is specified
  if (config.audience) {
    return applyTone(config.message, config.audience);
  }
  
  return config.message;
}

/**
 * Detect audience from pathname
 */
export function detectAudience(pathname: string): AvatarAudience {
  if (pathname.startsWith('/student-portal') || pathname.startsWith('/lms')) {
    return 'student';
  }
  if (pathname.startsWith('/apply') || pathname.startsWith('/enroll') || pathname.startsWith('/wioa')) {
    return 'applicant';
  }
  if (pathname.startsWith('/partner') || pathname.startsWith('/employer')) {
    return 'partner';
  }
  if (pathname.startsWith('/government') || pathname.startsWith('/workforce-board') || pathname.includes('compliance')) {
    return 'government';
  }
  if (pathname.startsWith('/admin') || pathname.startsWith('/staff') || pathname.startsWith('/instructor')) {
    return 'admin';
  }
  
  // Default to applicant for marketing pages
  return 'applicant';
}
