import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError, safeError } from '@/lib/api/safe-error';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { formId, payload } = body;

    if (!formId) return safeError('formId is required', 400);
    if (!payload || typeof payload !== 'object') return safeError('payload is required', 400);

    const supabase = await createClient();

    // Verify form exists
    const { data: form } = await supabase
      .from('forms')
      .select('id')
      .eq('id', formId)
      .single();

    if (!form) return safeError('Form not found', 404);

    const { error } = await supabase.from('form_submissions').insert({
      form_id: formId,
      payload,
    });

    if (error) return safeInternalError(error, 'Failed to save submission');

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to process submission');
  }
}
