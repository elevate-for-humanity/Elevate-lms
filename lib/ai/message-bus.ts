/**
 * AI Gateway Module - Message Bus
 *
 * Pub/sub message bus for inter-agent communication.
 * Supports request/response patterns with correlation IDs.
 */

import { AIAgent, MessageType, MessageBusChannel } from './types';

import type { AgentMessage, MessageBusSubscription } from './types';

// ============================================================
// Message Types
// ============================================================

interface PendingRequest {
  resolve: (message: AgentMessage) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ============================================================
// Message Bus Implementation
// ============================================================

export class MessageBus {
  private subscribers: Map<string, Set<(message: AgentMessage) => void>> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private messageHistory: AgentMessage[] = [];
  private readonly maxHistorySize = 1000;
  private readonly defaultRequestTimeout = 30000; // 30 seconds

  constructor() {
    this.initializeChannels();
  }

  /**
   * Initialize default channels
   */
  private initializeChannels(): void {
    Object.values(MessageBusChannel).forEach((channel) => {
      this.subscribers.set(channel, new Set());
    });
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a correlation ID for request/response matching
   */
  generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store message in history
   */
  private addToHistory(message: AgentMessage): void {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
  }

  /**
   * Publish a message to a channel
   */
  publish(channel: string, message: AgentMessage): void {
    // Ensure channel exists
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }

    // Add message ID and timestamp if not present
    const enrichedMessage: AgentMessage = {
      ...message,
      id: message.id || this.generateMessageId(),
      timestamp: message.timestamp || Date.now(),
    };

    // Store in history
    this.addToHistory(enrichedMessage);

    // Deliver to all subscribers
    const subscribers = this.subscribers.get(channel);
    if (subscribers) {
      subscribers.forEach((handler) => {
        try {
          handler(enrichedMessage);
        } catch (error) {
          console.error(`Error in message handler for channel ${channel}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, handler: (message: AgentMessage) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }

    const subscribers = this.subscribers.get(channel)!;
    const wrappedHandler = (message: AgentMessage) => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error in subscription handler for channel ${channel}:`, error);
      }
    };

    subscribers.add(wrappedHandler);

    // Return unsubscribe function
    return () => {
      subscribers.delete(wrappedHandler);
    };
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    this.subscribers.delete(channel);
  }

  /**
   * Get all subscribers for a channel
   */
  getSubscribers(channel: string): number {
    return this.subscribers.get(channel)?.size || 0;
  }

  /**
   * Send a message directly to an agent (point-to-point)
   */
  sendToAgent(target: AIAgent, message: AgentMessage): void {
    const agentChannel = this.getChannelForAgent(target);
    this.publish(agentChannel, {
      ...message,
      target,
    });
  }

  /**
   * Broadcast to all agents
   */
  broadcast(message: AgentMessage): void {
    Object.values(MessageBusChannel).forEach((channel) => {
      this.publish(channel, message);
    });
  }

  /**
   * Request/response pattern with correlation IDs
   */
  request<T = AgentMessage>(
    channel: string,
    message: Omit<AgentMessage, 'correlationId'>,
    timeout?: number,
  ): Promise<T> {
    const correlationId = this.generateCorrelationId();
    const timeoutMs = timeout || this.defaultRequestTimeout;

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // Store pending request
      this.pendingRequests.set(correlationId, {
        resolve: resolve as (message: AgentMessage) => void,
        reject,
        timeout: timer,
      });

      // Send the request
      this.publish(channel, {
        ...message,
        correlationId,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Respond to a request
   */
  respond(originalMessage: AgentMessage, response: Partial<AgentMessage>): void {
    if (!originalMessage.correlationId) {
      throw new Error('Cannot respond to message without correlationId');
    }

    const pending = this.pendingRequests.get(originalMessage.correlationId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(originalMessage.correlationId);
      pending.resolve({
        ...response,
        correlationId: originalMessage.correlationId,
        timestamp: Date.now(),
      } as AgentMessage);
    }
  }

  /**
   * Get the channel name for an agent type
   */
  private getChannelForAgent(agent: AIAgent): MessageBusChannel {
    switch (agent) {
      case AIAgent.PARS:
      case AIAgent.PARIS:
        return MessageBusChannel.ADMISSIONS;
      case AIAgent.ELLIE:
        return MessageBusChannel.STUDENT_LIFECYCLE;
      case AIAgent.LIZZY:
        return MessageBusChannel.OPERATIONS;
      case AIAgent.ZORA:
        return MessageBusChannel.COMPLIANCE;
      case AIAgent.ROUTER:
      default:
        return MessageBusChannel.SYSTEM;
    }
  }

  /**
   * Get messages by channel
   */
  getMessagesByChannel(channel: string, limit?: number): AgentMessage[] {
    const messages = this.messageHistory.filter((m) => m.channel === channel);
    if (limit) {
      return messages.slice(-limit);
    }
    return messages;
  }

  /**
   * Get messages by correlation ID
   */
  getMessagesByCorrelation(correlationId: string): AgentMessage[] {
    return this.messageHistory.filter((m) => m.correlationId === correlationId);
  }

  /**
   * Get message history
   */
  getHistory(limit?: number): AgentMessage[] {
    if (limit) {
      return this.messageHistory.slice(-limit);
    }
    return [...this.messageHistory];
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Get bus statistics
   */
  getStats(): {
    channels: Record<string, number>;
    pendingRequests: number;
    historySize: number;
    maxHistorySize: number;
  } {
    const channels: Record<string, number> = {};
    this.subscribers.forEach((subs, channel) => {
      channels[channel] = subs.size;
    });

    return {
      channels,
      pendingRequests: this.pendingRequests.size,
      historySize: this.messageHistory.length,
      maxHistorySize: this.maxHistorySize,
    };
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Create a new agent message
 */
export function createAgentMessage(
  type: MessageType,
  source: AIAgent,
  payload: Record<string, unknown>,
  options?: {
    target?: AIAgent;
    channel?: MessageBusChannel;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  },
): AgentMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    source,
    target: options?.target,
    channel: options?.channel,
    payload,
    correlationId: options?.correlationId,
    timestamp: Date.now(),
    metadata: options?.metadata,
  };
}

/**
 * Create a task-assigned message
 */
export function createTaskAssignedMessage(
  taskId: string,
  agent: AIAgent,
  source: AIAgent,
  correlationId?: string,
): AgentMessage {
  return createAgentMessage(
    MessageType.TASK_ASSIGNED,
    source,
    { taskId, agent },
    {
      target: agent,
      correlationId,
    },
  );
}

/**
 * Create a task-completed message
 */
export function createTaskCompletedMessage(
  taskId: string,
  result: unknown,
  source: AIAgent,
  correlationId?: string,
): AgentMessage {
  return createAgentMessage(
    MessageType.TASK_COMPLETED,
    source,
    { taskId, result },
    {
      correlationId,
    },
  );
}

/**
 * Create a task-failed message
 */
export function createTaskFailedMessage(
  taskId: string,
  error: string,
  source: AIAgent,
  correlationId?: string,
): AgentMessage {
  return createAgentMessage(
    MessageType.TASK_FAILED,
    source,
    { taskId, error },
    {
      correlationId,
    },
  );
}

/**
 * Create an event message
 */
export function createEventMessage(
  eventType: string,
  data: Record<string, unknown>,
  source: AIAgent,
  metadata?: Record<string, unknown>,
): AgentMessage {
  return createAgentMessage(
    MessageType.EVENT,
    source,
    { eventType, ...data },
    {
      metadata,
    },
  );
}

/**
 * Create a notification message
 */
export function createNotificationMessage(
  title: string,
  body: string,
  source: AIAgent,
  recipient?: AIAgent,
  metadata?: Record<string, unknown>,
): AgentMessage {
  return createAgentMessage(
    MessageType.NOTIFICATION,
    source,
    { title, body },
    {
      target: recipient,
      metadata,
    },
  );
}

/**
 * Create an approval-required message
 */
export function createApprovalRequiredMessage(
  taskId: string,
  requester: AIAgent,
  approver: AIAgent,
  details: Record<string, unknown>,
  correlationId?: string,
): AgentMessage {
  return createAgentMessage(
    MessageType.APPROVAL_REQUIRED,
    requester,
    { taskId, details },
    {
      target: approver,
      correlationId,
    },
  );
}

// ============================================================
// Singleton Instance
// ============================================================

let messageBusInstance: MessageBus | null = null;

export function getMessageBus(): MessageBus {
  if (!messageBusInstance) {
    messageBusInstance = new MessageBus();
  }
  return messageBusInstance;
}

export function resetMessageBus(): void {
  messageBusInstance = null;
}

export { AIAgent, MessageType, MessageBusChannel };
export type { AgentMessage };
