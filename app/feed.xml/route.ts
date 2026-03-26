import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch published blog posts
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(50);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const buildDate = new Date().toUTCString();

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Elevate For Humanity Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Latest news, success stories, and workforce development insights</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${(posts || []).map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || post.content?.substring(0, 200)}]]></description>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      ${post.author ? `<author>${post.author}</author>` : ''}
      ${post.category ? `<category>${post.category}</category>` : ''}
      ${post.featured_image ? `<enclosure url="${siteUrl}${post.featured_image}" type="image/jpeg"/>` : ''}
    </item>`).join('')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error) { /* Error handled silently */ 
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
