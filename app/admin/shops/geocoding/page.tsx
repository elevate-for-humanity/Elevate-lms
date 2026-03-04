import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import GeocodingManager from './GeocodingManager';

export const dynamic = 'force-dynamic';

export default async function AdminGeocodingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // Get shops with geocoding status
  const { data: shops } = await db
    .from('shops')
    .select('id, name, address1, address2, city, state, zip, latitude, longitude, geocoded_at, geocode_source, geocode_failed_at, geocode_error, active')
    .order('name');

  const allShops = shops || [];
  const needsGeocoding = allShops.filter(s => s.active && !s.latitude && !s.geocode_failed_at);
  const geocoded = allShops.filter(s => s.latitude && s.longitude);
  const failed = allShops.filter(s => s.geocode_failed_at);

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-shops-geocoding-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <h1 className="text-2xl font-bold mb-6">Shop Geocoding</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-gray-900">{allShops.length}</div>
          <div className="text-sm text-gray-500">Total Shops</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-brand-green-600">{geocoded.length}</div>
          <div className="text-sm text-gray-500">Geocoded</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-yellow-600">{needsGeocoding.length}</div>
          <div className="text-sm text-gray-500">Needs Geocoding</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-3xl font-bold text-brand-red-600">{failed.length}</div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
      </div>

      <GeocodingManager shops={allShops} />
    </div>
  );
}
