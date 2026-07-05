export const revalidate = 3600;

import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Locations | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Locations page.`,
};

export default function LocationsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Locations</h1>
        </div>
      </section>
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-600">This page is under development.</p>
        </div>
      </section>
    </div>
  );
}

