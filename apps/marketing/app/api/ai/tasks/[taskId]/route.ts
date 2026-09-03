/**
 * AI Gateway - Task Status Endpoint
 * 
 * GET /api/ai/tasks/[taskId] - Get task status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskOrchestrator } from '@/lib/ai/task-orchestrator';
import { TaskStatus } from '@/lib/ai/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const orchestrator = getTaskOrchestrator();
    const task = orchestrator.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found', taskId },
        { status: 404 }
      );
    }

    return NextResponse.json({
      task,
      metadata: {
        duration: task.completedAt 
          ? task.completedAt - (task.startedAt || task.createdAt)
          : task.startedAt 
            ? Date.now() - task.startedAt
            : null,
        isComplete: task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED,
      },
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const orchestrator = getTaskOrchestrator();
    const task = orchestrator.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found', taskId },
        { status: 404 }
      );
    }

    if (body.status) {
      switch (body.status) {
        case 'IN_PROGRESS':
          orchestrator.startTask(taskId);
          break;
        case 'COMPLETED':
          orchestrator.completeTask(taskId, body.result);
          break;
        case 'FAILED':
          orchestrator.failTask(taskId, body.error || 'Task failed');
          break;
        case 'PENDING_APPROVAL':
          orchestrator.pendingApproval(taskId);
          break;
        case 'QUEUED':
          if (task.status !== TaskStatus.IN_PROGRESS) {
            orchestrator.updateTask(taskId, { status: TaskStatus.QUEUED });
          }
          break;
      }
    }

    if (body.priority) {
      orchestrator.updateTask(taskId, { priority: body.priority });
    }

    if (body.cancel) {
      orchestrator.cancelTask(taskId);
    }

    const updatedTask = orchestrator.getTask(taskId);
    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
