import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return NextResponse.json({ status: 'ready', sources: {
    careers: { name: 'O*NET Career Data', endpoint: '/api/onet/careers', provides: ['skills','tasks','knowledge','abilities'], requiresKey: true, keyEnv: 'ONET_API_KEY' },
    jobs: { name: 'Government Job Feeds', endpoint: '/api/jobs/government-feed', provides: ['real-world requirements','job trends'], sources: ['USAJobs.gov','CareerOneStop'], requiresKey: true },
    bls: { name: 'Bureau of Labor Statistics', endpoint: '/api/admin/course-builder/bls', provides: ['employment data','wages','outlook'], requiresKey: false },
    certifications: { name: 'Industry Certifications', endpoint: '/api/admin/course-builder/certifications', provides: ['exam requirements','competencies','renewal info'], requiresKey: false },
    curriculum: { name: 'Curriculum Frameworks', endpoint: '/api/admin/course-builder/curriculum', provides: ['competencies','hour requirements','standards'], requiresKey: false },
    credentialing: { name: 'Credential Engine', endpoint: '/api/admin/course-builder/credential', provides: ['credential frameworks','industry credentials','competency publishing'], requiresKey: false },
  }});
}
