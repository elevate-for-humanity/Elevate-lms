import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';
import { getHostShopBoard } from '@/lib/partner/board';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-120);
}

export async function POST(request: NextRequest) {
  try {
    const { user, db, partner } = await requireCurrentHostShopPartner();
    const board = await getHostShopBoard(user.id);
    const form = await request.formData();
    const documentType = String(form.get('documentType') || '').trim();
    const expirationDate = String(form.get('expirationDate') || '').trim();
    const fileEntry = form.get('file');
    const requirement = board.documentStatuses.find(
      (item: any) => item.document_type === documentType,
    );

    if (!requirement) {
      return NextResponse.json({ ok: false, error: 'That document is not required for this Host Shop.' }, { status: 400 });
    }
    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      return NextResponse.json({ ok: false, error: 'Choose a document file before submitting.' }, { status: 400 });
    }
    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, error: 'That file is larger than 10 MB.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(fileEntry.type)) {
      return NextResponse.json({ ok: false, error: 'Upload PDF, JPG, or PNG files only.' }, { status: 400 });
    }

    const fileName = safeFileName(fileEntry.name || `${documentType}.bin`);
    const storagePath = `${partner.id}/${documentType}/${Date.now()}-${fileName}`;
    const fileBytes = Buffer.from(await fileEntry.arrayBuffer());
    const { error: uploadError } = await db.storage
      .from('partner-documents')
      .upload(storagePath, fileBytes, {
        contentType: fileEntry.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('[host-shop-documents] Storage upload failed', uploadError, {
        partnerId: partner.id,
        documentType,
      });
      return NextResponse.json({ ok: false, error: `File upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { error: insertError } = await db.from('partner_documents').insert({
      partner_id: partner.id,
      document_type: documentType,
      program_id: board.programType,
      state: partner.state || 'Indiana',
      display_name: requirement.document_name || documentType,
      file_name: fileEntry.name,
      file_url: storagePath,
      file_type: fileEntry.type,
      file_size: fileEntry.size,
      storage_bucket: 'partner-documents',
      status: 'pending',
      expiration_date: expirationDate || null,
    });

    if (insertError) {
      await db.storage.from('partner-documents').remove([storagePath]);
      logger.error('[host-shop-documents] Document record failed', insertError, {
        partnerId: partner.id,
        documentType,
      });
      return NextResponse.json({ ok: false, error: `Document record failed: ${insertError.message}` }, { status: 500 });
    }

    await db
      .from('partners')
      .update({ onboarding_step: 'documents', updated_at: new Date().toISOString() })
      .eq('id', partner.id);

    return NextResponse.json({ ok: true, documentType });
  } catch (error) {
    logger.error('[host-shop-documents] Unexpected upload failure', error);
    const code = error instanceof Error ? error.message : '';
    const status = code === 'HOST_SHOP_UNAUTHENTICATED' ? 401 : code === 'HOST_SHOP_ADMIN_PARTNER_REQUIRED' ? 400 : 500;
    return NextResponse.json(
      { ok: false, error: status === 500 ? 'The document could not be uploaded. Please try again.' : 'Choose a Host Shop and sign in again.' },
      { status },
    );
  }
}
