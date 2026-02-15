import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Params = Promise<{ slug: string }>;

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { slug } = await params;
    const supabase = await createServerSupabaseClient();

    // Map program slugs to course categories
    const categoryMap: Record<string, string> = {
      'healthcare': 'Healthcare',
      'skilled-trades': 'Skilled Trades',
      'technology': 'Technology',
      'business': 'Business',
      'business-financial': 'Business',
      'cdl-transportation': 'Transportation',
      'cna': 'Healthcare',
      'hvac-technician': 'Skilled Trades',
      'barber-apprenticeship': 'Skilled Trades',
      'tax-preparation': 'Business',
      'tax-entrepreneurship': 'Business',
      'direct-support-professional': 'Healthcare',
      'drug-collector': 'Healthcare',
      'drug-alcohol-specimen-collector': 'Healthcare',
    };

    const category = categoryMap[slug] || slug;

    // Fetch courses matching the category
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('published', true)
      .ilike('category', `%${category}%`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: toErrorMessage(error), 
        courses: [] 
      }, { status: 200 });
    }

    // Transform courses to match expected format
    const transformedCourses = (courses || []).map(course => ({
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
      image: course.cover_image_url || '/images/courses/default-course.jpg',
    }));

    return NextResponse.json({ 
      courses: transformedCourses,
      total: transformedCourses.length 
    });
  } catch (error) { 
    return NextResponse.json({ 
      error: toErrorMessage(error), 
      courses: [] 
    }, { status: 200 });
  }
}
