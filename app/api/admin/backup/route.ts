
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createBackup, exportBackupToJSON, listBackups } from '@/lib/backup';
import { requireAdmin } from '@/lib/authGuards';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const _POST = withAuth(
  async (request: NextRequest, user) => {

  try {
    await requireAdmin();

    const { tables } = await request.json();
    const result = await createBackup(tables);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Export to JSON
    const jsonBackup = await exportBackupToJSON(result.backup);

    return NextResponse.json({
      success: true,
      timestamp: result.timestamp,
      recordCount: result.recordCount,
      download: `/api/admin/backup/download?timestamp=${result.timestamp}`,
    });
  } catch (error) { 
    logger.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }

  },
  { roles: ['admin', 'super_admin'] }
);

const _GET = withAuth(
  async (request: NextRequest, user) => {

  try {
    await requireAdmin();

    const backups = await listBackups();

    return NextResponse.json({ backups });
  } catch (error) { 
    logger.error('Error listing backups:', error);
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    );
  }

  },
  { roles: ['admin', 'super_admin'] }
);
export const GET = withApiAudit('/api/admin/backup', _GET);
export const POST = withApiAudit('/api/admin/backup', _POST);
