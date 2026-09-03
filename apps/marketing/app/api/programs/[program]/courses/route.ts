// PUBLIC ROUTE: public program course list
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Params = Promise<{ program: string }>;

async function _GET(request: Request, { params }: { params: Params }) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { program: slug } = await params;
    const supabase = await createServerSupabaseClient();

    const categoryMap: Record<string, string> = {
      healthcare: 'Healthcare',
      'skilled-trades': 'Skilled Trades',
      technology: 'Technology',
      business: 'Business',
      'business-financial': 'Business',
      'cdl-transportation': 'Transportation',
      cna: 'Healthcare',
      'hvac-technician': 'Skilled Trades',
      'barber-apprenticeship': 'Skilled Trades',
      'direct-support-professional': 'Healthcare',
      'drug-collector': 'Healthcare',
      'drug-alcohol-specimen-collector': 'Healthcare',
    };

    const category = categoryMap[slug] || slug;
    const { data: courses, error } = await supabase
      .from('lms_courses')
      .select('*')
      .eq('published', true)
      .ilike('category', `%${category}%`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: toErrorMessage(error), courses: [] }, { status: 200 });
    }

    const transformedCourses = (courses || []).map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description || '',
      duration: course.duration_hours ? `${course.duration_hours} hours` : '8 weeks',
      lessons: course.duration_hours || 24,
      price: course.price || 0,
      originalPrice: course.original_price,
      enrolled: course.enrolled_count || 0,
      certification: course.certification || false,
      funding: course.funding_source,
      image: course.cover_image_url || '/images/pages/course-create-hero.webp',
    }));

    return NextResponse.json({ courses: transformedCourses, total: transformedCourses.length });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error), courses: [] }, { status: 200 });
  }
}

export const GET = withApiAudit('/api/programs/[program]/courses', _GET);
