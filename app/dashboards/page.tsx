import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Building2, 
  DollarSign, 
  Shield, 
  BookOpen,
  UserCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Portals & Dashboards | Elevate For Humanity',
  description: 'Access student portal, employer portal, LMS, staff portal, and more.',
};

const portals = [
  { 
    name: 'Student Portal', 
    description: 'Track your enrollment, courses, and progress',
    href: '/student-portal', 
    icon: GraduationCap, 
    color: 'bg-blue-500',
    public: true
  },
  { 
    name: 'LMS Dashboard', 
    description: 'Access your courses and learning materials',
    href: '/lms', 
    icon: BookOpen, 
    color: 'bg-indigo-500',
    public: true
  },
  { 
    name: 'Employer Portal', 
    description: 'Post jobs, hire graduates, access WOTC credits',
    href: '/employer-portal', 
    icon: Building2, 
    color: 'bg-green-500',
    public: true
  },
  { 
    name: 'Partner Portal', 
    description: 'Track referrals and partnership metrics',
    href: '/partner', 
    icon: Briefcase, 
    color: 'bg-blue-500',
    public: true
  },
  { 
    name: 'Staff Portal', 
    description: 'Manage students, attendance, and reports',
    href: '/staff-portal', 
    icon: Users, 
    color: 'bg-orange-500',
    public: false
  },
  { 
    name: 'Admin Portal', 
    description: 'Full platform administration',
    href: '/admin', 
    icon: Shield, 
    color: 'bg-red-500',
    public: false
  },
  { 
    name: 'Supersonic Fast Cash', 
    description: 'Tax services and refund advances',
    href: '/supersonic-fast-cash', 
    icon: Zap, 
    color: 'bg-yellow-500',
    public: true
  },
  { 
    name: 'Career Services', 
    description: 'Job search, resume help, interview prep',
    href: '/career-services', 
    icon: UserCheck, 
    color: 'bg-teal-500',
    public: true
  },
  { 
    name: 'Training Programs', 
    description: 'Browse all available training programs',
    href: '/programs', 
    icon: LayoutDashboard, 
    color: 'bg-cyan-500',
    public: true
  },
];

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-slate-800 py-16">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Dashboards" }]} />
      </div>
<div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Portals & Dashboards</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Access all Elevate for Humanity services, training portals, and dashboards
          </p>
        </div>

        {/* Public Portals */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Public Access</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.filter(p => p.public).map(portal => (
              <Link 
                key={portal.href} 
                href={portal.href}
                className="bg-white rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${portal.color}`}>
                  <portal.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition mb-2">
                  {portal.name}
                </h3>
                <p className="text-gray-600 mb-4">{portal.description}</p>
                <span className="inline-flex items-center text-blue-600 font-medium">
                  Access Portal <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Staff/Admin Portals */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Staff & Admin Access</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {portals.filter(p => !p.public).map(portal => (
              <Link 
                key={portal.href} 
                href={portal.href}
                className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition group border border-white/20"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${portal.color}`}>
                    <portal.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition">
                      {portal.name}
                    </h3>
                    <p className="text-gray-400 text-sm">{portal.description}</p>
                    <span className="inline-flex items-center text-blue-400 text-sm mt-2">
                      Login Required <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-blue-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need Help Getting Started?</h2>
          <p className="text-blue-100 mb-6">
            Not sure which portal you need? Contact us or apply for a program to get started.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/apply" 
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Apply for Training
            </Link>
            <Link 
              href="/contact" 
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
