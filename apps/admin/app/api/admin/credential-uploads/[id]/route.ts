import { apiRequireAdmin } from '@/lib/admin/guards';
import { credentialDocumentPreview } from '@/lib/credentials/document-preview';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  return credentialDocumentPreview(request, (await params).id);
}
