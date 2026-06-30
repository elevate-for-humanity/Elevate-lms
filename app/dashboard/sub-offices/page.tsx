import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Building2, Users, MapPin, Phone, Mail, Plus, Edit } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Sub-Offices | Dashboard',
  description: 'Manage regional training locations.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SubOfficesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/sub-offices');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Fetch sub-offices
  const { data: offices } = await supabase
    .from('sub_offices')
    .select(
      `
      id,
      name,
      address,
      city,
      state,
      zip_code,
      phone,
      email,
      manager_id,
      is_active,
      created_at,
      manager:profiles!sub_offices_manager_id_fkey(full_name)
    `,
    )
    .order('name');

  // Get enrollment counts per office
  const officesWithStats = await Promise.all(
    (offices || []).map(async (office: any) => {
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('sub_office_id', office.id)
        .eq('status', 'active');

      return {
        ...office,
        studentCount: count || 0,
      };
    }),
  );

  const totalStudents = officesWithStats.reduce((sum, o) => sum + o.studentCount, 0);
  const activeOffices = officesWithStats.filter((o) => o.is_active).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
          <Link href="/" className="hover:text-orange-600">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`https://admin.${PLATFORM_DEFAULTS.canonicalDomain}/admin/dashboard`} className="hover:text-orange-600">
            Admin
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900">Sub-Offices</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sub-Offices</h1>
            <p className="text-slate-600">Manage regional training locations</p>
          </div>
          <Link
            href="/dashboard/sub-offices"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" /> Add Office
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <Building2 className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{officesWithStats.length}</p>
            <p className="text-slate-600 text-sm">Total Offices</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Users className="w-8 h-8 text-brand-green-500 mb-2" />
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-slate-600 text-sm">Active Students</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <MapPin className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{activeOffices}</p>
            <p className="text-slate-600 text-sm">Active Locations</p>
          </div>
        </div>

        {/* Offices Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officesWithStats.length > 0 ? (
            officesWithStats.map((office: any) => (
              <div
                key={office.id}
                className={`bg-white rounded-xl border p-6 ${!office.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      office.is_active ? 'bg-brand-green-100 text-brand-green-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {office.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-2">{office.name}</h3>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {office.address}, {office.city}, {office.state} {office.zip_code}
                  </p>
                  {office.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {office.phone}
                    </p>
                  )}
                  {office.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {office.email}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-slate-500">Manager</p>
                    <p className="font-medium">{office.manager?.full_name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Students</p>
                    <p className="font-medium">{office.studentCount}</p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/sub-offices/${office.id}`}
                  className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  <Edit className="w-4 h-4" /> Manage
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl border p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-900">No sub-offices yet</p>
              <p className="text-sm text-slate-500 mb-4">Add your first regional office</p>
              <Link
                href="/dashboard/sub-offices"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Plus className="w-4 h-4" /> Add Office
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
