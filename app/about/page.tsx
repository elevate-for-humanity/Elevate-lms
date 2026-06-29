import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Users, 
  Award, 
  Globe, 
  Heart, 
  TrendingUp,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: `About Us | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Learn about ${PLATFORM_DEFAULTS.orgName} - an AI-powered workforce operating system providing career training, apprenticeships, and verified credentials.`,
  alternates: {
    canonical: `${PLATFORM_DEFAULTS.siteUrl}/about`,
  },
};

export default function AboutPage() {
  const stats = [
    { label: 'Programs', value: '80+' },
    { label: 'Students Trained', value: '1,000+' },
    { label: 'Industry Certifications', value: '25+' },
    { label: 'Employer Partners', value: '50+' },
  ];

  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We exist to close workforce gaps and create pathways to economic mobility for all.',
    },
    {
      icon: Users,
      title: 'Student-First',
      description: 'Every decision we make starts with the question: "Does this help our students succeed?"',
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description: 'DOL-registered apprenticeships and ETPL-listed programs ensure industry recognition.',
    },
    {
      icon: Globe,
      title: 'Accessibility',
      description: 'WIOA funding, multiple locations, and flexible schedules remove barriers to entry.',
    },
  ];

  const team = [
    {
      name: 'Leadership Team',
      role: 'Strategic Direction',
      description: 'Experienced workforce development professionals with backgrounds in education, government, and industry.',
    },
    {
      name: 'Instructional Staff',
      role: 'Hands-On Training',
      description: 'Licensed practitioners and certified instructors with real-world industry experience.',
    },
    {
      name: 'Career Services',
      role: 'Job Placement',
      description: 'Dedicated team connecting graduates with employers and supporting career transitions.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-700 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              About {PLATFORM_DEFAULTS.orgName}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              An AI-Powered Workforce Operating System that connects training, funding, and employment into one seamless experience.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-slate-600 mb-6">
                {PLATFORM_DEFAULTS.orgName} exists to create pathways to meaningful employment for individuals 
                while providing employers with a reliable pipeline of skilled, certified workers.
              </p>
              <p className="text-lg text-slate-600 mb-6">
                We leverage AI technology to automate compliance tracking, credential verification, and 
                apprenticeship management — freeing up human advisors to focus on what matters: helping 
                people build careers.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/programs">
                  <Button>Explore Programs</Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline">Contact Us</Button>
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Heart className="h-6 w-6 text-brand-orange-500 mr-2" />
                Why We Exist
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-slate-600">
                    <strong>Skills gaps</strong> in healthcare, trades, and technology leave millions underemployed
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-slate-600">
                    <strong>Training costs</strong> prevent qualified candidates from pursuing certifications
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-slate-600">
                    <strong>Employers struggle</strong> to find workers with verified skills and credentials
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-slate-600">
                    <strong>We bridge</strong> these gaps with AI-powered matching and compliance automation
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-brand-blue-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="bg-white rounded-xl shadow-md p-6">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-brand-blue-900" />
                </div>
                <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                <p className="text-slate-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="w-24 h-24 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-12 w-12 text-brand-blue-900" />
                </div>
                <h3 className="text-lg font-bold">{member.name}</h3>
                <p className="text-brand-orange-500 font-medium mb-2">{member.role}</p>
                <p className="text-slate-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Our Credentials</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 rounded-lg p-6">
              <div className="text-2xl font-bold mb-2">DOL</div>
              <div className="text-blue-200">Registered Apprenticeship Sponsor</div>
              <div className="text-sm text-blue-300 mt-1">RAPIDS ID: 2025-IN-132301</div>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="text-2xl font-bold mb-2">ETPL</div>
              <div className="text-blue-200">Eligible Training Provider</div>
              <div className="text-sm text-blue-300 mt-1">Indiana State Listed</div>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="text-2xl font-bold mb-2">WIOA</div>
              <div className="text-blue-200">Title I Approved</div>
              <div className="text-sm text-blue-300 mt-1">Workforce Partner</div>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="text-2xl font-bold mb-2">Certiport</div>
              <div className="text-blue-200">Authorized Testing Center</div>
              <div className="text-sm text-blue-300 mt-1">MOS, IC3, etc.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have launched careers through our programs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/programs">
              <Button size="lg">Browse Programs</Button>
            </Link>
            <Link href="/apply">
              <Button size="lg" variant="outline">Apply Now</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>{PLATFORM_DEFAULTS.orgName}</p>
          <p className="text-sm mt-2">{PLATFORM_DEFAULTS.address}</p>
          <p className="text-sm">{PLATFORM_DEFAULTS.phone} | {PLATFORM_DEFAULTS.email}</p>
        </div>
      </footer>
    </div>
  );
}
