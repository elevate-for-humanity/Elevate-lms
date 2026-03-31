import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, Search, Filter, Plus, Mail, Phone, MapPin,
  MoreVertical, Star, Tag, Building2
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacts | CRM | Admin | Elevate For Humanity',
  description: 'Manage contacts and leads in the CRM.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/crm/contacts');
  }

  // Fetch real contacts from CRM
  const { data: contactData } = await supabase
    .from('crm_contacts')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(20);

  const contacts = (contactData || []).map((c: any) => {
    const updatedAt = new Date(c.updated_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / 86400000);
    const lastContact = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    
    return {
      id: c.id,
      name: c.name || 'Contact',
      email: c.email || '',
      phone: c.phone || '',
      company: c.company || '',
      type: c.contact_type || 'Lead',
      status: c.status || 'Active',
      lastContact,
      image: null,
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hot': return 'bg-brand-red-100 text-brand-red-700';
      case 'Warm': return 'bg-brand-orange-100 text-brand-orange-700';
      case 'Active': return 'bg-brand-green-100 text-brand-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Lead': return 'bg-brand-blue-100 text-brand-blue-700';
      case 'Customer': return 'bg-brand-green-100 text-brand-green-700';
      case 'Partner': return 'bg-brand-blue-100 text-brand-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      {/* Header */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-brand-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
              </div>
              <p className="text-gray-600">Manage your contacts and relationships</p>
            </div>
            <Link
              href="/admin/crm/contacts/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Contact
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Types</option>
                <option>Leads</option>
                <option>Customers</option>
                <option>Partners</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>All Status</option>
                <option>Hot</option>
                <option>Warm</option>
                <option>Active</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contacts Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={contact.image}
                        alt={contact.name}
                        fill
                        className="object-cover"
                       sizes="100vw" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Building2 className="w-3 h-3" />
                        {contact.company}
                      </div>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {contact.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {contact.phone}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(contact.type)}`}>
                    {contact.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                    {contact.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Last contact: {contact.lastContact}</span>
                  <Link
                    href={`/admin/crm/contacts/${contact.id}`}
                    className="text-brand-blue-600 text-sm font-medium hover:text-brand-blue-700"
                  >
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
