import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Licenses | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export default async function AdminLicensesPage() {
  const supabase = await createClient();


  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Licenses' }]} />
        </div>
      </div>

      <div className="py-12 container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">License Management</h1>
            <p className="text-black">
              Manage program licenses and certifications
            </p>
          </div>
          <Link href="/admin/licenses/create">
            <Button>Create License</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-2">Active Licenses</h3>
              <p className="text-black text-sm">
                View and manage all active program licenses
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">CNA License</h4>
                <p className="text-sm text-black mb-4">
                  Certified Nursing Assistant
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Barber License</h4>
                <p className="text-sm text-black mb-4">
                  Professional Barber Certification
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">HVAC License</h4>
                <p className="text-sm text-black mb-4">
                  HVAC Technician Certification
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
