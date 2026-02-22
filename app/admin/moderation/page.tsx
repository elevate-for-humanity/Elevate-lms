import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Moderation Queue | Admin',
  description: 'Review and moderate forum posts',
};

export default async function ModerationPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Moderation" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch flagged posts from database
  const { data: flaggedPosts } = await db
    .from('forum_posts')
    .select('id, title, content, created_at, user_id, status')
    .eq('status', 'flagged')
    .order('created_at', { ascending: false });

  const posts = flaggedPosts || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Moderation Queue</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Flagged Posts ({posts.length})
        </h2>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-gray-500 py-4">No flagged posts to review.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{post.title || 'Untitled Post'}</h3>
                    <p className="text-sm text-black">
                      Posted {new Date(post.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-2">{post.content?.substring(0, 200)}...</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={`/api/admin/moderation/${post.id}/approve`} method="POST">
                      <button className="bg-brand-green-600 text-white px-3 py-2 rounded text-sm hover:bg-brand-green-700" aria-label="Approve post">
                        Approve
                      </button>
                    </form>
                    <form action={`/api/admin/moderation/${post.id}/remove`} method="POST">
                      <button className="bg-brand-red-600 text-white px-3 py-2 rounded text-sm hover:bg-brand-red-700" aria-label="Remove post">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 text-sm text-black">
          <p>Review cadence: Check queue every 4 hours</p>
          <p>Response SLA: 24 hours for flagged content</p>
        </div>
      </div>
    </div>
  );
}
