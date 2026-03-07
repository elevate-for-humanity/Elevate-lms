import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { SocialShare } from '@/components/blog/SocialShare';
import { ArrowLeft, Calendar, User, Clock, Tag } from 'lucide-react';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';
import { STATIC_POSTS, type BlogPost } from '@/content/blog/posts';

export const revalidate = 600;

type Params = Promise<{ slug: string }>;

// Pre-render static post slugs at build time
export async function generateStaticParams() {
  return STATIC_POSTS.map((post) => ({ slug: post.slug }));
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  // Check static posts first — no DB call needed
  const staticPost = STATIC_POSTS.find((p) => p.slug === slug);
  if (staticPost) return staticPost;

  // Fall back to DB
  try {
    const supabase = createAdminClient();
    if (!supabase) return null;

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error || !post) return null;

    // Increment view count (fire-and-forget)
    supabase
      .from('blog_posts')
      .update({ views: (post.views || 0) + 1 })
      .eq('id', post.id)
      .then(() => {});

    return post as BlogPost;
  } catch {
    return null;
  }
}

async function getRelatedPosts(category: string, currentSlug: string): Promise<Partial<BlogPost>[]> {
  // Static related posts
  const staticRelated = STATIC_POSTS
    .filter((p) => p.category === category && p.slug !== currentSlug)
    .slice(0, 3);

  if (staticRelated.length >= 3) return staticRelated;

  // Top up from DB if needed
  try {
    const supabase = createAdminClient();
    if (!supabase) return staticRelated;

    const staticSlugs = staticRelated.map((p) => p.slug);
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, slug, excerpt, image, published_at')
      .eq('published', true)
      .eq('category', category)
      .neq('slug', currentSlug)
      .order('published_at', { ascending: false })
      .limit(3 - staticRelated.length);

    const dbRelated = (posts || []).filter((p: any) => !staticSlugs.includes(p.slug));
    return [...staticRelated, ...dbRelated].slice(0, 3);
  } catch {
    return staticRelated;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found | Elevate For Humanity',
    };
  }
  
  return {
    title: `${post.title} | Elevate For Humanity Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://www.elevateforhumanity.org/blog/${slug}`,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author_name],
      images: [
        {
          url: post.image || '/images/pages/social-media-1.jpg',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image || '/images/pages/social-media-1.jpg'],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post) {
    notFound();
  }
  
  const relatedPosts = await getRelatedPosts(post.category, slug);
  const postUrl = `https://www.elevateforhumanity.org/blog/${slug}`;
  
  const publishedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: "[Slug]" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 flex items-end overflow-hidden">
        <Image
          src={post.image || '/images/pages/social-media-1.jpg'}
          alt={post.title}
          fill
          className="object-cover"
          quality={90}
          priority
          sizes="100vw"
        />
        
      </section>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 pb-8 border-b border-gray-200">
          <SocialShare url={postUrl} title={post.title} description={post.excerpt} />
        </div>
        
        <div 
          className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-gray-700 prose-a:text-brand-blue-600 prose-strong:text-black"
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(formatContent(post.content)) }}
        />
        
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-5 h-5 text-gray-400" />
              {post.tags.map((tag: string) => (
                <span 
                  key={tag}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Found this helpful? Share it:</p>
          <SocialShare url={postUrl} title={post.title} description={post.excerpt} />
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-black mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related: any) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={related.image || '/images/pages/social-media-1.jpg'}
                      alt={related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-black group-hover:text-brand-blue-600 transition line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {related.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Career Journey?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Join hundreds of students who have transformed their careers through our free training programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-lg hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="px-8 py-4 bg-brand-blue-700 text-white font-bold rounded-lg hover:bg-brand-blue-800 transition border-2 border-white"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatContent(content: string): string {
  if (!content) return '';
  
  return content
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-12 mb-6">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-blue-600 hover:underline">$1</a>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">');
}
