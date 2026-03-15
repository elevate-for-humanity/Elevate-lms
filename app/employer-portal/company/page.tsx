import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building, MapPin, Users, Globe, Phone, Mail, Edit, Camera, Award, Briefcase, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Company Profile | Employer Portal',
  description: 'View and manage your company profile.',
  robots: { index: false, follow: false },
};

export default async function CompanyProfilePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/employer-portal/company');
  }

  // Get employer profile linked to this user
  const { data: employer } = await db
    .from('rapids_employers')
    .select('*')
    .eq('contact_email', user.email)
    .single();

  // Get job stats if employer exists
  let activeJobs = 0;
  let totalHires = 0;

  if (employer) {
    // Count active jobs
    const { count: jobCount } = await db
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', employer.id)
      .eq('status', 'active');
    
    activeJobs = jobCount || 0;

    // Count total hires (placements)
    const { count: hireCount } = await db
      .from('placements')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', employer.id);
    
    totalHires = hireCount || 0;
  }

  const stats = {
    activeJobs,
    totalHires,
    wotcCredits: '$0',
    avgTimeToHire: 'N/A',
  };

  // If no employer profile, show setup prompt
  if (!employer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="w-8 h-8 text-brand-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Set Up Your Company Profile</h1>
          <p className="text-gray-600 mb-8">
            Create your company profile to start posting jobs and connecting with qualified candidates.
          </p>
          <Link
            href="/employer-portal/company/setup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
          >
            <Edit className="w-4 h-4" />
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  const companyData = {
    name: employer.business_name || 'Company Name',
    dba: employer.dba_name,
    logo: '/images/pages/apply-employer-hero.jpg',
    cover: '/images/pages/apply-employer-hero.jpg',
    industry: employer.industry || 'Not specified',
    size: employer.employee_count ? `${employer.employee_count} employees` : 'Not specified',
    founded: employer.year_established || 'Not specified',
    website: employer.website || '',
    phone: employer.contact_phone || '',
    email: employer.contact_email || '',
    address: [
      employer.address_line1,
      employer.address_line2,
      employer.city,
      employer.state,
      employer.zip_code
    ].filter(Boolean).join(', ') || 'Not specified',
    description: employer.description || 'No description provided.',
    benefits: employer.benefits || [],
    verified: employer.verified || false,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Cover Image */}
      <div className="relative h-64 bg-brand-blue-600 overflow-hidden">
        {companyData.cover && (
          <Image
            src={companyData.cover}
            alt="Company cover"
            fill
            className="object-cover"
          />
        )}
        
        <Link 
          href="/employer-portal/company/setup"
          className="absolute top-4 right-4 px-4 py-2 bg-white/90 rounded-lg hover:bg-white transition flex items-center gap-2 text-sm"
        >
          <Camera className="w-4 h-4" />
          Change Cover
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Company Header */}
        <div className="relative -mt-16 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative -mt-20 md:-mt-24">
                <div className="w-[120px] h-[120px] rounded-xl border-4 border-white shadow-lg bg-white flex items-center justify-center">
                  <Building className="w-12 h-12 text-gray-400" />
                </div>
                <Link 
                  href="/employer-portal/company/setup"
                  className="absolute bottom-0 right-0 p-2 bg-brand-blue-600 text-white rounded-full hover:bg-brand-blue-700 transition"
                >
                  <Camera className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{companyData.name}</h1>
                  {companyData.dba && (
                    <span className="text-gray-500">DBA: {companyData.dba}</span>
                  )}
                  {companyData.verified ? (
                    <span className="px-3 py-1 bg-brand-green-100 text-brand-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Pending Verification
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {companyData.industry}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {companyData.size}
                  </span>
                  {employer.city && employer.state && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {employer.city}, {employer.state}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/employer-portal/company/setup"
                className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 pb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">About Us</h2>
              <p className="text-gray-600">{companyData.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <Briefcase className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
                <p className="text-sm text-gray-600">Active Jobs</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <Users className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.totalHires}</p>
                <p className="text-sm text-gray-600">Total Hires</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <Award className="w-8 h-8 text-brand-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stats.wotcCredits}</p>
                <p className="text-sm text-gray-600">WOTC Credits</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <p className="text-2xl font-bold text-gray-900">{stats.avgTimeToHire}</p>
                <p className="text-sm text-gray-600">Avg. Time to Hire</p>
              </div>
            </div>

            {/* Benefits */}
            {companyData.benefits.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Benefits &amp; Perks</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {companyData.benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-white rounded-lg">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                {companyData.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a href={`https://${companyData.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 hover:underline">
                      {companyData.website}
                    </a>
                  </div>
                )}
                {companyData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${companyData.phone}`} className="text-gray-700 hover:text-brand-blue-600">
                      {companyData.phone}
                    </a>
                  </div>
                )}
                {companyData.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a href={`mailto:${companyData.email}`} className="text-gray-700 hover:text-brand-blue-600">
                      {companyData.email}
                    </a>
                  </div>
                )}
                {companyData.address !== 'Not specified' && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <span className="text-gray-700">{companyData.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/employer-portal/jobs/new"
                  className="block w-full px-4 py-3 bg-brand-blue-600 text-white text-center rounded-lg hover:bg-brand-blue-700 transition"
                >
                  Post New Job
                </Link>
                <Link
                  href="/employer-portal/candidates"
                  className="block w-full px-4 py-3 border border-brand-blue-600 text-brand-blue-600 text-center rounded-lg hover:bg-brand-blue-50 transition"
                >
                  Browse Candidates
                </Link>
                <Link
                  href="/employer-portal/wotc"
                  className="block w-full px-4 py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-white transition"
                >
                  View WOTC Status
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
