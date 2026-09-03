/**
 * AI Gateway - Task List Endpoint
 * 
 * GET /api/ai/tasks - List tasks (filterable by agent, status)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskOrchestrator } from '@/lib/ai/task-orchestrator';
import { AIAgent, TaskStatus, AgentIntent, TaskPriority } from '@/lib/ai/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orchestrator = getTaskOrchestrator();

    // Parse filter parameters
    const filters: {
      agent?: AIAgent;
      status?: TaskStatus;
      intent?: AgentIntent;
      limit?: number;
      offset?: number;
    } = {};

    const agentParam = searchParams.get('agent');
    if (agentParam && Object.values(AIAgent).includes(agentParam as AIAgent)) {
      filters.agent = agentParam as AIAgent;
    }

    const statusParam = searchParams.get('status');
    if (statusParam && Object.values(TaskStatus).includes(statusParam as TaskStatus)) {
      filters.status = statusParam as TaskStatus;
    }

    const intentParam = searchParams.get('intent');
    if (intentParam && Object.values(AgentIntent).includes(intentParam as AgentIntent)) {
      filters.intent = intentParam as AgentIntent;
    }

    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        filters.limit = Math.min(limit, 100); // Cap at 100
      }
    }

    const offsetParam = searchParams.get('offset');
    if (offsetParam) {
      const offset = parseInt(offsetParam, 10);
      if (!isNaN(offset) && offset >= 0) {
        filters.offset = offset;
      }
    }

    // Get tasks with filters
    const tasks = orchestrator.getTasks(filters);
    const stats = orchestrator.getStats();

    return NextResponse.json({
      tasks,
      filters,
      pagination: {
        limit: filters.limit || tasks.length,
        offset: filters.offset || 0,
        total: stats.total,
      },
      stats: {
        queued: stats.queued,
        inProgress: stats.inProgress,
        completed: stats.completed,
        failed: stats.failed,
        pendingApproval: stats.pendingApproval,
        byAgent: stats.byAgent,
        byIntent: stats.byIntent,
      },
    });
  } catch (error) {
    console.error('Error listing tasks:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
