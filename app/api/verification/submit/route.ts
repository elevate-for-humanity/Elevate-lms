

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { auditPiiAccess } from '@/lib/auditLog';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    await auditPiiAccess({ action: 'PII_ACCESS', entity: 'pii', req: request, metadata: { route: '/api/verification/submit' } });

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if verification documents already uploaded for this user
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('user_id', user.id)
      .eq('document_type', 'photo_id')
      .limit(1);

    // Allow re-submission (user may need to retry after a failed upload)

    // Parse form data
    const formData = await request.formData();

    // Personal Information
    const firstName = formData.get('firstName') as string;
    const middleName = formData.get('middleName') as string;
    const lastName = formData.get('lastName') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    const ssnLast4 = formData.get('ssnLast4') as string;

    // Address Information
    const streetAddress = formData.get('streetAddress') as string;
    const addressLine2 = formData.get('addressLine2') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zipCode') as string;

    // ID Information
    const idType = formData.get('idType') as string;
    const idNumber = formData.get('idNumber') as string;
    const idState = formData.get('idState') as string;
    const idExpiration = formData.get('idExpiration') as string;

    // Files
    const idFront = formData.get('idFront') as File;
    const idBack = formData.get('idBack') as File;
    const selfie = formData.get('selfie') as File;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !streetAddress ||
      !city ||
      !state ||
      !zipCode ||
      !idType ||
      !idNumber ||
      !idFront ||
      !selfie
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upload ID front
    const idFrontExt = idFront.name.split('.').pop();
    const idFrontPath = `${user.id}/id-front-${Date.now()}.${idFrontExt}`;
    const { error: frontError } = await db.storage
      .from('documents')
      .upload(idFrontPath, idFront, {
        contentType: idFront.type,
        upsert: false,
      });

    if (frontError) {
      return NextResponse.json(
        { error: 'Failed to upload ID front' },
        { status: 500 }
      );
    }

    // Bucket is private — store file_path only, generate signed URLs on-demand

    // Upload ID back (if provided)
    let idBackPath: string | null = null;
    if (idBack) {
      const idBackExt = idBack.name.split('.').pop();
      idBackPath = `${user.id}/id-back-${Date.now()}.${idBackExt}`;
      const { error: backError } = await db.storage
        .from('documents')
        .upload(idBackPath, idBack, {
          contentType: idBack.type,
          upsert: false,
        });

      if (backError) {
        idBackPath = null;
      }
    }

    // Upload selfie
    const selfieExt = selfie.name.split('.').pop();
    const selfiePath = `${user.id}/selfie-${Date.now()}.${selfieExt}`;
    const { error: selfieError } = await db.storage
      .from('documents')
      .upload(selfiePath, selfie, {
        contentType: selfie.type,
        upsert: false,
      });

    if (selfieError) {
      // Clean up ID front
      await db.storage.from('documents').remove([idFrontPath]);
      if (idBackPath) {
        await db.storage.from('documents').remove([idBackPath]);
      }
      return NextResponse.json(
        { error: 'Failed to upload selfie' },
        { status: 500 }
      );
    }

    // Get IP and user agent
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create verification record (schema: id, first_name, last_name, id_type, status, rejection_reason, verified_at)
    const { data: verification, error: dbError } = await supabase
      .from('id_verifications')
      .insert({
        first_name: firstName,
        last_name: lastName,
        id_type: idType,
        status: 'pending',
      })
      .select()
      .single();

    // Store uploaded files in documents table for admin review
    if (verification) {
      const docRows = [
        { user_id: user.id, document_type: 'photo_id' as const, file_name: 'id-front.jpg', file_url: null, file_path: idFrontPath, mime_type: 'image/jpeg', status: 'pending_review' },
      ];
      if (idBackPath) {
        docRows.push({ user_id: user.id, document_type: 'photo_id' as const, file_name: 'id-back.jpg', file_url: null, file_path: idBackPath, mime_type: 'image/jpeg', status: 'pending_review' });
      }
      docRows.push({ user_id: user.id, document_type: 'other' as const, file_name: 'selfie.jpg', file_url: null, file_path: selfiePath, mime_type: 'image/jpeg', status: 'pending_review' });
      await supabase.from('documents').insert(docRows);
    }

    if (dbError) {
      // Clean up uploaded files
      await db.storage
        .from('documents')
        .remove([idFrontPath, selfiePath]);
      if (idBackPath) {
        await db.storage.from('documents').remove([idBackPath]);
      }
      return NextResponse.json(
        { error: 'Failed to save verification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verification,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has uploaded ID documents
    const { data: docs } = await supabase
      .from('documents')
      .select('id, document_type, status, file_url, created_at')
      .eq('user_id', user.id)
      .in('document_type', ['photo_id', 'other'])
      .order('created_at', { ascending: false });

    const hasId = (docs || []).some(d => d.document_type === 'photo_id');
    const status = hasId ? 'submitted' : 'not_started';

    return NextResponse.json({
      success: true,
      verification: { status, documents: docs || [] },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
