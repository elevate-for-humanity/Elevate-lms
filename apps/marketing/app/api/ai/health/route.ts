/**
 * AI Gateway - Health Check Endpoint
 * 
 * GET /api/ai/health - Gateway health check
 */

import { NextResponse } from 'next/server';
import { getAgentRegistry } from '@/lib/ai/agent-registry';
import { getTaskOrchestrator } from '@/lib/ai/task-orchestrator';
import { getEventPublisher } from '@/lib/ai/event-publisher';
import { getMessageBus } from '@/lib/ai/message-bus';

export async function GET() {
  try {
    const registry = getAgentRegistry();
    const orchestrator = getTaskOrchestrator();
    const events = getEventPublisher();
    const messageBus = getMessageBus();

    const health = registry.getHealth();
    const taskStats = orchestrator.getStats();
    const eventStats = events.getEventStats();
    const busStats = messageBus.getStats();

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const availableAgents = Object.values(health).filter(
      (h) => h.status === 'active'
    ).length;

    if (availableAgents === 0) {
      status = 'unhealthy';
    } else if (availableAgents < 3) {
      status = 'degraded';
    }

    const failureRate = taskStats.total > 0 
      ? taskStats.failed / taskStats.total 
      : 0;
    if (failureRate > 0.1) {
      status = 'degraded';
    }

    return NextResponse.json({
      status,
      timestamp: Date.now(),
      components: {
        agents: {
          status: availableAgents > 0 ? 'healthy' : 'unhealthy',
          available: availableAgents,
          total: Object.keys(health).length,
          details: health,
        },
        tasks: {
          status: 'healthy',
          ...taskStats,
        },
        events: {
          status: 'healthy',
          ...eventStats,
        },
        messageBus: {
          status: 'healthy',
          ...busStats,
        },
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        failureRate: failureRate,
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
