import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Tenant Site | Elevate For Humanity',
  description: 'White-label tenant site.',
};

export default function TenantSitePage({ params }: { params: { slug?: string } }) {
  // Dynamic catch-all route
  if (params?.slug) {
    redirect(`/tenant-site/${params.slug.join('/')}`);
  }
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Tenant Site</h1>
        <p className="text-slate-600">White-label site platform.</p>
      </div>
    </div>
  );
}
