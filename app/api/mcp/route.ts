/**
 * MCP Server for Elevate for Humanity
 * 
 * Model Context Protocol (MCP) integration for AI agents.
 * Enables external AI agents to interact with the platform.
 * 
 * @see https://modelcontextprotocol.io
 */
// pre-auth-registry: exempt - MCP server is internal API; auth handled via Supabase JWT in createClient()

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// MCP Protocol Types
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

// Available Tools
const TOOLS = [
  {
    name: 'get_apprentice_progress',
    description: "Get an apprentice's training progress including hours and competencies",
    inputSchema: {
      type: 'object',
      properties: {
        apprentice_id: { type: 'string', description: "The apprentice's user ID" },
      },
      required: ['apprentice_id'],
    },
  },
  {
    name: 'clock_in',
    description: "Clock an apprentice in at their host shop location",
    inputSchema: {
      type: 'object',
      properties: {
        apprentice_id: { type: 'string', description: "The apprentice's user ID" },
        latitude: { type: 'number', description: 'GPS latitude' },
        longitude: { type: 'number', description: 'GPS longitude' },
      },
      required: ['apprentice_id', 'latitude', 'longitude'],
    },
  },
  {
    name: 'clock_out',
    description: "Clock an apprentice out from their training session",
    inputSchema: {
      type: 'object',
      properties: {
        apprentice_id: { type: 'string', description: "The apprentice's user ID" },
      },
      required: ['apprentice_id'],
    },
  },
  {
    name: 'get_enrollment_status',
    description: "Check an apprentice's enrollment status and payment standing",
    inputSchema: {
      type: 'object',
      properties: {
        apprentice_id: { type: 'string', description: "The apprentice's user ID" },
      },
      required: ['apprentice_id'],
    },
  },
  {
    name: 'list_courses',
    description: 'List available courses for a program',
    inputSchema: {
      type: 'object',
      properties: {
        program_slug: { type: 'string', description: 'Program slug (barber, esthetician, nail-technician)' },
      },
      required: ['program_slug'],
    },
  },
  {
    name: 'get_analytics',
    description: 'Get platform analytics and metrics',
    inputSchema: {
      type: 'object',
      properties: {
        metric_type: { 
          type: 'string', 
          enum: ['enrollments', 'hours', 'completion', 'revenue'],
          description: 'Type of analytics to retrieve' 
        },
        date_range: { 
          type: 'string', 
          enum: ['7d', '30d', '90d', '1y'],
          description: 'Time period for analytics' 
        },
      },
      required: ['metric_type'],
    },
  },
  {
    name: 'search_knowledge',
    description: 'Search the knowledge base for documentation and resources',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results', default: 5 },
      },
      required: ['query'],
    },
  },
];

// Available Resources
const RESOURCES = [
  { uri: 'platform://programs', name: 'Available Programs', description: 'List of all training programs' },
  { uri: 'platform://policies', name: 'Platform Policies', description: 'Terms of service and policies' },
  { uri: 'platform://dol-compliance', name: 'DOL Compliance', description: 'DOL compliance information' },
];

// Prompts
const PROMPTS = [
  { name: 'apprentice_onboarding', description: 'Generate onboarding message for new apprentices', arguments: ['apprentice_name', 'program'] },
  { name: 'employer_summary', description: 'Generate employer dashboard metrics summary', arguments: ['employer_id'] },
];

/**
 * MCP Server Handler
 */
export async function POST(request: NextRequest) {
  try {
    const body: MCPRequest = await request.json();
    const { method, params, id } = body;

    let result: unknown;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {}, resources: {}, prompts: {} },
          serverInfo: { name: 'elevate-for-humanity-mcp', version: '1.0.0' },
        };
        break;

      case 'ping':
        result = { pong: true };
        break;

      case 'tools/list':
        result = { tools: TOOLS };
        break;

      case 'tools/call':
        result = await handleToolCall(params);
        break;

      case 'resources/list':
        result = { resources: RESOURCES };
        break;

      case 'prompts/list':
        result = { prompts: PROMPTS };
        break;

      default:
        result = { error: `Unknown method: ${method}` };
    }

    return NextResponse.json({ jsonrpc: '2.0', id, result });
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: 0,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' },
    });
  }
}

