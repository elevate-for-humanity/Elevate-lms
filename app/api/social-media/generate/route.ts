import { safeInternalError } from '@/lib/api/safe-error';
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const PROGRAM_INFO = {
  barber: 'DOL Registered Apprenticeship. 2,000 hours for barber, 1,500 for cosmetology. Earn while learning. State-licensed. WIOA-fundable.',
  cna: 'Certified Nursing Assistant. 4-6 weeks. High demand in Indianapolis hospitals. $16-20/hour starting.  funded for eligible participants. Self-pay: $1,800.',
  cdl: "Commercial Driver's License Class A. 4-6 weeks. $50K-70K/year. High demand. WIOA-funded.",
  hvac: 'HVAC Technician. EPA 608 certification. 6-12 months. $45K-65K/year. ETPL-approved.',
  welding: 'Welding Certification (AWS). 6-12 months. $40K-60K/year. High demand in manufacturing.',
  'direct-support-professional': 'Direct Support Professional (DSP). 8-12 weeks. $35K-45K/year. Behavioral health + caregiving. WIOA-funded.',
  phlebotomy: 'Phlebotomy Technician. 4-6 weeks. $30K-40K/year. High demand in healthcare.',
  'dental-assistant': 'Dental Assistant. 8-12 weeks. $35K-45K/year. Clinical + front office.',
  all: '14+ workforce training programs. Funded (WIOA-funded). Earn while you learn. Job placement assistance.',
};

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!prof || !['admin', 'super_admin', 'staff'].includes(prof.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isAIAvailable()) {
      return NextResponse.json({ success: false, error: 'AI service not configured' }, { status: 503 });
    }

    const { program, count, contentSource } = await req.json();

    if (contentSource === 'blog') {
      try {
        const db = (await requireAdminClient()) || supabase;
        const { data: blogPosts } = await db
          .from('blog_posts').select('title, excerpt, slug').eq('published', true)
          .order('published_at', { ascending: false }).limit(count);
        if (blogPosts && blogPosts.length > 0) {
          const posts = blogPosts.map((post) => {
            const url = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`;
            return `${post.title}\n\n${post.excerpt}\n\nRead more: ${url}\n\n#WorkforceDevelopment #CareerTraining`;
          });
          return NextResponse.json({ success: true, posts });
        }
      } catch (error) { logger.error('Failed to fetch blog posts:', error); }
      return NextResponse.json({ success: true, posts: Array(count).fill('No blog posts available. Create blog content first.') });
    }

    if (contentSource === 'manual') {
      return NextResponse.json({ success: true, posts: Array(count).fill('') });
    }

    const programInfo = PROGRAM_INFO[program as keyof typeof PROGRAM_INFO] || PROGRAM_INFO.all;
    const prompt = `Create ${count} engaging social media posts for ${PLATFORM_DEFAULTS.orgName}, a workforce training organization in Indianapolis.\n\nProgram Focus: ${program === 'all' ? 'All Programs' : program}\nProgram Details: ${programInfo}\n\nRequirements:\n- Mix of post types: success stories, program highlights, WIOA eligibility info, career outcomes, application CTAs\n- Include relevant hashtags (#WorkforceDevelopment #Indianapolis #WIOA #CareerTraining)\n- Emphasize "Funded" and "earn while you learn"\n- Include call-to-action (Apply now, Learn more, Call us)\n- Vary tone: inspirational, informational, urgent\n- Mention Indianapolis/Indiana when relevant\n- Focus on career outcomes and earning potential\n\nReturn ONLY a JSON array of ${count} posts, no other text.`;

    const completion = await aiChat({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are a social media expert for workforce training. Create engaging, action-oriented posts that drive applications. Return only valid JSON array of strings.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
      maxTokens: 3000,
    });

    const content = completion.content || '[]';
    let posts: string[];
    try { posts = JSON.parse(content); } catch { posts = content.split('\n').filter((line) => line.trim().length > 0); }
    if (posts.length < count) posts = [...posts, ...Array(count - posts.length).fill(posts[0] || 'Post content')];
    posts = posts.slice(0, count);

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    logger.error('Social media generation error:', error instanceof Error ? error : new Error(String(error)));
    return safeInternalError(error as Error, 'Internal server error');
  }
}
export const POST = withApiAudit('/api/social-media/generate', _POST);
