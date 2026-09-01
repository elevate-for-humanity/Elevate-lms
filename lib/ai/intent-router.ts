/**
 * AI Gateway Module - Intent Router
 *
 * Classifies incoming requests and routes them to the appropriate agent.
 * Uses keyword matching and pattern analysis with confidence scoring.
 */

import { AIAgent, AgentIntent, TaskPriority } from './types';

import type { AIRequest, IntentClassification, RoutingDecision, TaskPayload } from './types';

// ============================================================
// Intent Classification Rules
// ============================================================

interface IntentRule {
  intent: AgentIntent;
  agent: AIAgent;
  defaultPriority: TaskPriority;
  keywords: string[];
  patterns: RegExp[];
  contexts?: string[];
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: AgentIntent.ADMISSION,
    agent: AIAgent.PARIS,
    defaultPriority: TaskPriority.HIGH,
    keywords: [
      'interview',
      'apply',
      'program',
      'eligibility',
      'admission',
      'admissions',
      'enroll',
      'application',
      'applicant',
      'candidate',
      'qualify',
      'qualification',
      'paris',
      'assessment',
      'screening',
      'intake',
      'intake',
    ],
    patterns: [
      /^(i want to|I'd like to|I'd love to)\s+(apply|enroll|sign up|get started)/i,
      /^(how do I|can I)\s+(apply|enroll|qualify)/i,
      /^(what are the|what's the|are there)\s+(requirements?|qualifications?)/i,
      /program/i,
      /admission/i,
      /eligibility/i,
    ],
    contexts: ['admission', 'application', 'paris'],
  },
  {
    intent: AgentIntent.ENROLLMENT,
    agent: AIAgent.ELLIE,
    defaultPriority: TaskPriority.HIGH,
    keywords: [
      'enroll',
      'enrollment',
      'payment',
      'funding',
      'WIOA',
      'tuition',
      'financial',
      'scholarship',
      'grant',
      'loan',
      'installment',
      'register',
      'registration',
      'course selection',
      'class',
    ],
    patterns: [
      /^(how much|what('s| is) the)\s+(cost|tuition|price|fee)/i,
      /^(can I|do you)\s+(pay|fund|finance)/i,
      /payment/i,
      /enrollment/i,
      /WIOA/i,
    ],
    contexts: ['enrollment', 'payment', 'financial', 'WIOA'],
  },
  {
    intent: AgentIntent.COURSE_BUILDER,
    agent: AIAgent.ELLIE,
    defaultPriority: TaskPriority.MEDIUM,
    keywords: [
      'progress',
      'course',
      'lesson',
      'complete',
      'completion',
      'module',
      'syllabus',
      'curriculum',
      'learning',
      'study',
      'assignment',
      'quiz',
      'exam',
      'test',
      'grade',
      'score',
      'result',
      'video',
      'content',
      'material',
      'resource',
    ],
    patterns: [
      /^(how('s| is)|what's|what is)\s+(my|the)\s+(progress|course|lesson)/i,
      /^(can I|I'd like to)\s+(start|continue|complete)/i,
      /course/i,
      /lesson/i,
      /progress/i,
    ],
    contexts: ['course', 'learning', 'progress'],
  },
  {
    intent: AgentIntent.STUDENT_SUPPORT,
    agent: AIAgent.ELLIE,
    defaultPriority: TaskPriority.MEDIUM,
    keywords: [
      'help',
      'support',
      'question',
      'issue',
      'problem',
      'trouble',
      'confused',
      'confusing',
      'unclear',
      'lost',
      'stuck',
      'need',
      'want',
      'looking for',
      'searching',
      'information',
      'info',
      'details',
      'more about',
    ],
    patterns: [
      /^(i('m| am)|I)\s+(confused|having trouble|stuck|lost)/i,
      /^(can you|could you|would you)\s+(help|explain)/i,
      /^(i )?(need|want)\s+(help|to know)/i,
    ],
    contexts: ['support', 'help', 'question'],
  },
  {
    intent: AgentIntent.OPS,
    agent: AIAgent.LIZZY,
    defaultPriority: TaskPriority.MEDIUM,
    keywords: [
      'approve',
      'approval',
      'review',
      'admin',
      'queue',
      'document',
      'process',
      'operation',
      'workflow',
      'automation',
      'batch',
      'export',
      'import',
      'report',
      'analytics',
      'dashboard',
      'schedule',
      'calendar',
      'reminder',
      'notification',
      'update',
      'change',
      'modify',
      'edit',
    ],
    patterns: [
      /^(please|can you|could you)\s+(approve|review|process)/i,
      /^(add|remove|update|change)\s+(to|in)/i,
      /admin/i,
      /queue/i,
      /batch/i,
    ],
    contexts: ['admin', 'operation', 'workflow'],
  },
  {
    intent: AgentIntent.COMPLIANCE,
    agent: AIAgent.ZORA,
    defaultPriority: TaskPriority.HIGH,
    keywords: [
      'WIOA',
      'DOL',
      'compliance',
      'compliant',
      'credential',
      'audit',
      'certification',
      'regulation',
      'regulatory',
      'reporting',
      'report',
      'accreditation',
      'licensing',
      'license',
      'permit',
      'documentation',
      'records',
      'verification',
      'verify',
      'violation',
      'violation',
      'issue',
      'warning',
    ],
    patterns: [
      /^(is this|are we|are they)\s+(compliant|WIOA-certified)/i,
      /^(what is the|what are the)\s+(compliance|regulatory)\s+(requirement|rule)/i,
      /^(generate|create|submit)\s+(report|audit)/i,
      /WIOA/i,
      /DOL/i,
      /compliance/i,
      /audit/i,
    ],
    contexts: ['compliance', 'WIOA', 'DOL', 'regulatory'],
  },
  {
    intent: AgentIntent.CAREER_PLACEMENT,
    agent: AIAgent.ZORA,
    defaultPriority: TaskPriority.MEDIUM,
    keywords: [
      'job',
      'career',
      'placement',
      'hire',
      'hiring',
      'employment',
      'resume',
      'CV',
      'interview',
      'interviewing',
      'job search',
      'employer',
      'company',
      'workforce',
      'work',
      'career services',
      'salary',
      'wage',
      'compensation',
      'benefits',
      'networking',
      'connection',
      'referral',
    ],
    patterns: [
      /^(help me|I want to|I need to)\s+(find|get|land)\s+(a |an |the )?(job|work|employment)/i,
      /^(how('s| is)|what's)\s+(my|the)\s+(job|career)\s+(search|placement|progress)/i,
      /career/i,
      /placement/i,
      /job/i,
    ],
    contexts: ['career', 'job', 'placement', 'employment'],
  },
];

// Default rule for general queries
const DEFAULT_RULE: IntentRule = {
  intent: AgentIntent.GENERAL,
  agent: AIAgent.ROUTER,
  defaultPriority: TaskPriority.LOW,
  keywords: [],
  patterns: [],
};

// ============================================================
// Intent Router Implementation
// ============================================================

export class IntentRouter {
  private rules: IntentRule[];
  private classificationCache: Map<string, IntentClassification>;
  private readonly cacheMaxSize = 1000;

  constructor(customRules?: IntentRule[]) {
    this.rules = customRules || INTENT_RULES;
    this.classificationCache = new Map();
  }

  /**
   * Normalize text for matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if text matches any pattern
   */
  private matchesPatterns(text: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(text));
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordScore(text: string, keywords: string[]): number {
    const normalizedText = this.normalizeText(text);
    let score = 0;
    const matchedKeywords: string[] = [];

    keywords.forEach((keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      if (normalizedText.includes(normalizedKeyword)) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    });

    // Normalize score based on text length and keyword count
    const maxPossibleScore = Math.min(keywords.length, Math.ceil(normalizedText.length / 5));
    return maxPossibleScore > 0 ? Math.min(score / maxPossibleScore, 1) : 0;
  }

  /**
   * Check context match
   */
  private matchesContext(context?: Record<string, unknown>, rule?: IntentRule): boolean {
    if (!context || !rule?.contexts) return false;

    const contextStr = JSON.stringify(context).toLowerCase();
    return rule.contexts.some((ctx) => contextStr.includes(ctx.toLowerCase()));
  }

  /**
   * Classify an intent from text and optional context
   */
  classify(text: string, context?: Record<string, unknown>): IntentClassification {
    // Check cache first
    const cacheKey = `${text}:${JSON.stringify(context || {})}`;
    const cached = this.classificationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const normalizedText = this.normalizeText(text);
    let bestMatch: IntentRule | null = null;
    let highestScore = 0;
    const matchedKeywords: string[] = [];

    // Score each rule
    for (const rule of this.rules) {
      let score = 0;
      const ruleMatchedKeywords: string[] = [];

      // Pattern match (high weight)
      if (this.matchesPatterns(text, rule.patterns)) {
        score += 0.5;
      }

      // Keyword match
      const keywordScore = this.calculateKeywordScore(text, rule.keywords);
      score += keywordScore * 0.3;
      rule.keywords.forEach((kw) => {
        if (normalizedText.includes(kw.toLowerCase())) {
          ruleMatchedKeywords.push(kw);
        }
      });

      // Context match (bonus weight)
      if (this.matchesContext(context, rule)) {
        score += 0.2;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = rule;
        matchedKeywords.length = 0;
        matchedKeywords.push(...ruleMatchedKeywords);
      }
    }

    // Default to general if no good match
    if (!bestMatch || highestScore < 0.1) {
      bestMatch = DEFAULT_RULE;
    }

    // Calculate confidence (0-1)
    const confidence = Math.min(highestScore + 0.3, 1);

    const classification: IntentClassification = {
      intent: bestMatch.intent,
      confidence,
      params: this.extractParams(text, bestMatch),
      matchedKeywords,
    };

    // Cache the result
    if (this.classificationCache.size >= this.cacheMaxSize) {
      // Remove oldest entry
      const firstKey = this.classificationCache.keys().next().value;
      if (firstKey) {
        this.classificationCache.delete(firstKey);
      }
    }
    this.classificationCache.set(cacheKey, classification);

    return classification;
  }

  /**
   * Extract parameters from text based on intent
   */
  private extractParams(text: string, rule: IntentRule): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    const normalizedText = this.normalizeText(text);

    // Extract common patterns
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/i;
    const phonePattern = /(\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/;
    const namePattern = /(my name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
    const programPattern = /(program|course|class)\s+([A-Za-z0-9\s]+)/i;

    const emailMatch = text.match(emailPattern);
    if (emailMatch) params.email = emailMatch[0];

    const phoneMatch = text.match(phonePattern);
    if (phoneMatch) params.phone = phoneMatch[0];

    const nameMatch = text.match(namePattern);
    if (nameMatch) params.name = nameMatch[2];

    const programMatch = text.match(programPattern);
    if (programMatch) params.program = programMatch[2].trim();

    // Extract intent-specific keywords
    params.rawText = text;

    return params;
  }

  /**
   * Route a request to the appropriate agent with priority and task
   */
  route(request: AIRequest): RoutingDecision {
    const classification = this.classify(request.message, request.context);

    // If specific agent requested, use it
    let agent = classification.agent;
    if (request.agent) {
      agent = request.agent;
    }

    // Determine priority
    let priority = classification.confidence > 0.7 ? TaskPriority.HIGH : TaskPriority.MEDIUM;

    if (request.priority) {
      priority = request.priority;
    }

    // Apply default priority from rule
    const matchingRule = this.rules.find((r) => r.intent === classification.intent);
    if (matchingRule && priority === TaskPriority.MEDIUM) {
      priority = matchingRule.defaultPriority;
    }

    // Create task payload
    const task: TaskPayload = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentType: agent,
      intent: classification.intent,
      payload: {
        message: request.message,
        ...classification.params,
        ...request.context,
      },
      priority,
      status: 'QUEUED' as const,
      attempts: 0,
      maxAttempts: 3,
      timeout: 300000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: request.metadata,
    };

    return {
      agent,
      priority,
      task,
      confidence: classification.confidence,
    };
  }

  /**
   * Add custom rules
   */
  addRule(rule: IntentRule): void {
    this.rules.push(rule);
  }

  /**
   * Clear classification cache
   */
  clearCache(): void {
    this.classificationCache.clear();
  }

  /**
   * Get all registered rules
   */
  getRules(): IntentRule[] {
    return [...this.rules];
  }

  /**
   * Get intent metadata
   */
  getIntentMetadata(intent: AgentIntent): { agent: AIAgent; description: string } | null {
    const rule = this.rules.find((r) => r.intent === intent);
    if (!rule) return null;

    const descriptions: Record<AgentIntent, string> = {
      [AgentIntent.ADMISSION]:
        'Handles admission interviews, eligibility assessments, and program applications',
      [AgentIntent.STUDENT_SUPPORT]: 'Student support, questions, and general assistance',
      [AgentIntent.ENROLLMENT]: 'Enrollment, payment, and funding inquiries',
      [AgentIntent.COURSE_BUILDER]: 'Course progress, lessons, and learning management',
      [AgentIntent.COMPLIANCE]: 'Compliance, WIOA reporting, and regulatory requirements',
      [AgentIntent.OPS]: 'Operations, admin tasks, and workflow automation',
      [AgentIntent.CAREER_PLACEMENT]: 'Career services, job placement, and employment support',
      [AgentIntent.GENERAL]: 'General queries routed to the main router',
    };

    return {
      agent: rule.agent,
      description: descriptions[intent] || 'Unknown intent',
    };
  }
}

// ============================================================
// Singleton Instance
// ============================================================

let intentRouterInstance: IntentRouter | null = null;

export function getIntentRouter(): IntentRouter {
  if (!intentRouterInstance) {
    intentRouterInstance = new IntentRouter();
  }
  return intentRouterInstance;
}

export function resetIntentRouter(): void {
  intentRouterInstance = null;
}

export { AIAgent, AgentIntent, TaskPriority };
export type { AIRequest, IntentClassification, RoutingDecision, TaskPayload };
