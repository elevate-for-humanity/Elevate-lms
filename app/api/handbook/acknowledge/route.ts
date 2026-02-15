import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const formData = await request.formData();
    const type = formData.get('type') as string || 'student';
    const confirm = formData.get('confirm');

    if (!confirm) {
      return NextResponse.redirect(new URL('/student-handbook?error=not_confirmed', request.url));
    }

    // Record the acknowledgment
    const { error } = await supabase
      .from('handbook_acknowledgments')
      .upsert({
        user_id: user.id,
        handbook_type: type,
        acknowledged_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,handbook_type',
      });

    if (error) {
      logger.error('Error recording acknowledgment:', error);
      return NextResponse.redirect(new URL('/student-handbook?error=failed', request.url));
    }

    return NextResponse.redirect(new URL('/student-handbook?success=acknowledged', request.url));
  } catch (error) {
    logger.error('Handbook acknowledge error:', error);
    return NextResponse.redirect(new URL('/student-handbook?error=server_error', request.url));
  }
}
