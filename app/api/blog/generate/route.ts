import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai-client';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * AI Blog Post Generator
 * Generates blog posts from site content (programs, success stories, etc.)
 */

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check if user is admin
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

    const body = await request.json();
    const { topic, programSlug, category } = body;

    // Fetch site content for context
    let context = '';

    if (programSlug) {
      // Get program details
      const { data: program } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', programSlug)
        .single();

      if (program) {
        context = `Program: ${program.name}\nDescription: ${program.description}\nOutcomes: ${program.outcomes?.join(', ')}\n`;
      }
    }

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured in environment variables' },
        { status: 500 }
      );
    }

    // Get OpenAI client
    const openai = getOpenAIClient();

    // Generate blog post using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional content writer for Elevate for Humanity, a workforce development organization in Indianapolis, Indiana. Write engaging, informative blog posts about career training, apprenticeships, and workforce development. Use a professional but accessible tone. Include practical information, statistics when relevant, and clear calls-to-action.`,
        },
        {
          role: 'user',
          content: `Write a comprehensive blog post about: ${topic}\n\nContext from our site:\n${context}\n\nThe post should:\n- Be 800-1200 words\n- Use markdown formatting\n- Include relevant headings (##)\n- Provide actionable information\n- End with a call-to-action\n- Be SEO-friendly\n- Include information about WIOA funding if relevant\n- Mention our contact info: (317) 314-3757, info@elevateforhumanity.org`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content;

    // Generate title and excerpt
    const metaCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Generate a compelling blog post title and 2-sentence excerpt.',
        },
        {
          role: 'user',
          content: `Based on this blog post content, generate:\n1. A catchy, SEO-friendly title (60 chars max)\n2. A compelling 2-sentence excerpt (150 chars max)\n\nContent:\n${content?.substring(0, 500)}...\n\nReturn as JSON: {"title": "...", "excerpt": "..."}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const meta = JSON.parse(metaCompletion.choices[0].message.content || '{}');

    // Generate slug from title
    const slug = meta.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Calculate reading time (avg 200 words per minute)
    const wordCount = content?.split(/\s+/).length || 0;
    const readingTime = Math.ceil(wordCount / 200);

    // Save to database
    const { data: blogPost, error } = await supabase
      .from('blog_posts')
      .insert({
        title: meta.title,
        slug,
        excerpt: meta.excerpt,
        content,
        category: category || 'Resource',
        status: 'draft', // Admin can review before publishing
        author_name: 'Elevate for Humanity',
        reading_time: readingTime,
        tags: [topic, programSlug].filter(Boolean),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save blog post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      blogPost,
      message: 'Blog post generated successfully (saved as draft)',
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
