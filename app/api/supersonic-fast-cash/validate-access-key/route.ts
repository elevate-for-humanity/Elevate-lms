import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ValidateAccessKeyBody {
  accessKey: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateAccessKeyBody = await request.json();
    const { accessKey, email } = body;

    if (!accessKey || !email) {
      return NextResponse.json(
        { valid: false, error: 'Access key and email are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if access key exists and matches email
    const { data: keyData, error: keyError } = await supabase
      .from('training_access_keys')
      .select('*')
      .eq('access_key', accessKey.toUpperCase())
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json(
        { valid: false, error: 'Invalid access key or email' },
        { status: 401 }
      );
    }

    // Check if key has expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Access key has expired' },
        { status: 401 }
      );
    }

    // Update last used timestamp
    await supabase
      .from('training_access_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    return NextResponse.json({
      valid: true,
      employeeName: keyData.employee_name,
      accessLevel: keyData.access_level || 'full'
    });

  } catch (error) {
    return NextResponse.json(
      { valid: false, error: 'Failed to validate access key' },
      { status: 500 }
    );
  }
}
