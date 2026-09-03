/**
 * AI Gateway Module - Agent Registry
 *
 * Manages all AI agents (PARIS, ELLIE, LIZZY, ZORA) with their
 * configurations, capabilities, and health monitoring.
 */

import { AIAgent, AgentIntent, AgentStatus } from './types';

import type { AgentConfig, AgentCapabilities, AgentHealthStatus } from './types';

// ============================================================
// Pre-defined Agent Configurations
// ============================================================

const PARIS_CAPABILITIES: AgentCapabilities = {
  intents: [AgentIntent.ADMISSION],
  maxConcurrentTasks: 5,
  timeout: 300000, // 5 minutes
  retryable: true,
  requiresApproval: false,
};

const ELLIE_CAPABILITIES: AgentCapabilities = {
  intents: [AgentIntent.STUDENT_SUPPORT, AgentIntent.ENROLLMENT, AgentIntent.COURSE_BUILDER],
  maxConcurrentTasks: 10,
  timeout: 180000, // 3 minutes
  retryable: true,
  requiresApproval: false,
};

const LIZZY_CAPABILITIES: AgentCapabilities = {
  intents: [AgentIntent.OPS],
  maxConcurrentTasks: 8,
  timeout: 240000, // 4 minutes
  retryable: true,
  requiresApproval: false,
};

const ZORA_CAPABILITIES: AgentCapabilities = {
  intents: [AgentIntent.COMPLIANCE, AgentIntent.CAREER_PLACEMENT],
  maxConcurrentTasks: 6,
  timeout: 300000, // 5 minutes
  retryable: true,
  requiresApproval: true,
};

const ROUTER_CAPABILITIES: AgentCapabilities = {
  intents: Object.values(AgentIntent),
  maxConcurrentTasks: 20,
  timeout: 60000, // 1 minute
  retryable: false,
  requiresApproval: false,
};

// Default agent configurations
const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agent-paris',
    name: 'PARIS (Public Assistance, Recruitment & Intake System)',
    type: AIAgent.PARIS,
    capabilities: PARIS_CAPABILITIES,
    endpoint: '/api/ai/agents/paris',
    priority: 10,
    maxConcurrentTasks: PARIS_CAPABILITIES.maxConcurrentTasks,
    status: AgentStatus.ACTIVE,
    metadata: {
      description:
        'Handles admission interviews, eligibility assessments, and program applications',
      keywords: ['interview', 'apply', 'program', 'eligibility', 'admission', 'paris'],
    },
  },
  {
    id: 'agent-ellie',
    name: 'ELLIE (Elevated Learning Intelligence Engine)',
    type: AIAgent.ELLIE,
    capabilities: ELLIE_CAPABILITIES,
    endpoint: '/api/ai/agents/ellie',
    priority: 8,
    maxConcurrentTasks: ELLIE_CAPABILITIES.maxConcurrentTasks,
    status: AgentStatus.ACTIVE,
    metadata: {
      description: 'Student success coach, notifications, enrollment support, and course guidance',
      keywords: [
        'progress',
        'course',
        'lesson',
        'enroll',
        'payment',
        'funding',
        'student',
        'support',
      ],
    },
  },
  {
    id: 'agent-lizzy',
    name: 'LIZZY (Logistics & Intelligent Operations)',
    type: AIAgent.LIZZY,
    capabilities: LIZZY_CAPABILITIES,
    endpoint: '/api/ai/agents/lizzy',
    priority: 6,
    maxConcurrentTasks: LIZZY_CAPABILITIES.maxConcurrentTasks,
    status: AgentStatus.ACTIVE,
    metadata: {
      description: 'Operations automation, admin tasks, document processing, and queue management',
      keywords: ['approve', 'review', 'admin', 'queue', 'document', 'process', 'operation'],
    },
  },
  {
    id: 'agent-zora',
    name: 'ZORA (Zero-Override Regulatory Advisor)',
    type: AIAgent.ZORA,
    capabilities: ZORA_CAPABILITIES,
    endpoint: '/api/ai/agents/zora',
    priority: 9,
    maxConcurrentTasks: ZORA_CAPABILITIES.maxConcurrentTasks,
    status: AgentStatus.ACTIVE,
    metadata: {
      description:
        'Compliance monitoring, WIOA reporting, credential tracking, and regulatory audits',
      keywords: ['WIOA', 'DOL', 'compliance', 'credential', 'audit', 'certification', 'regulation'],
    },
  },
  {
    id: 'agent-router',
    name: 'ROUTER (Intent Router)',
    type: AIAgent.ROUTER,
    capabilities: ROUTER_CAPABILITIES,
    endpoint: '/api/ai/router',
    priority: 5,
    maxConcurrentTasks: ROUTER_CAPABILITIES.maxConcurrentTasks,
    status: AgentStatus.ACTIVE,
    metadata: {
      description: 'Fallback router for general queries and intent classification',
      keywords: ['help', 'question', 'general', 'info'],
    },
  },
];

// ============================================================
// Agent Registry Implementation
// ============================================================

export class AgentRegistry {
  private agents: Map<AIAgent, AgentConfig> = new Map();
  private agentTasks: Map<AIAgent, Set<string>> = new Map();
  private lastHeartbeat: Map<AIAgent, number> = new Map();

  constructor() {
    // Initialize with default agents
    DEFAULT_AGENTS.forEach((agent) => {
      this.register(agent);
    });
  }

  /**
   * Register a new agent with the registry
   */
  register(agent: AgentConfig): void {
    if (this.agents.has(agent.type)) {
      console.warn(`Agent ${agent.type} already registered, updating configuration`);
    }
    this.agents.set(agent.type, { ...agent });
    this.agentTasks.set(agent.type, new Set());
    this.lastHeartbeat.set(agent.type, Date.now());
  }

