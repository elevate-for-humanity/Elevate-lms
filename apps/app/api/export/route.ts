import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { apiRequireAdmin, apiRequireInstructor } from '@/lib/admin/guards';
import {
  exportStudents,
  exportCourses,
  exportEnrollments,
  exportAssignments,
  exportGrades,
  exportAnalytics,
  convertToCSV,
  EXPORT_TEMPLATES,
  type ExportOptions,
} from '@/lib/dataExport';
import { auditLog } from '@/lib/auditLog';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'csv';
    const filters = searchParams.get('filters');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
    const limit = searchParams.get('limit');

    if (!type) {
      return NextResponse.json({ error: 'Export type is required' }, { status: 400 });
    }

    // Check authorization based on export type
    let authResult;
    if (type === 'students' || type === 'analytics') {
      authResult = await apiRequireAdmin(request);
    } else {
      authResult = await apiRequireInstructor(request);
    }

    if (authResult.error) {
      return authResult.error;
    }

    const userId = authResult.id;

    // Parse options
    const options: ExportOptions = {
      filters: filters ? JSON.parse(filters) : undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || 'asc',
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    // Fetch data based on type
    let data: any[] = [];
    let filename = `${type}_export_${new Date().toISOString().split('T')[0]}`;

    switch (type) {
      case 'students':
        data = await exportStudents(options);
        break;
      case 'courses':
        data = await exportCourses(options);
        break;
      case 'enrollments':
        data = await exportEnrollments(options);
        break;
      case 'assignments':
        data = await exportAssignments(options);
        break;
      case 'grades':
        data = await exportGrades(options);
        break;
      case 'analytics': {
        const entityId = searchParams.get('entityId');
        const entityType = searchParams.get('entityType') as 'course' | 'student' | 'instructor';
        if (!entityId || !entityType) {
          return NextResponse.json(
            { error: 'entityId and entityType required for analytics export' },
            { status: 400 },
          );
        }
        data = await exportAnalytics(entityType, entityId, options);
        filename = `analytics_${entityType}_${entityId}_${new Date().toISOString().split('T')[0]}`;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Log audit event
    // Log export action
    await auditLog({
      actor_user_id: userId,
      action: 'EXPORT',
      entity: 'audit_snapshot',
      metadata: {
        export_type: type,
        format,
        record_count: data.length,
        filters: options.filters,
      },
    });

    // Generate export based on format
    if (format === 'csv') {
      const template = EXPORT_TEMPLATES[type as keyof typeof EXPORT_TEMPLATES];
      const csv = convertToCSV(data, template?.columns);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // PDF export is not yet implemented — use CSV export instead.
      return NextResponse.json(
        { error: 'PDF export is not available. Use CSV format.' },
        { status: 501 },
      );
    } else {
      return NextResponse.json({ error: 'Invalid format. Use csv or pdf' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const authResult = await apiRequireAdmin(request);

    if (authResult.error) {
      return authResult.error;
    }

    const userId = authResult.id;
    const body = await parseBody<Record<string, any>>(request);
    const { tables, format, filters } = body;

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json({ error: 'Tables array is required' }, { status: 400 });
    }

    // Export multiple tables
    const results: Record<string, any> = {};

    for (const table of tables) {
      const tableFilters = filters?.[table] || {};

      switch (table) {
        case 'students':
          results[table] = await exportStudents({ filters: tableFilters });
          break;
        case 'courses':
          results[table] = await exportCourses({ filters: tableFilters });
          break;
        case 'enrollments':
          results[table] = await exportEnrollments({ filters: tableFilters });
          break;
        case 'assignments':
          results[table] = await exportAssignments({ filters: tableFilters });
          break;
        case 'grades':
          results[table] = await exportGrades({ filters: tableFilters });
          break;
      }
    }

    // Log audit event
    // Log batch export action
    await auditLog({
      actor_user_id: userId,
      action: 'EXPORT',
      entity: 'audit_snapshot',
      metadata: {
        export_type: 'batch',
        tables,
        format,
        total_records: Object.values(results).reduce((sum, data) => sum + data.length, 0),
      },
    } as string);

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: results,
        exported_at: new Date().toISOString(),
      });
    }

    // For CSV/PDF, create a zip file with multiple exports
    // This would require additional implementation
    return NextResponse.json({
      success: true,
      message: 'Batch export completed',
      tables: Object.keys(results),
      record_counts: Object.entries(results).reduce(
        (acc, [key, data]) => {
          acc[key] = data.length;
          return acc;
        },
        {} as Record<string, number>,
      ),
    });
  } catch (error) {
    logger.error('Batch export error:', error);
    return NextResponse.json({ error: 'Failed to perform batch export' }, { status: 500 });
  }
}
