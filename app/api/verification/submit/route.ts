
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if verification already exists
    const { data: existing } = await supabase
      .from('id_verifications')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existing && existing.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Verification already submitted' },
        { status: 400 }
      );
    }

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
    const { error: frontError } = await supabase.storage
      .from('id-documents')
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

    const {
      data: { publicUrl: idFrontUrl },
    } = supabase.storage.from('id-documents').getPublicUrl(idFrontPath);

    // Upload ID back (if provided)
    let idBackUrl = null;
    if (idBack) {
      const idBackExt = idBack.name.split('.').pop();
      const idBackPath = `${user.id}/id-back-${Date.now()}.${idBackExt}`;
      const { error: backError } = await supabase.storage
        .from('id-documents')
        .upload(idBackPath, idBack, {
          contentType: idBack.type,
          upsert: false,
        });

      if (!backError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('id-documents').getPublicUrl(idBackPath);
        idBackUrl = publicUrl;
      }
    }

    // Upload selfie
    const selfieExt = selfie.name.split('.').pop();
    const selfiePath = `${user.id}/selfie-${Date.now()}.${selfieExt}`;
    const { error: selfieError } = await supabase.storage
      .from('id-documents')
      .upload(selfiePath, selfie, {
        contentType: selfie.type,
        upsert: false,
      });

    if (selfieError) {
      // Clean up ID front
      await supabase.storage.from('id-documents').remove([idFrontPath]);
      if (idBackUrl) {
        await supabase.storage.from('id-documents').remove([idBackPath]);
      }
      return NextResponse.json(
        { error: 'Failed to upload selfie' },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl: selfieUrl },
    } = supabase.storage.from('id-documents').getPublicUrl(selfiePath);

    // Get IP and user agent
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create verification record
    const { data: verification, error: dbError } = await supabase
      .from('id_verifications')
      .insert({
        user_id: user.id,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        ssn_last_4: ssnLast4 || null,
        street_address: streetAddress,
        address_line_2: addressLine2 || null,
        city: city,
        state: state,
        zip_code: zipCode,
        id_type: idType,
        id_number: idNumber,
        id_state: idState || null,
        id_expiration_date: idExpiration || null,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        selfie_url: selfieUrl,
        status: 'pending',
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded files
      await supabase.storage
        .from('id-documents')
        .remove([idFrontPath, selfiePath]);
      if (idBackUrl) {
        await supabase.storage.from('id-documents').remove([idBackPath]);
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
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's verification
    const { data: verification, error } = await supabase
      .from('id_verifications')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return NextResponse.json(
        { error: 'Failed to fetch verification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      verification: verification || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
