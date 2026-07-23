import { Metadata } from 'next';
import Link from 'next/link';
import { Search, Filter, MapPin, Phone, Mail, CheckCircle, Clock, AlertCircle, ExternalLink, Building2, GraduationCap, TestTube, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Directory',
  description: 'Find verified workforce development partners, training providers, testing centers, and employers in our network.',
  keywords: ['workforce partners', 'training providers', 'testing centers', 'employer directory', 'apprenticeship partners'],
};

const PARTNER_TYPES = [
  { id: 'all', label: 'All Partners', icon: Users },
  { id: 'training', label: 'Training Partners', icon: GraduationCap },
  { id: 'testing', label: 'Testing Centers', icon: TestTube },
  { id: 'employer', label: 'Employer Partners', icon: Building2 },
  { id: 'host', label: 'Host Shops', icon: MapPin },
];

const PARTNERS = [
  {
    id: 1,
    name: 'WorkOne Northwest',
    type: 'training',
    location: 'Gary, IN',
    phone: '(219) 314-3757',
    email: 'info@workone-nw.org',
    status: 'verified',
    programs: ['Medical Assistant', 'HVAC', 'CDL'],
    description: 'Workforce development center providing WIOA-funded training programs.',
  },
  {
    id: 2,
    name: 'ProCert Testing Center',
    type: 'testing',
    location: 'Indianapolis, IN',
    phone: '(317) 314-3757',
    email: 'testing@procert.com',
    status: 'verified',
    programs: ['ACT WorkKeys', 'Certiport', 'EPA 608'],
    description: 'Authorized testing center for certifications and credentialing.',
  },
  {
    id: 3,
    name: 'Premier Health Systems',
    type: 'employer',
    location: 'Fort Wayne, IN',
    phone: '(260) 314-3757',
    email: 'hr@premierhealth.org',
    status: 'verified',
    programs: ['Medical Assistant', 'Phlebotomy'],
    description: 'Healthcare employer hiring program graduates.',
  },
  {
    id: 4,
    name: 'StyleMasters Barbershop',
    type: 'host',
    location: 'South Bend, IN',
    phone: '(574) 314-3757',
    email: 'hello@stylemasters.com',
    status: 'verified',
    programs: ['Barber Apprenticeship'],
    description: 'Host shop for barber apprenticeship training.',
  },
  {
    id: 5,
    name: 'Vocational Rehab Services',
    type: 'training',
    location: 'Evansville, IN',
    phone: '(812) 314-3757',
    email: 'info@vrehs.org',
    status: 'verified',
    programs: ['All Programs'],
    description: 'Vocational rehabilitation services for individuals with disabilities.',
  },
  {
    id: 6,
    name: 'TechSkills Academy',
    type: 'training',
    location: 'Carmel, IN',
    phone: '(317) 314-3757',
    email: 'admissions@techskills.edu',
    status: 'pending',
    programs: ['HVAC', 'Building Maintenance'],
    description: 'Technical skills training provider.',
  },
  {
    id: 7,
    name: 'Regional Medical Center',
    type: 'employer',
    location: 'Muncie, IN',
    phone: '(765) 314-3757',
    email: 'talent@regionmed.org',
    status: 'verified',
    programs: ['Medical Assistant', 'EKG', 'Phlebotomy'],
    description: 'Regional hospital network actively hiring graduates.',
  },
  {
    id: 8,
    name: 'Glow Salon & Spa',
    type: 'host',
    location: 'Bloomington, IN',
    phone: '(812) 314-3757',
    email: 'info@glowsalon.com',
    status: 'verified',
    programs: ['Cosmetology', 'Esthetics'],
    description: 'Full-service salon hosting apprenticeship programs.',
  },
  {
    id: 9,
    name: 'TruckMasters CDL Training',
    type: 'training',
    location: 'Jeffersonville, IN',
    phone: '(812) 314-3757',
    email: 'info@truckmasters.com',
    status: 'verified',
    programs: ['CDL Class A', 'CDL Class B'],
    description: 'Commercial driver&apos;s license training with job placement.',
  },
  {
    id: 10,
    name: 'Summit HVAC Solutions',
    type: 'employer',
    location: 'Lafayette, IN',
    phone: '(765) 314-3757',
    email: 'careers@summithvac.com',
    status: 'verified',
    programs: ['HVAC Technician'],
    description: 'HVAC contractor hiring apprentices and technicians.',
  },
];

const STATUS_CONFIG = {
  verified: { label: 'Verified', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-indigo-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Partner Directory</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Connect with verified training providers, testing centers, employers, and host shops in the Elevate network.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{PARTNERS.length}+</div>
              <div className="text-sm text-slate-600">Total Partners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{PARTNERS.filter(p => p.status === 'verified').length}</div>
              <div className="text-sm text-slate-600">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{PARTNER_TYPES.length - 1}</div>
              <div className="text-sm text-slate-600">Partner Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">10+</div>
              <div className="text-sm text-slate-600">Programs Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search partners by name, location, or program..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PARTNER_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Grid */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PARTNERS.map((partner) => {
              const statusConfig = STATUS_CONFIG[partner.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig.icon;
              const TypeIcon = PARTNER_TYPES.find(t => t.id === partner.type)?.icon || Users;

              return (
                <div key={partner.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{partner.name}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {partner.location}
                          </p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-4">{partner.description}</p>

                    <div className="mb-4">
                      <p className="text-xs font-medium text-slate-500 mb-2">Programs:</p>
                      <div className="flex flex-wrap gap-1">
                        {partner.programs.map((program) => (
                          <span key={program} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                            {program}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <a href={`tel:${partner.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                        <Phone className="w-4 h-4" />
                        {partner.phone}
                      </a>
                      <a href={`mailto:${partner.email}`} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
                        <Mail className="w-4 h-4" />
                        {partner.email}
                      </a>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 px-6 py-3 bg-slate-50">
                    <Link 
                      href={`/contact?partner=${partner.id}`}
                      className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Contact Partner <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {PARTNERS.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No partners found</h3>
              <p className="text-slate-600">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Partner with Us CTA */}
      <section className="py-16 bg-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Become a Partner</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our network of training providers, employers, testing centers, and host shops. 
            Together we can build a stronger workforce.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/for-partners" className="bg-white text-blue-800 font-bold py-3 px-6 rounded-lg hover:bg-blue-50">
              Partner Application
            </Link>
            <Link href="/contact" className="bg-blue-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 border border-blue-600">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Verification Info */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Partner Verification Process
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">1. Application</h4>
                <p>Complete the partner application with your organization details and program offerings.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">2. Review</h4>
                <p>Our team reviews credentials, verifies licenses, and checks references.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">3. Verified Status</h4>
                <p>Approved partners receive verification badge and directory listing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
