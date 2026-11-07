/**
 * PARIS AI Integration - Claude (Anthropic)
 * Real AI integration for PARIS commands
 */

interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

import 'server-only';
import { aiChat } from '@/lib/ai/ai-service';
import { executeAICommand } from '@/lib/ai/runtime/command-executor';

export class ParisAI {
  /** Use the canonical provider runtime; errors must reach the caller. */
  async sendMessage(messages: ClaudeMessage[], systemPrompt?: string): Promise<string> {
    const result = await aiChat({
      messages: [
        { role: 'system', content: systemPrompt || this.getDefaultSystemPrompt() },
        ...messages,
      ],
    });
    if (!result.content?.trim()) throw new Error('PARIS_AI_EMPTY_RESPONSE');
    return result.content;
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
    // A language model response is never proof that a command executed.
    if (typeof context?.actorId !== 'string' || !context.actorId ||
        !Array.isArray(context.actorRoles) ||
        !context.actorRoles.every((role): role is string => typeof role === 'string') ||
        typeof context.adminOrigin !== 'string' || !context.adminOrigin) {
      return { success: false, message: 'Authenticated execution context is required.', actions: [] };
    }
    const result = await executeAICommand(command, {
      agent: 'PARIS', actorId: context.actorId, actorRoles: context.actorRoles,
      adminOrigin: context.adminOrigin,
      confirmationText: context.confirmationText,
      correlationId: typeof context.correlationId === 'string' ? context.correlationId : undefined,
    });
    return {
      success: result.ok && result.executed && result.status === 'completed',
      message: result.message,
      data: { status: result.status, executed: result.executed, payload: result.payload, traceId: result.traceId },
      actions: result.executed && result.tool ? [result.tool] : [],
    };
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
        suggestions: ['Review code manually'],
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
export function getParisAI(): ParisAI { return parisAI; }
