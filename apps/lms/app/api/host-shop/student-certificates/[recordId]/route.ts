// pre-auth-registry: exempt - requireRole and the canonical Host Shop board enforce current ownership before exporting private student records.
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopStudentCertificates } from '@/lib/certificates/host-shop-students';
import { hostStudentCertificatePdf } from '@/lib/certificates/host-shop-student-pdf';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function download(_request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const { recordId } = await params;
  const { certificates } = await getHostShopStudentCertificates(user.id);
  const record = certificates.find(item => item.id === recordId);
  if (!record) return Response.json({ error: 'Student certificate not found.' }, { status: 404 });
  const bytes = await hostStudentCertificatePdf(record);
  return new Response(Buffer.from(bytes), { headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${record.reference}.pdf"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}
export const GET = withApiAudit('/api/host-shop/student-certificates/[recordId]', download);
