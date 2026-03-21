import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FileText, 
  Shield, 
  Scale, 
  DollarSign, 
  GraduationCap, 
  Clock, 
  Users, 
  Lock,
  Accessibility,
  AlertCircle,
  Building,
  ArrowRight,
  Phone,
  Mail,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Student Consumer Information & Disclosures | Elevate for Humanity',
  description: 'Required disclosures and consumer information for prospective and current students at Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/disclosures',
  },
};

export default function DisclosuresPage() {
  return (
    <div className="min-h-screen bg-white prose-institutional">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Disclosures' }]} />
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative min-h-48 md:h-64 flex items-center overflow-hidden">
        <Image
          src="/images/pages/disclosures-page-1.jpg"
          alt="Student Consumer Information"
          fill
          className="object-cover"
          priority
        />
      </section>

      {/* Quick Stats */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-brand-orange-400">DOL</div>
              <div className="text-slate-600 text-sm">Registered Sponsor</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-orange-400">WIOA</div>
              <div className="text-slate-600 text-sm">Approved Provider</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-orange-400">ETPL</div>
              <div className="text-slate-600 text-sm">Listed Training</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand-orange-400">100%</div>
              <div className="text-slate-600 text-sm">Compliant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Institution Info Card */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-48 relative">
                <Image
                  src="/images/pages/admin-at-risk-hero.jpg"
                  alt="Our Institution"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-2xl font-bold text-slate-900">About Our Institution</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-gray-700">
                  <p><span className="font-semibold text-gray-900">Legal Name:</span> 2Exclusive LLC-S (DBA Elevate for Humanity Career &amp; Technical Institute)</p>
                  <p><span className="font-semibold text-gray-900">Location:</span> Indianapolis, Indiana</p>
                  <p><span className="font-semibold text-gray-900">Phone:</span> (317) 314-3757</p>
                  <p><span className="font-semibold text-gray-900">Email:</span> our contact form</p>
                  <p><span className="font-semibold text-gray-900">RAPIDS #:</span> 2025-IN-132301</p>
                </div>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 mt-6 text-brand-orange-600 font-semibold hover:text-brand-orange-700"
                >
                  Learn More About Us
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-48 relative">
                <Image
                  src="/images/pages/compliance-page-1.jpg"
                  alt="Approvals"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-2xl font-bold text-slate-900">Approvals & Registrations</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {[
                    'DOL Registered Apprenticeship Sponsor',
                    'WIOA Eligible Training Provider (ETPL)',
                    'Indiana Workforce Ready Grant Approved',
                    'State Board of Cosmetology Approved',
                    'Indiana DWD Partner'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/accreditation"
                  className="inline-flex items-center gap-2 mt-6 text-brand-orange-600 font-semibold hover:text-brand-orange-700"
                >
                  View All Credentials
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policies Section */}
      <section id="policies" className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Policies & Disclosures
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Click on any policy below to view the complete document.
            </p>
          </div>

          {/* Institutional Policies */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-brand-blue-600" />
              </div>
              Institutional Policies
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Privacy Policy', href: '/privacy-policy', icon: Lock, color: 'blue' },
                { title: 'Terms of Service', href: '/terms-of-service', icon: FileText, color: 'blue' },
                { title: 'Accessibility', href: '/accessibility', icon: Accessibility, color: 'blue' },
                { title: 'FERPA Policy', href: '/policies/ferpa', icon: Shield, color: 'blue' },
              ].map((policy) => {
                const Icon = policy.icon;
                return (
                  <Link
                    key={policy.href}
                    href={policy.href}
                    className="group bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-brand-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 bg-brand-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-blue-100 transition">
                      <Icon className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-brand-blue-600 transition">
                      {policy.title}
                    </h4>
                    <span className="text-sm text-gray-500 group-hover:text-brand-blue-500 flex items-center gap-1 mt-2">
                      View Policy <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Academic Policies */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-brand-blue-600" />
              </div>
              Academic Policies
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Admissions Policy', href: '/policies/admissions', icon: Users },
                { title: 'Attendance Policy', href: '/policies/attendance', icon: Clock },
                { title: 'Academic Progress', href: '/satisfactory-academic-progress', icon: GraduationCap },
                { title: 'Student Code', href: '/policies/student-code', icon: Scale },
              ].map((policy) => {
                const Icon = policy.icon;
                return (
                  <Link
                    key={policy.href}
                    href={policy.href}
                    className="group bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-brand-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 bg-brand-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-blue-100 transition">
                      <Icon className="w-6 h-6 text-brand-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-brand-blue-600 transition">
                      {policy.title}
                    </h4>
                    <span className="text-sm text-gray-500 group-hover:text-brand-blue-500 flex items-center gap-1 mt-2">
                      View Policy <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Financial Policies */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-brand-green-600" />
              </div>
              Financial Policies
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Tuition & Fees', href: '/tuition-fees', icon: DollarSign },
                { title: 'Refund Policy', href: '/refund-policy', icon: DollarSign },
                { title: 'WIOA Policy', href: '/policies/wioa', icon: Building },
                { title: 'WRG Policy', href: '/policies/wrg', icon: Building },
              ].map((policy) => {
                const Icon = policy.icon;
                return (
                  <Link
                    key={policy.href}
                    href={policy.href}
                    className="group bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-brand-green-500 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 bg-brand-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-green-100 transition">
                      <Icon className="w-6 h-6 text-brand-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-brand-green-600 transition">
                      {policy.title}
                    </h4>
                    <span className="text-sm text-gray-500 group-hover:text-brand-green-500 flex items-center gap-1 mt-2">
                      View Policy <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Compliance Policies */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-brand-orange-600" />
              </div>
              Compliance & Non-Discrimination
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Verify Credentials', href: '/verify-credentials', icon: Shield },
                { title: 'Equal Opportunity', href: '/equal-opportunity', icon: Scale },
                { title: 'Federal Compliance', href: '/federal-compliance', icon: Shield },
                { title: 'Grievance Procedure', href: '/grievance', icon: AlertCircle },
              ].map((policy) => {
                const Icon = policy.icon;
                return (
                  <Link
                    key={policy.href}
                    href={policy.href}
                    className="group bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-brand-orange-500 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 bg-brand-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-orange-100 transition">
                      <Icon className="w-6 h-6 text-brand-orange-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-brand-orange-600 transition">
                      {policy.title}
                    </h4>
                    <span className="text-sm text-gray-500 group-hover:text-brand-orange-500 flex items-center gap-1 mt-2">
                      View Policy <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Important Notices */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Important Notices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Transferability of Credits</h3>
                  <p className="text-gray-700">
                    Credits earned at Elevate for Humanity are not guaranteed to transfer to other institutions. 
                    Our programs award industry certifications and Certificates of Completion, not academic degrees. 
                    Contact receiving institutions directly about transfer policies.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-brand-blue-50 border-2 border-brand-blue-200 rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Program Delivery</h3>
                  <p className="text-gray-700">
                    Programs are delivered through hybrid format combining online coursework via our LMS 
                    with in-person instruction and hands-on training at our Indianapolis facilities. 
                    Specific requirements vary by program.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complaint Process CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Have a Concern?</h2>
              <p className="text-slate-600 text-lg mb-6">
                We take all complaints seriously. If you have a concern about our programs, 
                policies, or services, we want to hear from you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-brand-orange-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Email</p>
                    <a href="/contact" className="text-slate-900 hover:text-brand-orange-400">
                      our contact form
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-brand-orange-400" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Phone</p>
                    <a href="/support" className="text-slate-900 hover:text-brand-orange-400">
                      (317) 314-3757
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-4">File a Grievance</h3>
              <p className="text-slate-600 mb-6">
                Our formal grievance process ensures your concerns are addressed promptly and fairly.
              </p>
              <Link
                href="/grievance"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-slate-900 font-semibold rounded-lg transition-colors w-full justify-center"
              >
                View Grievance Procedure
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-slate-500 text-sm mt-4 text-center">
                Response within 10 business days
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Notice */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-semibold text-gray-900">
            This institution is an equal opportunity provider and employer.
          </p>
          <p className="text-gray-600 mt-2">
            Auxiliary aids and services are available upon request to individuals with disabilities. TTY/TDD: 711 (Indiana Relay)
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Last Updated: January 2026
          </p>
        </div>
      </section>
    </div>
  );
}
