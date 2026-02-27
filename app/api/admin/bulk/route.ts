export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import {
  bulkEnrollStudents,
  bulkUnenrollStudents,
  bulkIssueCertificates,
  bulkUpdateGrades,
  bulkDeleteUsers,
  bulkSendNotifications,
  bulkExportData,
} from '@/lib/bulkOperations';
import { requireAdmin } from '@/lib/authGuards';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';

export const POST = withAuth(
  async (request: NextRequest, { user }) => {

  try {
    await requireAdmin();
    const { operation, ...params } = await request.json();

    let result;

    switch (operation) {
      case 'enroll':
        result = await bulkEnrollStudents(
          params.studentIds,
          params.courseId,
          user.id
        );
        break;

      case 'unenroll':
        result = await bulkUnenrollStudents(
          params.studentIds,
          params.courseId,
          user.id
        );
        break;

      case 'issue_certificates':
        result = await bulkIssueCertificates(
          params.studentIds,
          params.courseId,
          user.id
        );
        break;

      case 'update_grades':
        result = await bulkUpdateGrades(params.updates, user.id);
        break;

      case 'delete_users':
        result = await bulkDeleteUsers(params.userIds, user.id);
        break;

      case 'send_notifications':
        result = await bulkSendNotifications(
          params.userIds,
          params.notification,
          user.id
        );
        break;

      case 'export':
        result = await bulkExportData(params.table, params.filters);
        if (result.success && result.data) {
          return new NextResponse(result.data, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${result.filename}"`,
            },
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await logAdminAudit({ action: AdminAction.BULK_GRADES_UPDATED, actorId: user.id, entityType: operation, entityId: '00000000-0000-0000-0000-000000000000', metadata: { operation, record_count: params.userIds?.length || params.updates?.length || 0 }, req: request });

    return NextResponse.json(result);
  } catch (error) { 
    logger.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }

  },
  { roles: ['admin', 'super_admin'] }
);
