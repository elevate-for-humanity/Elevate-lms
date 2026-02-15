import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const PROGRAM_INFO = {
  barber:
    'DOL Registered Apprenticeship. 2,000 hours for barber, 1,500 for cosmetology. Earn while learning. State-licensed. WIOA-fundable.',
  cna: 'Certified Nursing Assistant. 4-6 weeks. High demand in Indianapolis hospitals. $16-20/hour starting. WIOA-funded.',
  cdl: "Commercial Driver's License Class A. 4-6 weeks. $50K-70K/year. High demand. WIOA-funded.",
  hvac: 'HVAC Technician. EPA 608 certification. 6-12 months. $45K-65K/year. ETPL-approved.',
  welding:
    'Welding Certification (AWS). 6-12 months. $40K-60K/year. High demand in manufacturing.',
  'direct-support-professional':
    'Direct Support Professional (DSP). 8-12 weeks. $35K-45K/year. Behavioral health + caregiving. WIOA-funded.',
  phlebotomy:
    'Phlebotomy Technician. 4-6 weeks. $30K-40K/year. High demand in healthcare.',
  'dental-assistant':
    'Dental Assistant. 8-12 weeks. $35K-45K/year. Clinical + front office.',
  all: '14+ workforce training programs. Funded (WIOA-funded). Earn while you learn. Job placement assistance.',
};

export async function POST(req: Request) {
  try {
    if (!openai) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const { program, count, contentSource } = await req.json();

    if (contentSource === 'blog') {
      // Fetch from blog posts
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        const { data: blogPosts } = await supabase
          .from('blog_posts')
          .select('title, excerpt, slug')
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(count);

        if (blogPosts && blogPosts.length > 0) {
          const posts = blogPosts.map((post) => {
            const url = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`;
            return `${post.title}\n\n${post.excerpt}\n\nRead more: ${url}\n\n#WorkforceDevelopment #CareerTraining`;
          });

          return NextResponse.json({
            success: true,
            posts: posts,
          });
        }
      } catch (error) {
        logger.error('Failed to fetch blog posts:', error);
      }

      // Fallback if no blog posts found
      return NextResponse.json({
        success: true,
        posts: Array(count).fill(
          'No blog posts available. Create blog content first.'
        ),
      });
    }

    if (contentSource === 'manual') {
      return NextResponse.json({
        success: true,
        posts: Array(count).fill(''),
      });
    }

    // AI Generation
    const programInfo =
      PROGRAM_INFO[program as keyof typeof PROGRAM_INFO] || PROGRAM_INFO.all;

    const prompt = `Create ${count} engaging social media posts for Elevate for Humanity, a workforce training organization in Indianapolis.

Program Focus: ${program === 'all' ? 'All Programs' : program}
Program Details: ${programInfo}

Requirements:
- Mix of post types: success stories, program highlights, WIOA eligibility info, career outcomes, application CTAs
- Include relevant hashtags (#WorkforceDevelopment #Indianapolis #WIOA #CareerTraining)
- Emphasize "Funded" and "earn while you learn"
- Include call-to-action (Apply now, Learn more, Call us)
- Vary tone: inspirational, informational, urgent
- Mention Indianapolis/Indiana when relevant
- Focus on career outcomes and earning potential

Return ONLY a JSON array of ${count} posts, no other text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a social media expert for workforce training. Create engaging, action-oriented posts that drive applications. Return only valid JSON array of strings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 3000,
    });

    const content = completion.choices[0].message.content || '[]';

    // Parse JSON response
    let posts: string[];
    try {
      posts = JSON.parse(content);
    } catch (error) {
      // Fallback if not valid JSON
      posts = content.split('\n').filter((line) => line.trim().length > 0);
    }

    // Ensure we have the right number of posts
    if (posts.length < count) {
      posts = [
        ...posts,
        ...Array(count - posts.length).fill(posts[0] || 'Post content'),
      ];
    }
    posts = posts.slice(0, count);

    return NextResponse.json({ success: true, posts });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Social media generation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
