export const runtime = 'edge';
export const maxDuration = 60;

/**
 * Grant Package Builder API
 * Generate submission-ready grant packages
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  buildGrantPackage,
  generateNarrativeDocx,
  generateNarrativePdf,
  generateCapabilityStatement,
  generateBudgetSpreadsheet,
} from '@/lib/grants/package-builder';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { action, applicationId, entityId, format } = body;

    switch (action) {
      case 'build_complete':
        if (!applicationId) {
          return NextResponse.json(
            { error: 'applicationId required' },
            { status: 400 }
          );
        }
        const pkg = await buildGrantPackage(applicationId);

        return new NextResponse(pkg.files.complete_package_zip as any as BodyInit, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="grant_package_${applicationId}.zip"`,
          },
        });

      case 'generate_narrative':
        if (!applicationId) {
          return NextResponse.json(
            { error: 'applicationId required' },
            { status: 400 }
          );
        }

        if (format === 'pdf') {
          const pdf = await generateNarrativePdf(applicationId);
          return new NextResponse(pdf as any as BodyInit, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="narrative_${applicationId}.pdf"`,
            },
          });
        } else {
          const docx = await generateNarrativeDocx(applicationId);
          return new NextResponse(docx as any as BodyInit, {
            headers: {
              'Content-Type':
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="narrative_${applicationId}.docx"`,
            },
          });
        }

      case 'generate_capability':
        if (!entityId) {
          return NextResponse.json(
            { error: 'entityId required' },
            { status: 400 }
          );
        }
        const capability = await generateCapabilityStatement(entityId);
        return new NextResponse(capability as any as BodyInit, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="capability_statement_${entityId}.pdf"`,
          },
        });

      case 'generate_budget':
        if (!applicationId) {
          return NextResponse.json(
            { error: 'applicationId required' },
            { status: 400 }
          );
        }
        const budget = await generateBudgetSpreadsheet(applicationId);
        return new NextResponse(budget as any as BodyInit, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="budget_${applicationId}.csv"`,
          },
        });

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: build_complete, generate_narrative, generate_capability, or generate_budget',
          },
          { status: 400 }
        );
    }
  } catch (error) { 
    logger.error('Package builder error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/grants/package', _POST);
