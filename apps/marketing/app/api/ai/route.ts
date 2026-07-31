/**
 * AI Gateway API Route
 * 
 * Main entry point for all AI agent interactions.
 * Routes intents, manages agents, and orchestrates tasks.
 */

import { NextRequest, NextResponse } from 'next/server';

// Import AI Gateway modules
import {
  AIAgent,
  AgentIntent,
  TaskPriority,
  TaskStatus,
  AIRequest,
  AIResponse,
  TaskPayload,
  GatewayHealthStatus,
  AgentHealthStatus,
  TaskFilterOptions,
} from '@/lib/ai/types';

import {
  AgentRegistry,
  getAgentRegistry,
} from '@/lib/ai/agent-registry';

import {
  MessageBus,
  getMessageBus,
  createAgentMessage,
  createTaskAssignedMessage,
  createTaskCompletedMessage,
  createTaskFailedMessage,
  MessageType,
} from '@/lib/ai/message-bus';

import {
  IntentRouter,
  getIntentRouter,
  RoutingDecision,
} from '@/lib/ai/intent-router';

import {
  TaskOrchestrator,
  getTaskOrchestrator,
} from '@/lib/ai/task-orchestrator';

import {
  EventPublisher,
  getEventPublisher,
  EventType,
} from '@/lib/ai/event-publisher';

// ============================================================
// Gateway Implementation
// ============================================================

class AIGateway {
  private registry: AgentRegistry;
  private messageBus: MessageBus;
  private intentRouter: IntentRouter;
  private taskOrchestrator: TaskOrchestrator;
  private eventPublisher: EventPublisher;
  private startTime: number;

  constructor() {
    this.registry = getAgentRegistry();
    this.messageBus = getMessageBus();
    this.intentRouter = getIntentRouter();
    this.taskOrchestrator = getTaskOrchestrator();
    this.eventPublisher = getEventPublisher();
    this.startTime = Date.now();
  }

  /**
   * Process an AI request
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    // Route the request
    const routingDecision = this.intentRouter.route(request);
    
    // Select the agent
    const agent = routingDecision.agent;
    
    // Create task
    const taskId = this.taskOrchestrator.createTask(
      agent,
      routingDecision.task.intent,
      routingDecision.task.payload,
      routingDecision.priority
    );

    // Get the created task
    const task = this.taskOrchestrator.getTask(taskId);
    if (!task) {
      throw new Error('Failed to create task');
    }

    // Publish task assigned event
    this.publishTaskEvent(task, 'TASK_ASSIGNED');

    // Publish to message bus
    const message = createTaskAssignedMessage(
      taskId,
      agent,
      AIAgent.ROUTER
    );
    this.messageBus.publish(agent.toLowerCase(), message);

    // Execute the task (simulated - in production, this would call the actual agent)
    try {
      const result = await this.executeTask(task);
      
      // Complete the task
      this.taskOrchestrator.completeTask(taskId, result);
      
      // Publish completion event
      this.publishTaskEvent(task, 'TASK_COMPLETED');
      
      // Publish completion message
      const completionMessage = createTaskCompletedMessage(
        taskId,
        result,
        agent
      );
      this.messageBus.publish(agent.toLowerCase(), completionMessage);

      return {
        taskId,
        agent,
        intent: routingDecision.task.intent,
        result,
        nextSteps: this.generateNextSteps(routingDecision.task.intent),
        metadata: {
          confidence: routingDecision.confidence,
          routingTime: Date.now() - request.metadata?.startTime as number || 0,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Fail the task
      this.taskOrchestrator.failTask(taskId, errorMessage);
      
      // Publish failure event
      this.publishTaskEvent(task, 'TASK_FAILED');
      
      // Publish failure message
      const failureMessage = createTaskFailedMessage(
        taskId,
        errorMessage,
        agent
      );
      this.messageBus.publish(agent.toLowerCase(), failureMessage);

      return {
        taskId,
        agent,
        intent: routingDecision.task.intent,
        result: null,
        error: errorMessage,
        metadata: {
          confidence: routingDecision.confidence,
          routingTime: Date.now() - request.metadata?.startTime as number || 0,
        },
      };
    }
  }

  /**
   * Execute a task (placeholder for actual agent execution)
   */
  private async executeTask(task: TaskPayload): Promise<unknown> {
    // Mark task as in progress
    this.taskOrchestrator.startTask(task.id);

    // Simulate task execution based on intent
    // In production, this would call the actual agent APIs
    return await this.simulateAgentExecution(task);
  }

