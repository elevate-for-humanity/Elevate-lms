import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { STATIC_POSTS, type BlogPost } from '@/content/blog/posts';
import PageVideoHero from '@/components/ui/PageVideoHero';

export const metadata: Metadata = {
  title: 'Blog | Elevate For Humanity',
  description:
    'Workforce development insights, funding guides, credential explainers, and career training tips from Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/blog',
  },
};

export const revalidate = 600;

async function getDbPosts(): Promise<BlogPost[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(20);
    return (data as BlogPost[]) || [];
  } catch {
    return [];
  }
}

function mergePosts(staticPosts: BlogPost[], dbPosts: BlogPost[]): BlogPost[] {
  const dbSlugs = new Set(dbPosts.map((p) => p.slug));
  const filtered = staticPosts.filter((p) => !dbSlugs.has(p.slug));
  return [...dbPosts, ...filtered].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export default async function BlogPage() {
  const dbPosts = await getDbPosts();
  const posts = mergePosts(STATIC_POSTS, dbPosts);
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-gray-50">

      <PageVideoHero
        videoSrc="/videos/homepage-hero-montage.mp4"
        posterSrc="/images/pages/career-services-page-1.jpg"
        posterAlt="Blog — Elevate for Humanity"
        size="support"
      />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Blog' }]} />
        </div>
      </div>

      <div className="bg-brand-red-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Blog</h1>
          <p className="text-lg text-white/80 max-w-2xl">
            Workforce funding guides, credential explainers, and career training insights from Elevate for Humanity.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-14">
        {featured && (
          <div className="mb-14">
            <Link
              href={`/blog/${featured.slug}`}
              className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden md:flex hover:shadow-md transition-shadow"
            >
              <div className="md:w-1/2 relative h-64 md:h-auto bg-slate-100 overflow-hidden">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  priority
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-8 md:w-1/2 flex flex-col justify-center">
                <span className="text-brand-red-600 text-xs font-bold uppercase tracking-wider mb-3">
                  Featured · {featured.category}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-3 group-hover:text-brand-red-600 transition-colors">
                  {featured.title}
                </h2>
                <p className="text-slate-600 mb-5 leading-relaxed">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-5">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {featured.author_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(featured.published_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-brand-red-600 font-semibold text-sm">
                  Read Article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        )}

        {rest.length > 0 && (
          <>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">More Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-brand-red-600 text-xs font-bold uppercase tracking-wider">
                      {post.category}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1 mb-2 line-clamp-2 group-hover:text-brand-red-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />{post.author_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <section className="bg-slate-900 text-white py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Ready to Start Your Career?</h2>
          <p className="text-slate-400 mb-7">Check your eligibility for funded career training programs in Indiana.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-3.5 rounded-lg font-bold transition-colors">
              Apply Now
            </Link>
            <Link href="/programs" className="border border-slate-600 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-slate-800 transition-colors">
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
