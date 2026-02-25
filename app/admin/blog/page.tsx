import { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog Management | Admin',
  description: 'Manage blog posts and content',
};

export default async function BlogAdminPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Blog" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch blog posts from database
  const { data: posts } = await db
    .from('blog_posts')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false });

  const draftCount = posts?.filter(p => p.status === 'draft').length || 0;
  const pendingCount = posts?.filter(p => p.status === 'pending').length || 0;
  const publishedCount = posts?.filter(p => p.status === 'published').length || 0;
  const archivedCount = posts?.filter(p => p.status === 'archived').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Blog management" fill sizes="100vw" className="object-cover" priority />
      </section>

      <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Blog Management</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Editorial Workflow</h2>

        <div className="space-y-4">
          <div className="border-l-4 border-brand-blue-500 pl-4">
            <h3 className="font-semibold">Draft Posts</h3>
            <p className="text-sm text-black">{draftCount} posts in progress</p>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold">Pending Review</h3>
            <p className="text-sm text-black">{pendingCount} posts awaiting approval</p>
          </div>

          <div className="border-l-4 border-brand-green-500 pl-4">
            <h3 className="font-semibold">Published</h3>
            <p className="text-sm text-black">{publishedCount} live blog posts</p>
          </div>

          <div className="border-l-4 border-brand-red-500 pl-4">
            <h3 className="font-semibold">Archived</h3>
            <p className="text-sm text-black">{archivedCount} removed from public view</p>
          </div>
        </div>

        <div className="mt-6">
          <button className="bg-brand-blue-600 text-white px-4 py-2 rounded hover:bg-brand-blue-700" aria-label="Action button">
            Create New Post
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
