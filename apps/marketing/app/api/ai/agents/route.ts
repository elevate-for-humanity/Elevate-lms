/**
 * AI Gateway - Agents List Endpoint
 * 
 * GET /api/ai/agents - List registered agents
 */

import { NextResponse } from 'next/server';
import { getAgentRegistry } from '@/lib/ai/agent-registry';

export async function GET() {
  try {
    const registry = getAgentRegistry();
    const agents = registry.getAllAgents();
    const health = registry.getHealth();
    const status = registry.getStatus();

    return NextResponse.json({
      agents: agents.map((agent) => ({
        ...agent,
        health: health[agent.type],
      })),
      summary: {
        total: agents.length,
        healthy: status.healthyAgents,
        averageLoad: Math.round(status.averageLoad),
        totalTasks: status.totalTasks,
      },
    });
  } catch (error) {
    console.error('Error listing agents:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
