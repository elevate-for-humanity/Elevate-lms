/**
 * AI Gateway - Agent Status Endpoint
 * 
 * GET /api/ai/agents/[id] - Get agent details
 * POST /api/ai/agents/[id] - Update agent status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentRegistry } from '@/lib/ai/agent-registry';
import { AIAgent, AgentStatus } from '@/lib/ai/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const registry = getAgentRegistry();

    // Find agent by ID or type
    let agent = registry.getAllAgents().find((a) => a.id === id);
    if (!agent && Object.values(AIAgent).includes(id as AIAgent)) {
      agent = registry.getAgent(id as AIAgent);
    }

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found', id },
        { status: 404 }
      );
    }

    const health = registry.getHealth();
    const agentHealth = health[agent.type];

    return NextResponse.json({
      agent,
      health: agentHealth,
      capabilities: {
        intents: agent.capabilities.intents,
        maxConcurrentTasks: agent.capabilities.maxConcurrentTasks,
        timeout: agent.capabilities.timeout,
        retryable: agent.capabilities.retryable,
        requiresApproval: agent.capabilities.requiresApproval,
      },
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const registry = getAgentRegistry();

    let agent = registry.getAllAgents().find((a) => a.id === id);
    if (!agent && Object.values(AIAgent).includes(id as AIAgent)) {
      agent = registry.getAgent(id as AIAgent);
    }

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found', id },
        { status: 404 }
      );
    }

    // Validate status
    const newStatus = body.status as AgentStatus;
    if (!Object.values(AgentStatus).includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: active, busy, or offline' },
        { status: 400 }
      );
    }

    // Update status
    registry.updateStatusByType(agent.type, newStatus);

    const updatedHealth = registry.getHealth();

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      agentType: agent.type,
      previousStatus: agent.status,
      newStatus,
      health: updatedHealth[agent.type],
    });
  } catch (error) {
    console.error('Error updating agent status:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
