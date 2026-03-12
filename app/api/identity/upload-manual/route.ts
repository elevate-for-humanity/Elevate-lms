import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * Manual ID Upload API
 * FREE identity verification via manual document upload
 *
 * User uploads:
 * - Photo ID (front)
 * - Photo ID (back) - optional
 * - Selfie holding ID
 *
 * Admin reviews within 1-2 business days
 */

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const idFront = formData.get('id_front') as File;
    const idBack = formData.get('id_back') as File | null;
    const selfie = formData.get('selfie') as File;
    const userId = formData.get('user_id') as string;
    const userName = formData.get('user_name') as string;
    const userEmail = formData.get('user_email') as string;

    // Validate required files
    if (!idFront || !selfie) {
      return NextResponse.json(
        { error: 'ID front and selfie are required' },
        { status: 400 }
      );
    }

    // Validate file sizes (max 10MB each)
    if (idFront.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ID front file too large (max 10MB)' },
        { status: 400 }
      );
    }
    if (selfie.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Selfie file too large (max 10MB)' },
        { status: 400 }
      );
    }
    if (idBack && idBack.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ID back file too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Upload files to Supabase Storage
    const timestamp = Date.now();
    const idFrontPath = `${userId}/identity-verification/id-front-${timestamp}.${idFront.name.split('.').pop()}`;
    const selfiePath = `${userId}/identity-verification/selfie-${timestamp}.${selfie.name.split('.').pop()}`;

    // Upload ID front
    const { data: idFrontData, error: idFrontError } = await supabase.storage
      .from('documents')
      .upload(idFrontPath, idFront, {
        contentType: idFront.type,
        upsert: false,
      });

    if (idFrontError) {
      return NextResponse.json(
        { error: 'Failed to upload ID front' },
        { status: 500 }
      );
    }

    // Upload selfie
    const { data: selfieData, error: selfieError } = await supabase.storage
      .from('documents')
      .upload(selfiePath, selfie, {
        contentType: selfie.type,
        upsert: false,
      });

    if (selfieError) {
      return NextResponse.json(
        { error: 'Failed to upload selfie' },
        { status: 500 }
      );
    }

    // Upload ID back if provided
    let idBackPath = null;
    if (idBack) {
      idBackPath = `${userId}/identity-verification/id-back-${timestamp}.${idBack.name.split('.').pop()}`;
      const { error: idBackError } = await supabase.storage
        .from('documents')
        .upload(idBackPath, idBack, {
          contentType: idBack.type,
          upsert: false,
        });

      if (idBackError) {
        // Continue anyway - ID back is optional
      }
    }

    // Get public URLs
    // Bucket is private — store file paths, not public URLs.
    // Admin review pages should generate signed URLs on-demand.

    // Save verification record to database
    const { data: verification, error: verificationError } = await db
      .from('identity_verifications')
      .insert({
        user_id: userId,
        provider: 'manual',
        status: 'pending',
        id_front_url: idFrontPath,
        id_back_url: idBackPath || null,
        selfie_url: selfiePath,
        cost: 0, // FREE
      })
      .select()
      .single();

    if (verificationError) {
      return NextResponse.json(
        { error: 'Failed to save verification record' },
        { status: 500 }
      );
    }

    // Update program holder verification status
    await db.from('program_holder_verification').upsert({
      program_holder_id: userId,
      identity_documents_uploaded: true,
      identity_documents_uploaded_at: new Date().toISOString(),
      identity_verification_status: 'pending',
    });

    // Send email notification to admin
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'admin@elevateforhumanity.org',
        subject: 'New Identity Verification Pending Review',
        html: `
          <h2>New Identity Verification Submission</h2>
          <p><strong>User:</strong> ${userName} (${userEmail})</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Documents:</strong></p>
          <ul>
            <li>ID Front: <a href="${idFrontUrl.publicUrl}">View</a></li>
            ${idBackUrl ? `<li>ID Back: <a href="${idBackUrl.publicUrl}">View</a></li>` : ''}
            <li>Selfie: <a href="${selfieUrl.publicUrl}">View</a></li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/program-holders">Review in Admin Dashboard</a></p>
        `,
      }),
    });

    return NextResponse.json({
      success: true,
      verification_id: verification.id,
      message:
        'Documents uploaded successfully. Review within 1-2 business days.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/identity/upload-manual', _POST);
