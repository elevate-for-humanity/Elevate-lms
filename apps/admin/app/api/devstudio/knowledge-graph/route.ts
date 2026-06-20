/**
 * GET /api/devstudio/knowledge-graph
 *
 * Returns the full platform knowledge graph for AI context injection.
 * Includes systems, route→system map, table→system map, debt, and decisions.
 *
 * Query params:
 *   ?route=/programs/[program]  — look up a specific route
 *   ?table=curriculum_lessons   — look up a specific table
 *   ?system=lms                 — get full system detail
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import {
  SYSTEMS,
  PLATFORM_DEBT,
  CANONICAL_DECISIONS,
  ROUTE_DEPENDENCIES,
  lookupRoute,
  lookupTable,
  getKnowledgeGraphContext,
} from '@/lib/platform/knowledge-graph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  const { searchParams } = req.nextUrl;
  const route = searchParams.get('route');
  const table = searchParams.get('table');
  const systemId = searchParams.get('system');
  const format = searchParams.get('format'); // 'text' for AI injection

  // Specific lookups
  if (route) {
    const system = lookupRoute(route);
    const deps = ROUTE_DEPENDENCIES[route];
    return NextResponse.json({ route, system: system ?? null, dependencies: deps ?? null });
  }

  if (table) {
    const systems = lookupTable(table);
    return NextResponse.json({ table, systems });
  }

  if (systemId) {
    const system = SYSTEMS.find(s => s.id === systemId);
    if (!system) return NextResponse.json({ error: 'System not found' }, { status: 404 });
    return NextResponse.json(system);
  }

  // Full graph — text format for AI injection
  if (format === 'text') {
    return new Response(getKnowledgeGraphContext(), {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Full graph — JSON
  return NextResponse.json({
    systems: SYSTEMS,
    debt: PLATFORM_DEBT,
    decisions: CANONICAL_DECISIONS,
    route_dependencies: ROUTE_DEPENDENCIES,
  });
}
