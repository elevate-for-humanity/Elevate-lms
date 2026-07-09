import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ArrowRight, CheckCircle, GraduationCap, Users, Award } from 'lucide-react`;

export const metadata: Metadata = {
  title: `Education & Training | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    `Explore our education and training programs. Healthcare, skilled trades, technology, beauty, and business programs with WIOA and workforce funding available.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/education' },
};

export default function EducationPage() {
  const programs = [
    {
      category: 'Healthcare',
      icon: '🏥',
      color: 'bg-blue-600',
      items: ['Certified Nursing Assistant (CNA)', 'Medical Assistant', 'Pharmacy Technician', 'Phlebotomy', 'Dental Assistant', 'Home Health Aide'],
      href: '/programs?category=healthcare',
    },
    {
      category: 'Skilled Trades',
      icon: '🔧',
      color: 'bg-orange-600',
      items: ['HVAC Technician', 'Electrical', 'Plumbing', 'Welding', 'CDL Training', 'Automotive Technician'],
      href: '/programs?category=trades',
    },
    {
      category: 'Technology',
      icon: '💻',
      color: 'bg-indigo-600',
      items: ['IT Help Desk', 'Cybersecurity', 'Web Development', 'Data Analytics', 'CAD Drafting'],
      href: '/programs?category=technology',
    },
    {
      category: 'Beauty & Cosmetology',
      icon: '💇',
      color: 'bg-pink-600',
      items: ['Barber Apprenticeship', 'Cosmetology', 'Esthetician', 'Nail Technician'],
      href: '/programs?category=beauty',
    },
    {
      category: 'Business',
      icon: '📊',
      color: 'bg-emerald-600',
      items: ['Bookkeeping', 'Business Administration', 'Project Management', 'Entrepreneurship', 'Real Estate Agent'],
      href: '/programs?category=business',
    },
    {
      category: 'Apprenticeships',
      icon: '🎓',
      color: 'bg-purple-600',
      items: ['Registered Apprenticeships', 'On-the-Job Training', 'Industry Certifications', 'College Credit Options'],
      href: '/programs?category=apprenticeship',
    },
  ];

  const stats = [
    { value: '95%', label: 'Job Placement Rate', icon: Users },
    { value: '50+', label: 'Programs Available', icon: GraduationCap },
    { value: 'WIOA', label: 'Funding Available', icon: Award },
    { value: '12', label: 'Months Average Duration', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-800 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Education & Career Training
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Transform your career with industry-recognized credentials and hands-on training. 
              Many programs are funded through WIOA and Workforce Ready Grants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Browse All Programs <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-500 transition-colors border-2 border-white/20"
              >
                Apply Today
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-brand-blue-600" />
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Explore Our Programs
            </h2>
            <p className="text-lg text-slate-600">
              Choose from over 50 credential-bearing programs across multiple industries
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Link
                key={program.category}
                href={program.href}
                className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{program.icon}</span>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-blue-600 transition-colors">
                    {program.category}
                  </h3>
                </div>
                <ul className="space-y-2 mb-4">
                  {program.items.slice(0, 4).map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center text-brand-blue-600 font-medium">
                  View all {program.category} programs <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              View All 50+ Programs <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Funding CTA */}
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Funding May Be Available
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Many students qualify for WIOA, Workforce Ready Grant, or other funding sources 
            that can cover tuition and materials.
          </p>
          <Link
            href="/funding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            Check Your Eligibility <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

