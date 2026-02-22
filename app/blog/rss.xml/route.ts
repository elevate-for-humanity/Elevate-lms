import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = 'https://www.elevateforhumanity.org';
  
  try {
    const supabase = createAdminClient();
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt, published_at, category, author_name')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(50);

    const items = (posts || []).map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      <category>${post.category}</category>
      <author>${post.author_name}</author>
    </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Elevate for Humanity Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Success stories, workforce development insights, and program updates</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${baseUrl}/images/logo.png</url>
      <title>Elevate for Humanity</title>
      <link>${baseUrl}</link>
    </image>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Elevate for Humanity Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Success stories and workforce development insights</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
