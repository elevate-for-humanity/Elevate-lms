import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/admin/program-holders/[id]/countersign-mou',
  },
  title: 'Countersign Mou | Elevate For Humanity',
  description:
    'Countersign program holder MOUs.',
};

export default async function CountersignMouPage() {
  const supabase = await createClient();



  // Fetch relevant data
  const { data: items, count } = await supabase
    .from('programs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20);

  const { count: activeItems } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-ph-countersign-detail.jpg"
          alt="Countersign Mou"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Total Items
                </h3>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {count || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Active
                </h3>
                <p className="text-3xl font-bold text-brand-green-600">
                  {activeItems || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Recent
                </h3>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {items?.filter((i) => {
                    const created = new Date(i.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return created > weekAgo;
                  }).length || 0}
                </p>
              </div>
            </div>

            {/* Data Display */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold mb-4">Items</h2>
              {items && items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <p className="font-semibold">
                        {item.title || item.name || item.id}
                      </p>
                      <p className="text-sm text-black">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black text-center py-8">No items found</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Countersign MOU
                        </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Review and countersign memoranda of understanding with program holders.
                        </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/admin/program-holders"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                View Holders
              </Link>
              <Link
                href="/admin/partners"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                View Partners
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
