export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');

    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    // Public view - only approved
    if (!status) {
      query = query.eq('moderation_status', 'approved');
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Admin view - check permissions
    if (status) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      query = query.eq('moderation_status', status);
    }

    const { data: reviews, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Calculate average rating
    const avgRating = reviews?.length
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : '0.0';

    return NextResponse.json({
      reviews,
      total: reviews?.length || 0,
      averageRating: parseFloat(avgRating),
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await parseBody<Record<string, any>>(request);

    const { reviewer_name, reviewer_email, rating, content } = body;

    // Validate required fields
    if (!reviewer_name || !rating || !content) {
      return NextResponse.json(
        { error: 'Reviewer name, rating, and content are required' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: user?.id || null,
        reviewer_name,
        reviewer_email: reviewer_email || null,
        rating,
        content,
        moderation_status: 'pending',
      })
      .select()
      .single();

    if (reviewError) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }

    // Notify admin of new review
    await supabase.from('email_queue').insert({
      to_email: 'elevate4humanityedu@gmail.com',
      from_email: 'noreply@elevateforhumanity.org',
      subject: 'New Review Submitted - Pending Moderation',
      template_name: 'new_review_notification',
      template_data: {
        reviewerName: reviewer_name,
        rating,
        content,
        reviewId: review.id,
      },
      related_type: 'review',
      related_id: review.id,
    });

    return NextResponse.json({
      success: true,
      review,
      message:
        'Thank you for your review! It will be published after moderation.',
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
