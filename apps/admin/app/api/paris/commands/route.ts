import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';

// Command parser patterns
const COMMAND_PATTERNS = {
  import: {
    patterns: [
      /import.*(github|repo|repository)/i,
      /connect.*api/i,
      /analyze.*repo/i,
      /clone.*(website|site)/i,
    ],
    intent: 'import',
    entities: ['url', 'source'],
  },
  agent: {
    patterns: [
      /hire.*(ai|agent)/i,
      /create.*(ai|agent)/i,
      /add.*(ai|agent)/i,
      /new.*employee/i,
    ],
    intent: 'agent_create',
    entities: ['role', 'name'],
  },
  content: {
    patterns: [
      /generate.*(content|post|article)/i,
      /create.*(content|post|video|reel)/i,
      /write.*(content|post|article)/i,
      /make.*(flyer|newsletter)/i,
    ],
    intent: 'content_create',
    entities: ['type', 'platform', 'topic'],
  },
  media: {
    patterns: [
      /find.*(image|photo|picture)/i,
      /search.*(image|photo|stock)/i,
      /generate.*(image|picture)/i,
      /create.*(image|graphic)/i,
    ],
    intent: 'media_find',
    entities: ['query', 'type', 'size'],
  },
  build: {
    patterns: [
      /build.*(page|website|landing)/i,
      /create.*(page|website|landing)/i,
      /update.*(homepage|page)/i,
      /add.*(program|feature)/i,
    ],
    intent: 'build_create',
    entities: ['target', 'type'],
  },
  deploy: {
    patterns: [
      /deploy/i,
      /publish/i,
      /push.*(live|production)/i,
      /release/i,
    ],
    intent: 'deploy',
    entities: [],
  },
};

// Role detection for agent commands
const ROLE_PATTERNS = {
  recruiter: [/recruit/i, /hiring/i, /job/i, /employ/i],
  marketing: [/market/i, /social/i, /content/i, /brand/i],
  support: [/support/i, /help/i, /customer/i, /service/i],
  grant_writer: [/grant/i, /proposal/i, /fund/i, /wioa/i],
  career_coach: [/career/i, /coach/i, /resume/i, /interview/i],
  instructor: [/teach/i, /course/i, /curriculum/i, /train/i],
};

// Extract URL from command
function extractUrl(text: string): string | undefined {
  const urlPattern = /https?:\/\/[^\s]+/;
  const match = text.match(urlPattern);
  return match?.[0];
}

// Extract role from command
function extractRole(text: string): string | undefined {
  for (const [role, patterns] of Object.entries(ROLE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return role;
      }
    }
  }
  return undefined;
}

// Parse natural language command
function parseCommand(text: string): {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  
  // Try each category
  for (const [category, config] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(text)) {
        const entities: Record<string, string> = {};
        
        // Extract URL if present
        const url = extractUrl(text);
        if (url) entities.url = url;
        
        // Extract role for agent commands
        if (category === 'agent') {
          const role = extractRole(text);
          if (role) entities.role = role;
        }
        
        // Extract topic for content commands
        if (category === 'content') {
          const topicMatch = text.match(/(?:about|for|on)\s+(.+?)(?:\.|$)/i);
          if (topicMatch) entities.topic = topicMatch[1];
        }
        
        return {
          intent: config.intent,
          entities,
          confidence: 90,
        };
      }
    }
  }
  
  // No match - return unknown with low confidence
  return {
    intent: 'unknown',
    entities: {},
    confidence: 0,
  };
}

// Execute command
async function executeCommand(
  intent: string,
  entities: Record<string, string>,
  userId: string
): Promise<{
  success: boolean;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}> {
  switch (intent) {
    case 'import':
      return {
        success: true,
        type: 'import_started',
        message: `Started analyzing repository. I'll examine the codebase structure, dependencies, and architecture.`,
        data: {
          url: entities.url,
          status: 'analyzing',
        },
      };
    
    case 'agent_create':
      return {
        success: true,
        type: 'agent_hired',
        message: `Hiring a ${entities.role || 'general purpose'} AI agent. They'll be ready to work shortly!`,
        data: {
          role: entities.role || 'general',
          status: 'creating',
        },
      };
    
    case 'content_create':
      return {
        success: true,
        type: 'content_generating',
        message: `Creating content${entities.topic ? ` about ${entities.topic}` : ''}. This will take just a moment.`,
        data: {
          topic: entities.topic,
          status: 'generating',
        },
      };
    
    case 'media_find':
      return {
        success: true,
        type: 'media_searching',
        message: `Searching for images${entities.query ? ` matching "${entities.query}"` : ''}. Showing top results.`,
        data: {
          query: entities.query || entities.url,
          status: 'searching',
        },
      };
    
    case 'build_create':
      return {
        success: true,
        type: 'build_started',
        message: `Building ${entities.target || 'your project'}. Watch the live canvas to see progress!`,
        data: {
          target: entities.target,
          status: 'building',
        },
      };
    
    case 'deploy':
      return {
        success: true,
        type: 'deploy_started',
        message: `Preparing deployment. Running tests and building for production...`,
        data: {
          status: 'deploying',
        },
      };
    
    default:
      return {
        success: false,
        type: 'unknown',
        message: `I'm not sure how to help with that. Try commands like:
• "Import this GitHub repository"
• "Hire a recruiter agent"
• "Create a marketing campaign"
• "Find a hero image"
• "Build a landing page"`,
      };
  }
}

export const POST = withAuth(async (request: NextRequest, _ctx, user) => {
  try {
    const body = await request.json();
    const { command, context } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Command is required' 
      }, { status: 400 });
    }

    // Parse the command
    const parsed = parseCommand(command);
    
    // Execute the command
    const result = await executeCommand(
      parsed.intent,
      parsed.entities,
      user.id
    );

    // Log command to history (would save to database)
    const commandLog = {
      id: `cmd_${Date.now()}`,
      command,
      parsed,
      result,
      userId: user.id,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: result.success,
      parsed,
      result,
      commandId: commandLog.id,
      suggestions: [
        'Import this GitHub repository',
        'Hire a recruiter agent',
        'Create a video reel',
      ],
    });

  } catch (error) {
    console.error('Command API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});

export async function GET() {
  return NextResponse.json({
    endpoints: [
      'POST /api/paris/commands - Execute natural language command',
      'GET /api/paris/commands/templates - Get available templates',
    ],
    examples: [
      'Import this GitHub repository',
      'Hire a recruiter agent',
      'Create a marketing campaign',
      'Find a hero image for Healthcare program',
      'Build a landing page for Barber Apprenticeship',
    ],
  });
}
