export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Autopilot API - Next.js Route Handler
 * Converted from legacy autopilot system
 *
 * Manages automated tasks, content indexing, and system configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_PATH = path.join(process.cwd(), '.data', 'autopilot.json');

interface AutopilotState {
  tasks: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    priority: number;
    createdAt: number;
  }>;
  counters: Record<string, number>;
  content: Array<{
    id: string;
    title: string;
    tags: string[];
    body: string;
  }>;
  createdAt: number;
  updatedAt: number;
}

// Load autopilot state from disk
function loadState(): AutopilotState {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      counters: parsed.counters || {},
      content: Array.isArray(parsed.content) ? parsed.content : seedContent(),
      createdAt: parsed.createdAt || Date.now(),
      updatedAt: parsed.updatedAt || Date.now(),
    };
  } catch (error) {
    return {
      tasks: [],
      counters: {},
      content: seedContent(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
}

// Save autopilot state to disk
function saveState(state: AutopilotState): void {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  state.updatedAt = Date.now();
  fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), 'utf8');
}

// Seed initial content
function seedContent() {
  return [
    {
      id: 'routes',
      title: 'Service Routes Map',
      tags: ['introspection', 'docs'],
      body: '/api/metrics, /api/readiness, /api/autopilot/*, /api/ask, /api/catalog, /api/marketing/*',
    },
    {
      id: 'pricing',
      title: 'Pricing & Plans',
      tags: ['pricing'],
      body: 'Starter, Growth, Impact; scholarships via WIOA/WRG/VR',
    },
    {
      id: 'workforce',
      title: 'Workforce Programs',
      tags: ['programs', 'workforce'],
      body: 'Modern Apprenticeship, WIOA, WRG, JRI, VR programs available',
    },
  ];
}

// GET - Retrieve autopilot state
export async function GET(request: NextRequest) {
  try {
    const state = loadState();
    return NextResponse.json(state);
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Failed to load autopilot state' },
      { status: 500 }
    );
  }
}

// POST - Add new task or update state
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<Record<string, any>>(request);
    const state = loadState();

    if (body.action === 'add_task') {
      const newTask = {
        id: `task_${Date.now()}`,
        title: body.title || 'Untitled Task',
        status: 'pending' as const,
        priority: body.priority || 5,
        createdAt: Date.now(),
      };
      state.tasks.push(newTask);
      saveState(state);
      return NextResponse.json({ success: true, task: newTask });
    }

    if (body.action === 'update_task') {
      const taskIndex = state.tasks.findIndex((t) => t.id === body.taskId);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...body.updates };
        saveState(state);
        return NextResponse.json({ success: true, task: state.tasks[taskIndex] });
      }
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (body.action === 'add_content') {
      const newContent = {
        id: `content_${Date.now()}`,
        title: body.title || 'Untitled',
        tags: body.tags || [],
        body: body.body || '',
      };
      state.content.push(newContent);
      saveState(state);
      return NextResponse.json({ success: true, content: newContent });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE - Remove task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const state = loadState();
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    saveState(state);

    return NextResponse.json({ success: true });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
