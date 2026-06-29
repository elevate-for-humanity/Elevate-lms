import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  GraduationCap,
  Building2,
  Users,
  Briefcase,
  Shield,
  UserCheck,
  ArrowRight,
  LogIn
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Portals | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Access your ${PLATFORM_DEFAULTS.orgName} portal. Student dashboard, employer portal, instructor tools, and admin dashboard.`,
  alternates: {
    canonical: `${PLATFORM_DEFAULTS.siteUrl}/portals`,
  },
};

export default function PortalsPage() {
  const portals = [
    {
      icon: GraduationCap,
      title: 'Student / Learner',
      description: 'Access your courses, track progress, view grades, and manage your learning journey.',
      href: '/lms/dashboard',
      color: 'bg-brand-blue-100',
      iconColor: 'text-brand-blue-900',
      features: ['Courses & lessons', 'Grades & transcripts', 'Certificates', 'Career services'],
    },
    {
      icon: UserCheck,
      title: 'Apprentice',
      description: 'Track your apprenticeship hours, submit OJT records, and connect with your mentor.',
      href: '/lms/dashboard',
      color: 'bg-purple-100',
      iconColor: 'text-purple-900',
      features: ['OJT hour tracking', 'Mentor communication', 'Progress reporting', 'DOL compliance'],
    },
    {
      icon: Building2,
      title: 'Employer',
      description: 'Post jobs, sponsor apprenticeships, view graduate profiles, and manage OJT records.',
      href: '/lms/dashboard',
      color: 'bg-green-100',
      iconColor: 'text-green-900',
      features: ['Job board access', 'Apprenticeship management', 'Graduate hiring', 'WOTC tracking'],
    },
    {
      icon: Users,
      title: 'Instructor',
      description: 'Manage courses, grade assignments, track student progress, and communicate with learners.',
      href: '/lms/dashboard',
      color: 'bg-orange-100',
      iconColor: 'text-orange-900',
      features: ['Course management', 'Assignment grading', 'Student analytics', 'Communication tools'],
    },
    {
      icon: Briefcase,
      title: 'Partner / Program Holder',
      description: 'Access program materials, submit compliance documents, and manage host shop operations.',
      href: '/lms/dashboard',
      color: 'bg-cyan-100',
      iconColor: 'text-cyan-900',
      features: ['Program materials', 'Document submission', 'Host shop portal', 'Compliance tracking'],
    },
    {
      icon: Shield,
      title: 'Admin Dashboard',
      description: 'Platform administration, user management, analytics, and system configuration.',
      href: '/admin/dashboard',
      color: 'bg-slate-100',
      iconColor: 'text-slate-900',
      features: ['User management', 'Analytics & reports', 'System settings', 'Audit logs'],
    },
    {
      icon: Users,
      title: 'Case Manager',
      description: 'Track participant progress, manage enrollments, and coordinate with training providers.',
      href: '/lms/dashboard',
      color: 'bg-pink-100',
      iconColor: 'text-pink-900',
      features: ['Participant tracking', 'Enrollment management', 'Progress reporting', 'Agency coordination'],
    },
    {
      icon: Users,
      title: 'Mentor',
      description: 'Guide apprentices through their journey, track progress, and provide feedback.',
      href: '/lms/dashboard',
      color: 'bg-indigo-100',
      iconColor: 'text-indigo-900',
      features: ['Apprentice oversight', 'Progress reviews', 'Feedback tools', 'Communication hub'],
    },
    {
      icon: Users,
      title: 'Staff',
      description: 'Internal staff tools for enrollment, support, and operations management.',
      href: '/lms/dashboard',
      color: 'bg-teal-100',
      iconColor: 'text-teal-900',
      features: ['Enrollment tools', 'Support queue', 'Operations dashboard', 'Reporting'],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Portals
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8">
              Access your personalized dashboard based on your role. Students, employers, instructors, and partners all have dedicated spaces.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/lms/dashboard">
                <Button size="lg" className="bg-brand-blue-600 hover:bg-blue-700 text-white">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
              </Link>
              <Link href="/apply">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Apply for Training
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* All Portals Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Access Your Portal</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Select your role to access the appropriate portal. Not sure which portal you need? Contact us for guidance.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.map((portal) => (
              <Link href={portal.href} key={portal.title}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-brand-blue-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 ${portal.color} rounded-lg flex items-center justify-center shrink-0`}>
                        <portal.icon className={`h-7 w-7 ${portal.iconColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{portal.title}</CardTitle>
                        <p className="text-slate-600 text-sm mt-1">{portal.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {portal.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 bg-brand-blue-500 rounded-full shrink-0"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center text-brand-blue-600 font-medium text-sm">
                      Access Portal <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How to Access */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">How to Access Your Portal</h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="w-8 h-8 bg-brand-blue-900 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Complete Your Application
                </h3>
                <p className="text-slate-600 ml-10">
                  Apply for a program or register as an employer/partner. Your account will be created during enrollment.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="w-8 h-8 bg-brand-blue-900 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Check Your Email
                </h3>
                <p className="text-slate-600 ml-10">
                  You'll receive a welcome email with login credentials and instructions for accessing your portal.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="w-8 h-8 bg-brand-blue-900 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Sign In to Your Portal
                </h3>
                <p className="text-slate-600 ml-10">
                  Use the same email and password to access all {PLATFORM_DEFAULTS.orgName} portals. Your role determines what you see.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="w-8 h-8 bg-brand-blue-900 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  Need Help?
                </h3>
                <p className="text-slate-600 ml-10">
                  Contact our support team at {PLATFORM_DEFAULTS.email} or call {PLATFORM_DEFAULTS.phone}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="py-8 bg-brand-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 text-center">
            <Shield className="h-8 w-8 text-brand-orange-500" />
            <div>
              <p className="font-bold">Secure Access</p>
              <p className="text-blue-200 text-sm">
                All portals use encrypted connections and secure authentication to protect your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Don't Have an Account?</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Apply for training to get access to the student portal, or register as an employer to access employer tools.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply">
              <Button size="lg">Apply for Training</Button>
            </Link>
            <Link href="/apply/employer">
              <Button size="lg" variant="outline">Register as Employer</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>{PLATFORM_DEFAULTS.orgName}</p>
          <p className="text-sm mt-2">{PLATFORM_DEFAULTS.address}</p>
          <p className="text-sm mt-1">{PLATFORM_DEFAULTS.phone} | {PLATFORM_DEFAULTS.email}</p>
        </div>
      </footer>
    </div>
  );
}
