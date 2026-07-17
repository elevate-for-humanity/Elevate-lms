import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PATHWAYS } from '@/lib/pathways/data';

export const dynamic = 'force-dynamic';
const SLUG_IMAGES: Record<string, string> = {
  cna: '/images/pages/cna-nursing.webp',
  cdl: '/images/pages/cdl-training.webp',
  'barber-apprenticeship': '/images/pages/barber-training.webp',
  hvac: '/images/pages/hvac-technician.webp',
  electrical: '/images/pages/electrical.webp',
  welding: '/images/pages/welding.webp',
  'it-help-desk': '/images/pages/it-help-desk.webp',
  'cybersecurity-analyst': '/images/pages/cybersecurity.webp',
  'medical-assistant': '/images/pages/medical-assistant.webp',
  phlebotomy: '/images/pages/phlebotomy.jpg',
  plumbing: '/images/pages/plumbing.jpg',
  healthcare: '/images/pages/healthcare-sector.webp',
  technology: '/images/pages/technology-sector.webp',
};

export const metadata: Metadata = {
  title: 'pathway.title',
  alternates: { canonical: 'https://www.elevateforhumanity.org/pathways/' },
};

export default async function PathwayDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Try to fetch from database first
  const { data: dbPathway } = await supabase
    .from('pathways')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  const pathway = dbPathway || PATHWAYS.find((p) => p.slug === slug);
  if (!pathway) return notFound();

  const heroImage = SLUG_IMAGES[slug] ?? '/images/pages/programs-hero.webp';

  return (
    <main className="w-full">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Pathways', href: '/pathways' }, { label: pathway.title }]}
          />
        </div>
      </div>

      <header className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src={heroImage}
          alt={pathway.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </header>

      <section className="">
        <div className="mx-auto max-w-6xl px-6 py-12 grid gap-10 md:grid-cols-2">
          <div className="relative h-[320px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
            <Image
              src={heroImage}
              alt={pathway.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="text-slate-900">
            <div className="text-sm text-black">Industry</div>
            <div className="text-xl font-semibold">{pathway.industry}</div>

            <div className="mt-6 grid gap-4">
              <div>
                <span className="font-semibold">Format:</span> {pathway.format}
              </div>
              <div>
                <span className="font-semibold">Duration:</span> {pathway.duration}
              </div>
              <div>
                <span className="font-semibold">Location:</span> {pathway.location}
              </div>
              <div>
                <span className="font-semibold">Funding:</span> {pathway.funding.join(', ')}
              </div>
              <div>
                <span className="font-semibold">Credential:</span> {pathway.credential}
              </div>
              <div>
                <span className="font-semibold">Outcomes:</span> {pathway.outcomes.join(', ')}
              </div>
            </div>

            <div className="mt-8 rounded-md border border-slate-200 p-5 bg-white">
              <div className="font-semibold">What happens next</div>
              <ol className="mt-3 list-decimal pl-5 text-slate-900">
                <li>Start your application (or partner intake).</li>
                <li>Complete eligibility screening and document upload if required.</li>
                <li>Get routed to the correct funding/workforce process.</li>
                <li>Begin training and move toward placement.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
