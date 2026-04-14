import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getServiceDb } from '@/lib/course-builder/db';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  credentialTarget: z.enum(['INTERNAL', 'STATE_BOARD', 'IC&RC', 'NAADAC', 'CUSTOM', 'DOL_APPRENTICESHIP']),
  minimumHours: z.number().positive(),
  requiresFinalExam: z.boolean(),
  finalExam: z.object({
    required: z.boolean(),
    questionCount: z.number().optional(),
    passingScore: z.number().optional(),
    timeLimitMinutes: z.number().optional(),
    domainDistribution: z.record(z.number()).optional(),
    competencyKeys: z.array(z.string()).optional(),
  }),
  certificateRequirements: z.object({
    includeHours: z.boolean(),
    includeCompetencies: z.boolean(),
    includeInstructorVerification: z.boolean(),
    includeCompletionDate: z.boolean(),
    includeVerificationUrl: z.boolean(),
    requireAllCriticalCompetencies: z.boolean().optional(),
  }),
  regulatory: z.object({
    complianceProfileKey: z.string().min(1),
    credentialTarget: z.enum(['INTERNAL', 'STATE_BOARD', 'IC&RC', 'NAADAC', 'CUSTOM', 'DOL_APPRENTICESHIP']),
    governingBody: z.string().nullable().optional(),
    governingRegion: z.string().nullable().optional(),
    governingStandardVersion: z.string().nullable().optional(),
    retentionPolicyDays: z.number().nullable().optional(),
    auditNotes: z.string().nullable().optional(),
  }),
  status: z.enum(['draft', 'published']).default('draft'),
});

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = bodySchema.parse(await req.json());
    const db = getServiceDb();

    const payload = {
      title: body.title,
      slug: body.slug,
      status: body.status,
      metadata: {
        credentialTarget: body.credentialTarget,
        minimumHours: body.minimumHours,
        requiresFinalExam: body.requiresFinalExam,
        finalExam: body.finalExam,
        certificateRequirements: body.certificateRequirements,
        regulatory: body.regulatory,
      },
    };

    if (body.id) {
      const { data, error } = await db.from('courses').update(payload).eq('id', body.id).select('*').single();
      if (error) throw error;
      return NextResponse.json({ ok: true, course: data });
    }

    const { data, error } = await db.from('courses').insert(payload).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, course: data });
  } catch (error) {
    console.error('[course-builder/program]', error);
    return NextResponse.json({ ok: false, error: 'Failed to save program' }, { status: 400 });
  }
}
