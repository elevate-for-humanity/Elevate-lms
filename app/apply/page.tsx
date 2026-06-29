import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  Users, 
  Briefcase,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Apply for Training | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Apply for career training at ${PLATFORM_DEFAULTS.orgName}. WIOA funding available for eligible participants. Healthcare, trades, technology programs.`,
  alternates: {
    canonical: `${PLATFORM_DEFAULTS.siteUrl}/apply`,
  },
};

export default function ApplyPage() {
  const applicantTypes = [
    {
      icon: User,
      title: 'Students & Learners',
      description: 'Looking to start a new career or get certified in your field.',
      href: '/apply/student',
      features: ['Browse programs', 'Check funding eligibility', 'Track application status'],
    },
    {
      icon: Building2,
      title: 'Employers',
      description: 'Want to hire trained talent or sponsor apprenticeship programs.',
      href: '/apply/employer',
      features: ['Post jobs', 'Sponsor apprenticeships', 'Hire certified graduates'],
    },
    {
      icon: Users,
      title: 'Training Providers',
      description: 'Want to partner or become an approved training provider.',
      href: '/apply/provider',
      features: ['Partner with us', 'Host shops & salons', 'Program holder portal'],
    },
    {
      icon: Briefcase,
      title: 'Staff & Instructors',
      description: 'Interested in teaching or joining our team.',
      href: '/apply/staff',
      features: ['Instructor onboarding', 'Career opportunities', 'Professional development'],
    },
  ];

  const fundingOptions = [
    {
      name: 'WIOA / WorkOne',
      description: 'Federal workforce funding for eligible individuals',
      eligibility: 'Income-based, dislocated workers, etc.',
    },
    {
      name: 'Workforce Ready Grant',
      description: 'Indiana state funding for short-term training',
      eligibility: 'Indiana residents meeting criteria',
    },
    {
      name: 'Job Ready Indy',
      description: 'Local workforce development funding',
      eligibility: 'Marion County residents',
    },
    {
      name: 'Self-Pay',
      description: 'Payment plans and flexible financing',
      eligibility: 'Everyone welcome',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-700 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-brand-orange-500 text-white mb-4">Applications Open</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Apply for Training
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Start your journey to a new career. Many programs are fully funded for eligible participants.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/apply/student">
                <Button size="lg" className="bg-brand-orange-500 hover:bg-orange-600 text-white">
                  Start Your Application <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/funding">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Check Funding Eligibility
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Apply */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Who Should Apply?</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            We serve multiple audiences. Select the category that best describes you.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {applicantTypes.map((type) => (
              <Link href={type.href} key={type.title}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-200 hover:border-brand-blue-300">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <type.icon className="h-6 w-6 text-brand-blue-900" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{type.title}</CardTitle>
                        <p className="text-slate-600 text-sm mt-1">{type.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {type.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center text-brand-blue-600 font-medium">
                      Apply as {type.title.split(' ')[0]} <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Funding Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Funding & Financial Aid</h2>
              <p className="text-lg text-slate-600 mb-6">
                Many of our programs are <strong>fully funded</strong> for eligible participants through 
                workforce development programs. Don't let cost stop you from pursuing your career goals.
              </p>
              <div className="space-y-4">
                {fundingOptions.map((option) => (
                  <div key={option.name} className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-bold text-brand-blue-900">{option.name}</h3>
                    <p className="text-slate-600 text-sm">{option.description}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      <strong>Eligibility:</strong> {option.eligibility}
                    </p>
                  </div>
                ))}
              </div>
              <Link href="/funding" className="inline-block mt-6">
                <Button variant="outline">
                  Learn More About Funding <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="bg-brand-blue-900 text-white rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Not Sure About Funding?</h3>
              <p className="text-blue-200 mb-6">
                Take our 2-minute eligibility survey to see which funding programs you might qualify for.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  No commitment required
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Takes less than 5 minutes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  100% confidential
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Instant results
                </li>
              </ul>
              <Link href="/funding">
                <Button className="w-full bg-brand-orange-500 hover:bg-orange-600 text-white">
                  Check Eligibility Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Application Process</h2>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-brand-blue-900" />
              </div>
              <div className="text-2xl font-bold text-brand-blue-900 mb-2">1</div>
              <h3 className="font-bold mb-2">Submit Application</h3>
              <p className="text-slate-600 text-sm">
                Complete the online application form. Takes about 10 minutes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-brand-blue-900" />
              </div>
              <div className="text-2xl font-bold text-brand-blue-900 mb-2">2</div>
              <h3 className="font-bold mb-2">Verify Funding</h3>
              <p className="text-slate-600 text-sm">
                We'll help you check funding eligibility and gather required documents.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-brand-blue-900" />
              </div>
              <div className="text-2xl font-bold text-brand-blue-900 mb-2">3</div>
              <h3 className="font-bold mb-2">Program Orientation</h3>
              <p className="text-slate-600 text-sm">
                Attend orientation and meet your instructors and cohort.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-brand-blue-900 mb-2">4</div>
              <h3 className="font-bold mb-2">Start Training</h3>
              <p className="text-slate-600 text-sm">
                Begin your program and work toward your certification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Required Documents */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">What You'll Need</h2>
            <p className="text-center text-slate-600 mb-8">
              Gather these documents before starting your application to speed up the process.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold">Government-Issued ID</h3>
                  <p className="text-slate-600 text-sm">Driver's license, state ID, or passport</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold">Social Security Card</h3>
                  <p className="text-slate-600 text-sm">For employment verification and funding</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold">WorkOne Referral (if applicable)</h3>
                  <p className="text-slate-600 text-sm">If referred by a workforce agency</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold">High School Diploma/GED</h3>
                  <p className="text-slate-600 text-sm">Some programs may require verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Application?</h2>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Takes about 10 minutes. We'll help you every step of the way.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply/student">
              <Button size="lg" className="bg-brand-orange-500 hover:bg-orange-600 text-white">
                Start Application <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/programs">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Browse Programs First
              </Button>
            </Link>
          </div>
          <p className="text-blue-300 mt-6 text-sm">
            Questions? Call us at {PLATFORM_DEFAULTS.phone} or email {PLATFORM_DEFAULTS.email}
          </p>
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
