import { credentialDocumentPreview } from '@/lib/credentials/document-preview';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return credentialDocumentPreview(request, (await params).id);
}