  /**
   * Get an agent by its type
   */
  getAgent(type: AIAgent): AgentConfig | null {
    const canonicalType = type === AIAgent.PARS ? AIAgent.PARIS : type;
    return this.agents.get(canonicalType) || null;
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get only available (active) agents
   */
  getAvailableAgents(): AgentConfig[] {
    return this.getAllAgents().filter(
      (agent) =>
        agent.status === AgentStatus.ACTIVE &&
        this.getAgentLoad(agent.type) < agent.maxConcurrentTasks,
    );
  }

  /**
   * Select the best agent for a given intent
   */
  selectAgent(intent: AgentIntent): AgentConfig {
    const availableAgents = this.getAvailableAgents();

    // Filter agents that can handle this intent
    const capableAgents = availableAgents.filter((agent) =>
      agent.capabilities.intents.includes(intent),
    );

    if (capableAgents.length === 0) {
      // Fall back to router if no specific agent can handle the intent
      const router = this.getAgent(AIAgent.ROUTER);
      if (router) {
        return router;
      }
      throw new Error(`No agent available for intent: ${intent}`);
    }

    // Sort by priority (higher priority first) and select the least loaded
    capableAgents.sort((a, b) => {
      const loadA = this.getAgentLoad(a.type);
      const loadB = this.getAgentLoad(b.type);
      const priorityDiff = b.priority - a.priority;

      // If priorities are equal, prefer the less loaded agent
      if (priorityDiff === 0) {
        return loadA - loadB;
      }
      return priorityDiff;
    });

    return capableAgents[0];
  }

  /**
   * Update an agent's status
   */
  updateStatus(agentId: string, status: AgentStatus): void {
    const agent = this.getAllAgents().find((a) => a.id === agentId);
    if (agent) {
      agent.status = status;
      if (status === AgentStatus.ACTIVE) {
        this.lastHeartbeat.set(agent.type, Date.now());
      }
    }
  }

  /**
   * Update status by agent type
   */
  updateStatusByType(type: AIAgent, status: AgentStatus): void {
    const agent = this.agents.get(type);
    if (agent) {
      agent.status = status;
      if (status === AgentStatus.ACTIVE) {
        this.lastHeartbeat.set(type, Date.now());
      }
    }
  }

  /**
   * Record task assignment to an agent
   */
  assignTask(agentType: AIAgent, taskId: string): void {
    const tasks = this.agentTasks.get(agentType);
    if (tasks) {
      tasks.add(taskId);
    }
  }

  /**
   * Record task completion for an agent
   */
  completeTask(agentType: AIAgent, taskId: string): void {
    const tasks = this.agentTasks.get(agentType);
    if (tasks) {
      tasks.delete(taskId);
    }
  }

  /**
   * Get the current load (number of active tasks) for an agent
   */
  getAgentLoad(type: AIAgent): number {
    const tasks = this.agentTasks.get(type);
    return tasks ? tasks.size : 0;
  }

  /**
   * Get health status for all agents
   */
  getHealth(): Record<string, AgentHealthStatus> {
    const health: Record<string, AgentHealthStatus> = {};

    this.getAllAgents().forEach((agent) => {
      const tasks = this.agentTasks.get(agent.type);
      const activeTasks = tasks ? tasks.size : 0;
      const loadPercentage = (activeTasks / agent.maxConcurrentTasks) * 100;

      health[agent.type] = {
        status: agent.status,
        load: Math.round(loadPercentage * 100) / 100,
        tasks: activeTasks,
        lastHeartbeat: this.lastHeartbeat.get(agent.type),
      };
    });

    return health;
  }

  /**
   * Get detailed status for all agents
   */
  getStatus(): {
    agents: AgentConfig[];
    totalTasks: number;
    averageLoad: number;
    healthyAgents: number;
  } {
    const agents = this.getAllAgents();
    const health = this.getHealth();

    let totalTasks = 0;
    let totalLoad = 0;
    let healthyAgents = 0;

    agents.forEach((agent) => {
      const agentHealth = health[agent.type];
      totalTasks += agentHealth.tasks;
      totalLoad += agentHealth.load;
      if (agent.status === AgentStatus.ACTIVE) {
        healthyAgents++;
      }
    });

    return {
      agents,
      totalTasks,
      averageLoad: agents.length > 0 ? totalLoad / agents.length : 0,
      healthyAgents,
    };
  }

  /**
   * Check if any agents are healthy
   */
  isHealthy(): boolean {
    return this.getAvailableAgents().length > 0;
  }

  /**
   * Get agents by intent capability
   */
  getAgentsByIntent(intent: AgentIntent): AgentConfig[] {
    return this.getAllAgents().filter((agent) => agent.capabilities.intents.includes(intent));
  }

  /**
   * Update agent heartbeat
   */
  updateHeartbeat(type: AIAgent): void {
    this.lastHeartbeat.set(type, Date.now());
  }

  /**
   * Check for stale agents (no heartbeat in 5 minutes)
   */
  detectStaleAgents(): AIAgent[] {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const stale: AIAgent[] = [];

    this.lastHeartbeat.forEach((heartbeat, type) => {
      if (now - heartbeat > staleThreshold) {
        stale.push(type);
      }
    });

    return stale;
  }
}

// ============================================================
// Singleton Instance
// ============================================================

let agentRegistryInstance: AgentRegistry | null = null;

export function getAgentRegistry(): AgentRegistry {
  if (!agentRegistryInstance) {
    agentRegistryInstance = new AgentRegistry();
  }
  return agentRegistryInstance;
}

export function resetAgentRegistry(): void {
  agentRegistryInstance = null;
}

export { AIAgent, AgentIntent, AgentStatus };
export type { AgentConfig, AgentCapabilities, AgentHealthStatus };
