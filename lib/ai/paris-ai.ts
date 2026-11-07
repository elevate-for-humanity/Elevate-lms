/**
 * PARIS AI Integration - Claude (Anthropic)
 * Real AI integration for PARIS commands
 */

interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ClaudeResponse {
  id: string;
  model: string;
  content: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export class ParisAI {
  private apiKey: string;
  private model: string;
  private maxTokens: number;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096');
  }

  /**
   * Send a message to Claude
   */
  async sendMessage(
    messages: ClaudeMessage[],
    systemPrompt?: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('PARIS_AI_PROVIDER_NOT_CONFIGURED: ANTHROPIC_API_KEY is missing. No command was executed.');
    }

    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          system: systemPrompt || this.getDefaultSystemPrompt(),
          messages: messages.filter(m => m.role !== 'system'),
        }),
      });

      if (!response.ok) {
        throw new Error(`PARIS_AI_PROVIDER_HTTP_${response.status}: No command was executed.`);
      }

      const data = await response.json();
      const content = Array.isArray(data.content)
        ? data.content.filter((block: { type: string; text?: string }) => block.type === 'text' && typeof block.text === 'string').map((block: { text: string }) => block.text).join('\n')
        : '';
      if (!content.trim()) throw new Error('PARIS_AI_PROVIDER_EMPTY_RESPONSE');
      return content;
  }

  /**
   * Execute a PARIS command
   */
  async executeCommand(command: string, context?: Record<string, unknown>): Promise<{
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
    actions?: string[];
  }> {
    const prompt = `
Command: ${command}
Context: ${JSON.stringify(context || {})}

Analyze this command and determine what PARIS should do. Return a JSON response with:
- success: boolean
- message: What PARIS is doing
- data: Any relevant data (urls, IDs, etc.)
- actions: Array of actions being taken
`;

    const response = await this.sendMessage([
      { role: 'user', content: prompt }
    ]);

    try {
      const parsed = JSON.parse(response);
      return {
        success: false,
        message: 'Command analyzed only. Execute it through the authenticated PARIS tool controller to obtain an execution receipt.',
        data: { proposal: parsed, executed: false },
        actions: [],
      };
    } catch {
      return {
        success: false,
        message: 'Command analysis returned no executable tool receipt. No command was executed.',
        data: { analysis: response, executed: false },
        actions: [],
      };
    }
  }

  /**
   * Generate content with AI
   */
  async generateContent(
    type: 'post' | 'article' | 'email' | 'social' | 'video',
    topic: string,
    options?: {
      platform?: string;
      tone?: string;
      length?: number;
    }
  ): Promise<{
    title?: string;
    content: string;
    hashtags?: string[];
    suggestions?: string[];
  }> {
    const prompt = `
Generate a ${type} about: ${topic}
Platform: ${options?.platform || 'general'}
Tone: ${options?.tone || 'professional'}
Length: ${options?.length || 500} words

Return JSON with title, content, hashtags (for social), and suggestions.
`;

    const response = await this.sendMessage([
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        content: response,
        hashtags: [`#${topic.replace(/\s+/g, '')}`],
        suggestions: ['Review content', 'Add images', 'Publish'],
      };
    }
  }

  /**
   * Analyze code/repository
   */
  async analyzeCode(code: string, language?: string): Promise<{
    summary: string;
    issues?: string[];
    suggestions?: string[];
    complexity?: 'low' | 'medium' | 'high';
  }> {
    const prompt = `
Analyze this ${language || 'code'}:

${code.substring(0, 5000)}

Return JSON with:
- summary: Brief description
- issues: Array of potential issues
- suggestions: Improvement suggestions
- complexity: low/medium/high
`;

    const response = await this.sendMessage([
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return {
        summary: response.substring(0, 500),
        issues: [],
        suggestions: ['Review code manually'],
        complexity: 'medium',
      };
    }
  }

  /**
   * Get default system prompt for PARIS
   */
  private getDefaultSystemPrompt(): string {
    return `You are PARIS, an AI Operating System for Elevate for Humanity.
You help with:
- Building and updating website pages
- Creating AI agents (workforce)
- Generating marketing content
- Managing media assets
- Connecting APIs and integrations
- Analyzing code and repositories

Be helpful, efficient, and follow brand guidelines.`;
  }

}

// Export singleton instance
export const parisAI = new ParisAI();

// Export for use in API routes
export function getParisAI(): ParisAI {
  return parisAI;
}
