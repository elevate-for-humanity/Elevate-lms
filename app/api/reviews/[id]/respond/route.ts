import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const { id } = await params;
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { response } = body;

    if (!response) {
      return NextResponse.json(
        { error: 'Response text is required' },
        { status: 400 }
      );
    }

    // Update review with response
    const { data: review, error: updateError } = await supabase
      .from('reviews')
      .update({
        response,
        responded_by: user.id,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Send notification to reviewer if email provided
    if (review.reviewer_email) {
      await supabase.from('email_queue').insert({
        to_email: review.reviewer_email,
        from_email: 'noreply@www.elevateforhumanity.org',
        subject: 'Response to Your Review',
        template_name: 'review_response',
        template_data: {
          reviewerName: review.reviewer_name,
          response,
        },
        related_type: 'review',
        related_id: review.id,
      });
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
