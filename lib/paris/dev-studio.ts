/**
 * PARIS Dev Studio - Main Integration
 * Unifies all PARIS components into a cohesive development environment
 */

export * from './import-engine';
export * from './workforce';
export * from './marketing';

import { importSource, quickAnalyze } from './import-engine';
import { hireAgent, getAgentTeam, executeAgentTask } from './workforce';
import { createCampaign, generateWeeklyContent, generateVideoScript } from './marketing';
import type { AIAgent, AgentRole } from './workforce/types';
import type { SocialPlatform } from './marketing/types';
import type { GeneratedContent, VideoScript } from './marketing/types';

// Command intents
export type CommandIntent =
  | 'import'
  | 'create_agent'
  | 'hire_agent'
  | 'generate_content'
  | 'publish_content'
  | 'create_campaign'
  | 'build_feature'
  | 'fix_bug'
  | 'analyze_repo'
  | 'connect_api'
  | 'unknown';

export interface ParsedCommand {
  intent: CommandIntent;
  entities: {
    source?: string;
    role?: AgentRole;
    platform?: SocialPlatform;
    topic?: string;
    template?: string;
    url?: string;
    type?: string;
    [key: string]: string | undefined;
  };
  confidence: number;
  originalCommand: string;
}

/**
 * Parse natural language command
 */
export function parseCommand(command: string): ParsedCommand {
  const lower = command.toLowerCase();
  
  // Import commands
  if (/import.*repo|import.*github|import.*repository/.test(lower)) {
    const url = extractUrl(command);
    return {
      intent: 'import',
      entities: { source: 'github', url },
      confidence: 90,
      originalCommand: command,
    };
  }

  // API import commands
  if (/connect.*api|import.*api|use.*api/.test(lower)) {
    const url = extractUrl(command);
    return {
      intent: 'connect_api',
      entities: { url },
      confidence: 85,
      originalCommand: command,
    };
  }

  // Agent creation commands
  if (/hire|create.*agent|new.*agent|add.*agent/.test(lower)) {
    const role = detectAgentRole(lower);
    return {
      intent: 'hire_agent',
      entities: { role },
      confidence: role ? 90 : 60,
      originalCommand: command,
    };
  }

  // Content generation commands
  if (/generate.*content|create.*post|write.*content|make.*content/.test(lower)) {
    const platform = detectPlatform(lower);
    const topic = extractTopic(command);
    return {
      intent: 'generate_content',
      entities: { platform, topic },
      confidence: 80,
      originalCommand: command,
    };
  }

  // Campaign creation
  if (/create.*campaign|start.*campaign|launch.*campaign/.test(lower)) {
    const campaignType = detectCampaignType(lower);
    return {
      intent: 'create_campaign',
      entities: { type: campaignType },
      confidence: 85,
      originalCommand: command,
    };
  }

  // Video creation
  if (/make.*video|create.*video|generate.*video|make.*reel|create.*reel/.test(lower)) {
    const topic = extractTopic(command);
    const type = lower.includes('reel') || lower.includes('tiktok') ? 'reel' : 'promo';
    return {
      intent: 'generate_content',
      entities: { topic, type },
      confidence: 85,
      originalCommand: command,
    };
  }

  // Publish commands
  if (/publish|post.*now|schedule|share.*now/.test(lower)) {
    return {
      intent: 'publish_content',
      entities: {},
      confidence: 70,
      originalCommand: command,
    };
  }

  // Analysis commands
  if (/analyze|check.*repo|review.*code/.test(lower)) {
    const url = extractUrl(command);
    return {
      intent: 'analyze_repo',
      entities: { url },
      confidence: 80,
      originalCommand: command,
    };
  }

  return {
    intent: 'unknown',
    entities: {},
    confidence: 0,
    originalCommand: command,
  };
}

/**
 * Execute parsed command
 */
