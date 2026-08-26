import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Building, CheckCircle, Clock, AlertCircle, Search, Filter,
  ExternalLink, Award, TestTube, GraduationCap, Briefcase,
  MapPin, Phone, Mail, ChevronRight, Shield
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Directory',
  keywords: ["partners", "directory", "testing", "employers", "training", "host shops"],
  description: 'Our verified partner network includes testing centers, training providers, employers, and host shops.',
};

const partnerTypes = [
  { id: 'all', name: 'All Partners', icon: Building, count: 47 },
  { id: 'testing', name: 'Testing Partners', icon: TestTube, count: 8 },
  { id: 'training', name: 'Training Partners', icon: GraduationCap, count: 15 },
  { id: 'employer', name: 'Employer Partners', icon: Briefcase, count: 19 },
  { id: 'host', name: 'Host Shops', icon: MapPin, count: 12 },
];

const partners = [
  {
    id: 1,
    name: 'National Healthcareer Association',
    type: 'testing',
    relationship: 'NHA Testing Center',
    program: 'Healthcare Certifications',
    status: 'verified',
    since: '2022',
    contact: { name: 'NHA Support', email: 'support@nha.org', phone: '(800) 499-9092' },
    description: 'Approved NHA testing center for Certified Phlebotomy Technician (CPT), Certified Medical Administrative Assistant (CMAA), and other NHA certifications.',
  },
  {
    id: 2,
    name: 'WorkOne Indiana',
    type: 'training',
    relationship: 'WIOA Partner',
    program: 'Workforce Development',
    status: 'verified',
    since: '2021',
    contact: { name: 'WorkOne Central', email: 'info@workoneindy.org', phone: '(317) 314-3757' },
    description: 'State workforce development partner providing WIOA funding coordination and participant referrals.',
  },
  {
    id: 3,
    name: 'HVAC Excellence',
    type: 'training',
    relationship: 'Training Partner',
    program: 'HVAC/R Refrigerant Handling',
    status: 'verified',
    since: '2023',
    contact: { name: 'HVAC Excellence', email: 'training@hvac excellence.org', phone: '1-800-314-3757' },
    description: 'EPA 608 certification preparation and industry-recognized credentialing for HVAC technicians.',
  },
  {
    id: 4,
    name: 'Indianapolis Barbershop Association',
    type: 'host',
    relationship: 'Host Shop Network',
    program: 'Barber Apprenticeship',
    status: 'verified',
    since: '2022',
    contact: { name: 'IBA Director', email: 'info@indybarbers.com', phone: '(317) 314-3757' },
    description: 'Network of licensed barbershops providing apprenticeship training hours for DOL-registered program.',
  },
  {
    id: 5,
    name: ' Franciscan Health',
    type: 'employer',
    relationship: 'Employer Partner',
    program: 'Healthcare Pathways',
    status: 'verified',
    since: '2022',
    contact: { name: 'HR Training', email: 'careers@franciscanhealth.org', phone: '(317) 314-3757' },
    description: 'Healthcare system partner providing clinical externship opportunities and hire-back agreements.',
  },
  {
    id: 6,
    name: 'Certiport',
    type: 'testing',
    relationship: 'Testing Partner',
    program: 'Microsoft, Adobe, Intuit Certifications',
    status: 'verified',
    since: '2023',
    contact: { name: 'Certiport Support', email: 'info@certiport.com', phone: '(888) 999-0100' },
    description: 'Authorized Certiport testing center for Microsoft Office Specialist, Adobe, and Intuit certifications.',
  },
  {
    id: 7,
    name: 'ABC Indiana Apprenticeship',
    type: 'training',
    relationship: ' apprenticeship Sponsor',
    program: 'Construction Trades',
    status: 'verified',
    since: '2021',
    contact: { name: 'ABC Indiana', email: 'info@abcindiana.org', phone: '(317) 314-3757' },
    description: 'Associated Builders and Contractors apprenticeship program for construction and skilled trades.',
  },
  {
    id: 8,
    name: 'CareerSafe',
    type: 'training',
    relationship: 'Training Partner',
    program: 'OSHA 10/30 Safety',
    status: 'verified',
    since: '2023',
    contact: { name: 'CareerSafe', email: 'training@careersafeonline.com', phone: '(866) 999-0101' },
    description: 'OSHA outreach training provider for construction and general industry safety certifications.',
  },
  {
    id: 9,
    name: 'Beauty Industry Salon Group',
    type: 'host',
    relationship: 'Host Shop Network',
    program: 'Cosmetology & Esthetics Apprenticeship',
    status: 'verified',
    since: '2022',
    contact: { name: 'BIG HR', email: 'careers@beautyindustry.com', phone: '(317) 314-3757' },
    description: 'Multi-location salon network offering cosmetology and esthetics apprenticeship hours.',
  },
  {
    id: 10,
    name: 'Community Health Network',
    type: 'employer',
    relationship: 'Employer Partner',
    program: 'Medical Assistant Pathways',
    status: 'verified',
    since: '2021',
    contact: { name: 'CHN Education', email: 'education@ecommunity.com', phone: '(317) 314-3757' },
    description: 'Major healthcare employer with student externship and hire-back program for medical assistants.',
  },
];

