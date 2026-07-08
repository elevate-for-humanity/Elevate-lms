/**
 * OpenHands Agent Core for Open Studio
 * 
 * This module provides the core agent integration using OpenHands SDK concepts.
 * It handles conversation management, tool execution, and skill activation.
 */

import { createClient } from '@/lib/supabase/client';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: {
    tool?: string;
    toolInput?: string;
    toolOutput?: string;
    skill?: string;
  };
}

export interface AgentConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
  config: AgentConfig;
}

const DEFAULT_SYSTEM_PROMPT = `You are Ellie, an AI coding assistant for Elevate for Humanity's Open Studio.

You help users:
- Write, debug, and refactor code
- Build course content and curriculum
- Deploy applications to Northflank
- Create automation workflows
- Answer questions about the Elevate LMS platform

You have access to:
- File system tools for reading/writing code
- Terminal tools for running commands
- Git tools for version control
- Northflank deployment tools
- Course builder APIs

Always be helpful, concise, and technical when needed.`;

export class OpenStudioAgent {
  private config: AgentConfig;
  private messages: AgentMessage[] = [];
  private sessionId: string | null = null;
  private supabase = createClient();

  constructor(config: AgentConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      ...config,
    };
  }

  /**
   * Initialize the agent with system prompt
   */
  async initialize(): Promise<void> {
    // Add system message
    this.messages.push({
      id: crypto.randomUUID(),
      role: 'system',
      content: this.config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      timestamp: Date.now(),
    });

    // Try to load existing session from localStorage
    const savedSession = localStorage.getItem('openstudio_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession) as ConversationSession;
        this.sessionId = session.id;
        this.messages = session.messages;
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    }
  }

  /**
   * Send a message and get response
   */
  async sendMessage(content: string): Promise<AgentMessage> {
    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    this.messages.push(userMessage);

    try {
      // Call the chat API
      const response = await fetch('/api/devstudio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.messages,
          config: this.config,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || data.content || 'No response',
        timestamp: Date.now(),
        metadata: data.metadata,
      };
      
      this.messages.push(assistantMessage);
      this.saveSession();
      
      return assistantMessage;
    } catch (error) {
      // Create error message
      const errorMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: Date.now(),
      };
      this.messages.push(errorMessage);
      return errorMessage;
    }
  }

  /**
   * Save current session to localStorage
   */
  private saveSession(): void {
    const session: ConversationSession = {
      id: this.sessionId || crypto.randomUUID(),
      title: this.getSessionTitle(),
      messages: this.messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: this.config,
    };
    this.sessionId = session.id;
    localStorage.setItem('openstudio_session', JSON.stringify(session));
  }

  /**
   * Get a title for the session based on first user message
   */
  private getSessionTitle(): string {
    const firstUserMsg = this.messages.find(m => m.role === 'user');
    if (firstUserMsg) {
      const title = firstUserMsg.content.slice(0, 50);
      return title.length < firstUserMsg.content.length ? `${title}...` : title;
    }
    return 'New Conversation';
  }

  /**
   * Get all messages
   */
  getMessages(): AgentMessage[] {
    return this.messages;
  }

  /**
   * Clear conversation
   */
  clearConversation(): void {
    this.messages = [];
    this.sessionId = null;
    localStorage.removeItem('openstudio_session');
    this.initialize();
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Check for skill triggers in message
   */
  detectSkillTrigger(message: string): string | null {
    const skillTriggers: Record<string, string> = {
      'create a skill': 'skill-creator',
      'write a skill': 'skill-creator',
      'build a skill': 'skill-creator',
      'github': 'github',
      'create pr': 'github',
      'open pr': 'github',
      'jupyter': 'jupyter',
      'notebook': 'jupyter',
      'docker': 'docker',
      'container': 'docker',
      'kubernetes': 'kubernetes',
      'k8s': 'kubernetes',
      'slack': 'slack',
      'discord': 'discord',
      'linear': 'linear',
      'jira': 'linear',
      'deploy': 'github-actions',
      'ci/cd': 'github-actions',
      'workflow': 'github-actions',
    };

    const lowerMessage = message.toLowerCase();
    for (const [trigger, skill] of Object.entries(skillTriggers)) {
      if (lowerMessage.includes(trigger)) {
        return skill;
      }
    }
    return null;
  }
}

// Singleton instance
let agentInstance: OpenStudioAgent | null = null;

export function getAgent(config?: AgentConfig): OpenStudioAgent {
  if (!agentInstance && config) {
    agentInstance = new OpenStudioAgent(config);
    agentInstance.initialize();
  }
  if (!agentInstance) {
    agentInstance = new OpenStudioAgent({ model: 'gpt-4' });
    agentInstance.initialize();
  }
  return agentInstance;
}

export function resetAgent(): void {
  agentInstance = null;
}

export default OpenStudioAgent;