import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Funded Training Programs | WIOA & WRG Approved',
  description: 'Explore ETPL-approved programs available at no cost through federal and state funding.',
};

export default async function GrantProgramsPage() {
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, slug, description, short_description, image_url, hero_image_url, wioa_approved')
    .eq('is_active', true)
    .eq('wioa_approved', true)
    .order('title');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Grant Programs' }]} />
        </div>
      </div>

      <header className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">Funded Training Programs</h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            ETPL Approved • WIOA Eligible • WRG Funded • JRI Approved
          </p>
        </div>
      </header>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(programs || []).map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition">
                <div className="relative aspect-video">
                  <Image 
                    src={p.image_url || '/images/pages/admin-dashboard-hero.webp'} 
                    alt={p.title} 
                    fill 
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-slate-900 text-lg mb-2 text-white">{p.title}</h3>
                  <p className="text-slate-600 text-sm mb-6 line-clamp-3">{p.short_description || p.description}</p>
                  <Link href={`/programs/${p.slug}`} className="block text-center bg-slate-900 text-white font-semibold py-2.5 rounded-lg hover:bg-slate-700 transition">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