export default function PartnerDirectoryPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/pages/partners-hero.webp" alt="Partner Directory - Elevate for Humanity" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Verified Partners
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Partner Directory
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Our verified partner network includes testing centers, training providers, 
              employers, and host shops. Every partner is vetted and connected to our programs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/partners" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Become a Partner <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Partner Inquiry
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Type Stats */}
      <section className="py-12 bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {partnerTypes.map((type) => (
              <div 
                key={type.id}
                className="bg-white rounded-xl p-4 text-center shadow-sm border border-slate-100"
              >
                <type.icon className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">{type.count}</div>
                <p className="text-sm text-slate-600">{type.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Directory */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 sticky top-24">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Filter Partners</h3>
                
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search partners..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Partner Type Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Partner Type</h4>
                  <div className="space-y-2">
                    {partnerTypes.map((type) => (
                      <label key={type.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                          defaultChecked={type.id === 'all'}
                        />
                        <span className="text-sm text-slate-600 flex-1">{type.name}</span>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                          {type.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Status</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        defaultChecked
                      />
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Verified
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        defaultChecked
                      />
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Pending
                      </span>
                    </label>
                  </div>
                </div>

                {/* Apply Filters Button */}
                <button className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Partner Listings */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {partners.length} Partners Found
                </h2>
                <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm">
                  <option>Sort by: Name A-Z</option>
                  <option>Sort by: Name Z-A</option>
                  <option>Sort by: Newest First</option>
                  <option>Sort by: Type</option>
                </select>
              </div>

              <div className="space-y-6">
                {partners.map((partner) => (
                  <div 
                    key={partner.id}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Partner Logo/Icon */}
                      <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        {partner.type === 'testing' && <TestTube className="w-8 h-8 text-brand-blue-600" />}
                        {partner.type === 'training' && <GraduationCap className="w-8 h-8 text-brand-blue-600" />}
                        {partner.type === 'employer' && <Briefcase className="w-8 h-8 text-brand-blue-600" />}
                        {partner.type === 'host' && <MapPin className="w-8 h-8 text-brand-blue-600" />}
                      </div>

                      {/* Partner Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-900">{partner.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            partner.status === 'verified' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {partner.status === 'verified' && <CheckCircle className="w-3 h-3" />}
                            {partner.status === 'verified' ? 'Verified' : 'Pending'}
                          </span>
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 capitalize">
                            {partner.type}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {partner.relationship}
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            {partner.program}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Partner since {partner.since}
                          </span>
                        </div>

                        <p className="text-slate-600 text-sm mb-4">
                          {partner.description}
                        </p>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <a href={`mailto:${partner.contact.email}`} className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700">
                            <Mail className="w-4 h-4" />
                            {partner.contact.email}
                          </a>
                          <a href={`tel:${partner.contact.phone}`} className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700">
                            <Phone className="w-4 h-4" />
                            {partner.contact.phone}
                          </a>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 lg:items-end">
                        <Link 
                          href={`/partners/${partner.id}`}
                          className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-medium text-sm"
                        >
                          View Profile <ExternalLink className="w-4 h-4" />
                        </Link>
                        {partner.type === 'employer' && (
                          <Link 
                            href="/careers"
                            className="inline-flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium text-sm py-2 px-4 rounded-lg"
                          >
                            View Jobs <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        {partner.type === 'host' && (
                          <Link 
                            href="/apprenticeships"
                            className="inline-flex items-center gap-2 bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 font-medium text-sm py-2 px-4 rounded-lg"
                          >
                            View Positions <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50" disabled>
                    Previous
                  </button>
                  <button className="w-10 h-10 bg-brand-blue-600 text-white rounded-lg font-medium">1</button>
                  <button className="w-10 h-10 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">2</button>
                  <button className="w-10 h-10 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">3</button>
                  <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Types Explained */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Understanding Partner Types
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <TestTube className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Testing Partners</h3>
              <p className="text-slate-600 text-sm mb-4">
                Certifying bodies and authorized testing centers for industry-recognized credentials.
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• NHA Certifications</li>
                <li>• Certiport (Microsoft, Adobe)</li>
                <li>• EPA 608</li>
                <li>• OSHA Safety</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <GraduationCap className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Training Partners</h3>
              <p className="text-slate-600 text-sm mb-4">
                Educational institutions and training providers that complement our programs.
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Community Colleges</li>
                <li>• Trade Schools</li>
                <li>• WIOA Agencies</li>
                <li>• Industry Associations</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                <Briefcase className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Employer Partners</h3>
              <p className="text-slate-600 text-sm mb-4">
                Healthcare systems, businesses, and organizations hiring our graduates.
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Hospital Systems</li>
                <li>• Manufacturing</li>
                <li>• Service Industry</li>
                <li>• Construction</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Host Shops</h3>
              <p className="text-slate-600 text-sm mb-4">
                Licensed businesses providing apprenticeship training hours for students.
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Barbershops</li>
                <li>• Salons/Spas</li>
                <li>• HVAC Companies</li>
                <li>• Auto Shops</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Become a Partner CTA */}
      <section className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Partner Network
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Whether you're an employer looking for talent, a training provider seeking partnerships, 
            or a business that wants to host apprentices — we want to hear from you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/partners" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Apply to Partner <ExternalLink className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}