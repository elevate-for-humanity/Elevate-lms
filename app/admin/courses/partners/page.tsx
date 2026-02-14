import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Building, Plus, Search, ExternalLink, Mail, Phone, Edit, Trash2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Course Partners | Admin',
  description: 'Manage course provider partnerships.',
  robots: { index: false, follow: false },
};

const partners = [
  {
    id: 1,
    name: 'Certiport',
    logo: '/images/community/community-hero.jpg',
    type: 'Certification Provider',
    courses: 12,
    activeStudents: 245,
    contact: 'partnerships@certiport.com',
    status: 'active',
  },
  {
    id: 2,
    name: 'CompTIA',
    logo: '/images/heroes-hq/career-services-hero.jpg',
    type: 'IT Certification',
    courses: 8,
    activeStudents: 189,
    contact: 'edu@comptia.org',
    status: 'active',
  },
  {
    id: 3,
    name: 'Adobe',
    logo: '/images/heroes-hq/employer-hero.jpg',
    type: 'Creative Software',
    courses: 6,
    activeStudents: 156,
    contact: 'education@adobe.com',
    status: 'active',
  },
  {
    id: 4,
    name: 'OSHA Training Institute',
    logo: '/images/heroes-hq/success-hero.jpg',
    type: 'Safety Training',
    courses: 4,
    activeStudents: 312,
    contact: 'training@osha.gov',
    status: 'active',
  },
];

export default function CoursePartnersPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Partners" }]} />
      </div>
<div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Course Partners</h1>
            <p className="text-gray-600">Manage certification and training provider partnerships</p>
          </div>
          <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search partners..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500">
              <option>All Types</option>
              <option>Certification Provider</option>
              <option>IT Certification</option>
              <option>Safety Training</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={64}
                    height={64}
                    className="rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">{partner.name}</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        {partner.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{partner.type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{partner.courses}</p>
                    <p className="text-xs text-gray-500">Courses</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{partner.activeStudents}</p>
                    <p className="text-xs text-gray-500">Active Students</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {partner.contact}
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                <Link
                  href={`/admin/courses/partners/${partner.id}`}
                  className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  View Details <ExternalLink className="w-3 h-3" />
                </Link>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