  /**
   * Simulate agent execution for demo purposes
   */
  private async simulateAgentExecution(task: TaskPayload): Promise<unknown> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    switch (task.intent) {
      case AgentIntent.ADMISSION:
        return {
          message: 'Thank you for your interest in our programs. I\'ll help you with the admission process.',
          nextActions: [
            'Review program eligibility requirements',
            'Complete the application form',
            'Schedule an interview',
          ],
          assignedAgent: 'PARS',
        };

      case AgentIntent.ENROLLMENT:
        return {
          message: 'I can help you with enrollment and payment options.',
          nextActions: [
            'Select your program',
            'Review funding options (WIOA, scholarships, payment plans)',
            'Complete enrollment',
          ],
          assignedAgent: 'ELLIE',
        };

      case AgentIntent.COURSE_BUILDER:
        return {
          message: 'I\'ll help you track your course progress and learning journey.',
          nextActions: [
            'View current course progress',
            'Access upcoming lessons',
            'Review completed modules',
          ],
          assignedAgent: 'ELLIE',
        };

      case AgentIntent.STUDENT_SUPPORT:
        return {
          message: 'I\'m here to help with any questions or concerns you have.',
          nextActions: [
            'Describe your question or issue',
            'Review FAQ section',
            'Connect with a support representative',
          ],
          assignedAgent: 'ELLIE',
        };

      case AgentIntent.OPS:
        return {
          message: 'I\'ll help you with administrative tasks and operations.',
          nextActions: [
            'Review pending items',
            'Process batch operations',
            'Generate reports',
          ],
          assignedAgent: 'LIZZY',
        };

      case AgentIntent.COMPLIANCE:
        return {
          message: 'I\'ll help ensure all compliance requirements are met.',
          nextActions: [
            'Review WIOA reporting requirements',
            'Check credential status',
            'Generate compliance reports',
          ],
          assignedAgent: 'ZORA',
        };

      case AgentIntent.CAREER_PLACEMENT:
        return {
          message: 'I\'ll help you with career services and job placement.',
          nextActions: [
            'Review job market trends',
            'Update your resume',
            'Explore job opportunities',
          ],
          assignedAgent: 'ZORA',
        };

      case AgentIntent.GENERAL:
      default:
        return {
          message: 'I\'m here to help. How can I assist you today?',
          nextActions: [
            'Ask a specific question',
            'Browse available services',
            'Connect with an agent',
          ],
          assignedAgent: 'ROUTER',
        };
    }
  }

  /**
   * Publish task-related events
   */
  private publishTaskEvent(task: TaskPayload, eventType: string): void {
    this.eventPublisher.publishEvent(
      eventType as EventType,
      `ai-gateway:${task.agentType}`,
      {
        taskId: task.id,
        agentType: task.agentType,
        intent: task.intent,
        priority: task.priority,
        status: task.status,
      },
      { taskEvent: true }
    );
  }

  /**
   * Generate next steps based on intent
   */
  private generateNextSteps(intent: AgentIntent): string[] {
    const nextStepsMap: Record<AgentIntent, string[]> = {
      [AgentIntent.ADMISSION]: [
        'Complete your application',
        'Upload required documents',
        'Schedule an interview with PARS',
      ],
      [AgentIntent.ENROLLMENT]: [
        'Select your program',
        'Review payment options',
        'Complete enrollment agreement',
      ],
      [AgentIntent.COURSE_BUILDER]: [
        'Continue your current course',
        'Review your progress dashboard',
        'Access learning resources',
      ],
      [AgentIntent.STUDENT_SUPPORT]: [
        'Browse the help center',
        'Contact student services',
        'Schedule a one-on-one session',
      ],
      [AgentIntent.OPS]: [
        'Access the admin dashboard',
        'Review pending tasks',
        'Generate operation reports',
      ],
      [AgentIntent.COMPLIANCE]: [
        'Review compliance checklist',
        'Update documentation',
        'Schedule a compliance audit',
      ],
      [AgentIntent.CAREER_PLACEMENT]: [
        'Update your profile',
        'Browse job listings',
        'Schedule career counseling',
      ],
      [AgentIntent.GENERAL]: [
        'Ask a specific question',
        'Explore our services',
        'Connect with the right agent',
      ],
    };

    return nextStepsMap[intent] || nextStepsMap[AgentIntent.GENERAL];
  }

  /**
   * Get gateway health status
   */
  getHealth(): GatewayHealthStatus {
    const agentHealth = this.registry.getHealth();
    const taskStats = this.taskOrchestrator.getStats();

    // Determine overall status
    let status: GatewayHealthStatus['status'] = 'healthy';
    const availableAgents = Object.values(agentHealth).filter(
      (h) => h.status === 'active'
    ).length;

    if (availableAgents === 0) {
      status = 'unhealthy';
    } else if (availableAgents < 3) {
      status = 'degraded';
    }

    return {
      status,
      agents: agentHealth,
      tasks: {
        queued: taskStats.queued,
        inProgress: taskStats.inProgress,
        completed: taskStats.completed,
        failed: taskStats.failed,
      },
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get all registered agents
   */
  getAgents() {
    return this.registry.getAllAgents();
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: 'active' | 'busy' | 'offline') {
    this.registry.updateStatus(agentId, status);
    return { success: true, agentId, status };
  }
}

// Singleton instance
let gatewayInstance: AIGateway | null = null;

function getGateway(): AIGateway {
  if (!gatewayInstance) {
    gatewayInstance = new AIGateway();
  }
  return gatewayInstance;
}

// ============================================================
// API Route Handlers
// ============================================================

/**
 * POST /api/ai
 * Main AI gateway endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const aiRequest: AIRequest = {
      message: body.message,
      context: body.context,
      agent: body.agent,
      priority: body.priority,
      correlationId: body.correlationId,
      metadata: {
        ...body.metadata,
        startTime: Date.now(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    };

    // Validate request
    if (!aiRequest.message || typeof aiRequest.message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: message is required' },
        { status: 400 }
      );
    }

    // Process the request
    const gateway = getGateway();
    const response = await gateway.processRequest(aiRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Gateway error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai
 * Gateway info and available endpoints
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const gateway = getGateway();

  switch (action) {
    case 'health':
      return NextResponse.json(gateway.getHealth());

    case 'agents':
      return NextResponse.json(gateway.getAgents());

    case 'stats':
      return NextResponse.json(getTaskOrchestrator().getStats());

    case 'events':
      const eventType = searchParams.get('type') as EventType | null;
      const eventLimit = searchParams.get('limit');
      return NextResponse.json(
        getEventPublisher().getRecentEvents(
          eventType || undefined,
          eventLimit ? parseInt(eventLimit, 10) : undefined
        )
      );

    default:
      return NextResponse.json({
        name: 'Elevate AI Gateway',
        version: '1.0.0',
        description: 'AI Gateway for PARS, ELLIE, LIZZY, ZORA agents',
        endpoints: {
          post: '/api/ai - Process AI request',
          get: [
            '/api/ai?action=health - Gateway health status',
            '/api/ai?action=agents - List registered agents',
            '/api/ai?action=stats - Task statistics',
            '/api/ai?action=events - Recent events',
          ],
        },
        agents: Object.values(AIAgent),
        uptime: Date.now() - (getGateway() as AIGateway & { startTime: number }).startTime,
      });
  }
}