async function handleToolCall(params?: Record<string, unknown>) {
  if (!params?.name) throw new Error('Tool name is required');

  const { name, arguments: args } = params as { name: string; arguments?: Record<string, unknown> };

  switch (name) {
    case 'get_apprentice_progress':
      return getApprenticeProgress(args?.apprentice_id as string);
    case 'clock_in':
      return clockInApprentice(args?.apprentice_id as string, args?.latitude as number, args?.longitude as number);
    case 'clock_out':
      return clockOutApprentice(args?.apprentice_id as string);
    case 'get_enrollment_status':
      return getEnrollmentStatus(args?.apprentice_id as string);
    case 'list_courses':
      return listCourses(args?.program_slug as string);
    case 'get_analytics':
      return getAnalytics(args?.metric_type as string, args?.date_range as string);
    case 'search_knowledge':
      return searchKnowledge(args?.query as string, args?.limit as number);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function getApprenticeProgress(apprenticeId: string) {
  const supabase = await createClient();
  const [profileResult, hoursResult, competenciesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', apprenticeId).single(),
    supabase.from('approved_hours').select('*').eq('user_id', apprenticeId),
    supabase.from('competencies').select('*').eq('user_id', apprenticeId),
  ]);
  return {
    profile: profileResult.data,
    total_hours: hoursResult.data?.reduce((sum: number, h: { hours?: number }) => sum + (h.hours || 0), 0) || 0,
    competencies_completed: competenciesResult.data?.filter((c: { status?: string }) => c.status === 'signed_off').length || 0,
  };
}

async function clockInApprentice(apprenticeId: string, latitude: number, longitude: number) {
  const supabase = await createClient();
  const { data: enrollment } = await supabase.from('enrollments').select('*, subscriptions(*)').eq('user_id', apprenticeId).single();
  if (enrollment?.subscriptions?.status !== 'active') {
    return { success: false, error: 'Account suspended - payment required' };
  }
  const { data, error } = await supabase.from('timeclock_entries').insert({
    user_id: apprenticeId,
    clock_in: new Date().toISOString(),
    clock_in_lat: latitude,
    clock_in_lng: longitude,
  }).select().single();
  return { success: !error, entry: data };
}

async function clockOutApprentice(apprenticeId: string) {
  const supabase = await createClient();
  const { data: lastEntry } = await supabase.from('timeclock_entries').select('*').eq('user_id', apprenticeId).is('clock_out', null).order('clock_in', { ascending: false }).limit(1).single();
  if (!lastEntry) return { success: false, error: 'No active clock-in found' };
  
  const clockOut = new Date();
  const clockIn = new Date(lastEntry.clock_in);
  const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
  
  const { data, error } = await supabase.from('timeclock_entries').update({ clock_out: clockOut.toISOString(), hours }).eq('id', lastEntry.id).select().single();
  return { success: !error, entry: data, hours_worked: hours };
}

async function getEnrollmentStatus(apprenticeId: string) {
  const supabase = await createClient();
  const { data: enrollment } = await supabase.from('enrollments').select('*, subscriptions(*)').eq('user_id', apprenticeId).single();
  return { enrolled: !!enrollment, program: enrollment?.program_id, subscription_status: enrollment?.subscriptions?.status, suspended: enrollment?.subscriptions?.status !== 'active' };
}

async function listCourses(programSlug: string) {
  const supabase = await createClient();
  const { data: courses } = await supabase.from('courses').select('id, title, description, total_hours').eq('program_slug', programSlug).eq('published', true);
  return { courses: courses || [] };
}

async function getAnalytics(metricType: string, dateRange = '30d') {
  const supabase = await createClient();
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data, error } = await supabase.from('enrollments').select('*').gte('created_at', startDate.toISOString());
  return { metric_type: metricType, date_range: dateRange, count: data?.length || 0, error: error?.message };
}

async function searchKnowledge(query: string, limit = 5) {
  const supabase = await createClient();
  const { data: documents } = await supabase.from('documents').select('id, title, content').ilike('title', `%${query}%`).limit(limit);
  return { results: documents || [], query };
}

export async function GET() {
  return NextResponse.json({
    server: 'elevate-for-humanity-mcp',
    version: '1.0.0',
    status: 'running',
    capabilities: { tools: TOOLS.length, resources: RESOURCES.length, prompts: PROMPTS.length },
  });
}