export async function executeCommand(
  parsed: ParsedCommand,
  context?: {
    orgId?: string;
    userId?: string;
  }
): Promise<{
  success: boolean;
  result?: unknown;
  error?: string;
  followUp?: string;
}> {
  try {
    switch (parsed.intent) {
      case 'import':
        return await executeImport(parsed.entities.url!);
      
      case 'connect_api':
        return await executeApiConnection(parsed.entities.url!);
      
      case 'hire_agent':
        if (!parsed.entities.role || !context?.userId) {
          return { success: false, error: 'Missing agent role or user ID' };
        }
        return await executeHireAgent(parsed.entities.role, context.userId);
      
      case 'generate_content':
        return await executeGenerateContent(parsed.entities);
      
      case 'create_campaign':
        return await executeCreateCampaign(parsed.entities);
      
      case 'publish_content':
        return { success: true, result: { message: 'Content queued for publishing' } };
      
      case 'analyze_repo':
        return await executeAnalyze(parsed.entities.url!);
      
      default:
        return {
          success: false,
          error: 'I can help with importing code, creating AI agents, generating marketing content, and more. Try saying "Import this GitHub repo" or "Create a recruitment agent".',
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute import
 */
async function executeImport(url: string) {
  const result = await importSource({
    source: 'github',
    url,
  });

  if (result.success) {
    return {
      success: true,
      result: {
        message: 'Import complete!',
        analysis: result.analysis,
        compatibility: result.compatibility,
      },
      followUp: 'Would you like me to generate a compatibility report or start importing the components?',
    };
  }

  return { success: false, error: result.errors?.join(', ') };
}

/**
 * Execute API connection
 */
async function executeApiConnection(url: string) {
  const result = await importSource({
    source: 'openapi',
    url,
  });

  if (result.success) {
    return {
      success: true,
      result: {
        message: 'API connected!',
        endpoints: (result.analysis as any)?.endpoints?.length || 0,
      },
    };
  }

  return { success: false, error: result.errors?.join(', ') };
}

/**
 * Execute hire agent
 */
async function executeHireAgent(role: AgentRole, userId: string) {
  const agent = await hireAgent(userId, role);

  if (agent) {
    return {
      success: true,
      result: {
        message: `${agent.name} hired!`,
        agentId: agent.id,
        role: agent.role,
      },
      followUp: `${agent.name} is ready. Would you like to train them with any specific knowledge or set up their permissions?`,
    };
  }

  return { success: false, error: 'Failed to create agent' };
}

/**
 * Execute content generation
 */
async function executeGenerateContent(entities: Record<string, string | undefined>) {
  const topic = entities.topic || 'career training';
  const type = entities.type || 'reel';

  const video = await generateVideoScript(topic, {
    type: type as 'reel' | 'tiktok',
    style: 'informative',
    includeVoiceover: true,
  });

  return {
    success: true,
    result: {
      message: 'Content generated!',
      video,
    },
    followUp: 'Would you like me to publish this or make any adjustments?',
  };
}

/**
 * Execute campaign creation
 */
async function executeCreateCampaign(entities: Record<string, string | undefined>) {
  const type = entities.type || 'program_launch';
  
  const campaign = await createCampaign(type as any, {
    title: entities.title || 'New Campaign',
    description: entities.description || 'Campaign content',
    platforms: ['facebook', 'instagram', 'linkedin'],
    includeVideo: true,
  });

  return {
    success: true,
    result: {
      message: 'Campaign created!',
      contentCount: campaign.content.length,
      videos: campaign.videos?.length,
    },
    followUp: 'Your campaign is ready. Would you like to schedule it or review the content first?',
  };
}

/**
 * Execute repo analysis
 */
async function executeAnalyze(url: string) {
  const analysis = await quickAnalyze(url);

  if (analysis) {
    return {
      success: true,
      result: {
        framework: analysis.framework,
        database: analysis.database,
        components: analysis.components,
        routes: analysis.routes,
        confidence: analysis.confidence,
      },
    };
  }

  return { success: false, error: 'Could not analyze repository' };
}

// Helper functions
function extractUrl(command: string): string | undefined {
  const urlPattern = /https?:\/\/[^\s]+/;
  const match = command.match(urlPattern);
  return match?.[0];
}

function detectAgentRole(text: string): AgentRole | undefined {
  const roleMap: Record<string, AgentRole> = {
    'recruit': 'recruiter',
    'admission': 'admissions_specialist',
    'career coach': 'career_coach',
    'grant': 'grant_writer',
    'compliance': 'compliance_officer',
    'instructor': 'instructor',
    'marketing': 'marketing_manager',
    'social': 'social_media_manager',
    'support': 'customer_support',
    'developer': 'software_developer',
    'designer': 'website_designer',
    'data': 'data_analyst',
    'content': 'content_creator',
    'executive': 'executive_assistant',
  };

  for (const [key, role] of Object.entries(roleMap)) {
    if (text.includes(key)) {
      return role;
    }
  }

  return undefined;
}

function detectPlatform(text: string): SocialPlatform | undefined {
  const platforms: (SocialPlatform | undefined)[] = [
    text.includes('facebook') ? 'facebook' : undefined,
    text.includes('instagram') ? 'instagram' : undefined,
    text.includes('linkedin') ? 'linkedin' : undefined,
    text.includes('twitter') ? 'twitter' : undefined,
    text.includes('tiktok') ? 'tiktok' : undefined,
  ];

  return platforms.find(p => p !== undefined);
}

function extractTopic(command: string): string | undefined {
  // Remove common prefixes and extract topic
  const cleaned = command
    .replace(/create|generate|make|write/i, '')
    .replace(/content|post|video|reel|article/i, '')
    .trim();
  
  return cleaned.length > 2 ? cleaned : undefined;
}

function detectCampaignType(text: string): string {
  if (text.includes('program') || text.includes('launch')) return 'program_launch';
  if (text.includes('success') || text.includes('story')) return 'success_story';
  if (text.includes('funding')) return 'funding_reminder';
  if (text.includes('event')) return 'event';
  return 'program_launch';
}

/**
 * Main command handler
 */
export async function parisCommand(
  command: string,
  context?: {
    orgId?: string;
    userId?: string;
  }
): Promise<{
  success: boolean;
  result?: unknown;
  error?: string;
  followUp?: string;
  parsed?: ParsedCommand;
}> {
  // Parse the command
  const parsed = parseCommand(command);
  
  // Execute the command
  const result = await executeCommand(parsed, context);

  return {
    ...result,
    parsed,
  };
}

/**
 * Get available commands
 */
export function getAvailableCommands(): {
  category: string;
  commands: { phrase: string; description: string }[];
}[] {
  return [
    {
      category: 'Import & Integration',
      commands: [
        { phrase: 'Import this GitHub repository', description: 'Analyze and import a codebase' },
        { phrase: 'Connect to an API', description: 'Import an OpenAPI specification' },
        { phrase: 'Analyze this repo', description: 'Quick analysis of a GitHub repository' },
      ],
    },
    {
      category: 'AI Workforce',
      commands: [
        { phrase: 'Hire a recruiter agent', description: 'Create an AI recruiter employee' },
        { phrase: 'Create a marketing agent', description: 'Create an AI marketing specialist' },
        { phrase: 'Add a support agent', description: 'Create an AI customer support agent' },
      ],
    },
    {
      category: 'Content Creation',
      commands: [
        { phrase: 'Generate marketing content', description: 'Create social media posts' },
        { phrase: 'Make a video reel', description: 'Create a short-form video script' },
        { phrase: 'Create a campaign', description: 'Generate a complete marketing campaign' },
      ],
    },
    {
      category: 'Publishing',
      commands: [
        { phrase: 'Publish to all platforms', description: 'Share content on social media' },
        { phrase: 'Schedule for tomorrow', description: 'Schedule content for later' },
        { phrase: 'Create content calendar', description: 'Plan content for a week' },
      ],
    },
  ];
}
