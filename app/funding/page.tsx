import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  DollarSign, 
  FileText,
  Clock,
  ArrowRight,
  Building2,
  Users,
  Briefcase
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Funding & Financial Aid | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Learn about funding options for career training at ${PLATFORM_DEFAULTS.orgName}. WIOA, Workforce Ready Grant, Job Ready Indy, and more.`,
  alternates: {
    canonical: `${PLATFORM_DEFAULTS.siteUrl}/funding`,
  },
};

export default function FundingPage() {
  const fundingStreams = [
    {
      name: 'WIOA / WorkOne',
      icon: Building2,
      color: 'bg-blue-100',
      textColor: 'text-blue-900',
      description: 'Federal workforce funding through the Workforce Innovation and Opportunity Act.',
      eligibility: [
        'Adults meeting income guidelines',
        'Dislocated workers',
        'Youth with barriers to employment',
        'Veterans and spouses',
      ],
      programs: 'Most programs eligible',
      amount: 'Up to 100% tuition coverage',
    },
    {
      name: 'Workforce Ready Grant (WRG)',
      icon: Briefcase,
      color: 'bg-green-100',
      textColor: 'text-green-900',
      description: 'Indiana state funding for short-term, high-demand training programs.',
      eligibility: [
        'Indiana residents',
        '18 years or older',
        'High school diploma or GED',
        'Not enrolled in college',
      ],
      programs: 'Approved short-term programs',
      amount: 'Up to $5,250 per year',
    },
    {
      name: 'Job Ready Indy (JRI)',
      icon: Users,
      color: 'bg-purple-100',
      textColor: 'text-purple-900',
      description: 'Marion County workforce development funding for local residents.',
      eligibility: [
        'Marion County residents',
        'Meeting income guidelines',
        'Committed to career training',
        'Drug-free',
      ],
      programs: 'Select programs in healthcare and trades',
      amount: 'Varies by program',
    },
    {
      name: 'Justice-Involved (Reentry)',
      icon: CheckCircle,
      color: 'bg-orange-100',
      textColor: 'text-orange-900',
      description: 'Special funding for individuals returning to the community.',
      eligibility: [
        'Justice-involved individuals',
        'Recently released',
        'Committed to employment',
        'Meet program requirements',
      ],
      programs: 'Select programs',
      amount: 'Varies by funding source',
    },
  ];

  const selfPayOptions = [
    {
      title: 'Payment Plans',
      description: 'Spread tuition over multiple payments',
      icon: Clock,
    },
    {
      title: 'Scholarships',
      description: 'Need-based scholarships available',
      icon: CheckCircle,
    },
    {
      title: 'OJT & Wage Reimbursement',
      description: 'Some employers reimburse training costs',
      icon: Building2,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-white text-green-900 mb-4">Funding Available</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Funding & Financial Aid
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8">
              Many programs are <strong className="text-white">FREE or LOW-COST</strong> for eligible participants. 
              Don't let money stand between you and your career.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/apply">
                <Button size="lg" className="bg-brand-orange-500 hover:bg-orange-600 text-white">
                  Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#eligibility">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Check Your Eligibility
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Streams */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Funding Streams</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Explore the different funding options available to help pay for your training.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {fundingStreams.map((stream) => (
              <Card key={stream.name} className="overflow-hidden">
                <div className={`${stream.color} p-6`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 bg-white rounded-lg flex items-center justify-center`}>
                      <stream.icon className={`h-7 w-7 ${stream.textColor}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${stream.textColor}`}>{stream.name}</h3>
                      <p className={`${stream.textColor} opacity-80 text-sm`}>{stream.programs}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="text-slate-600 mb-4">{stream.description}</p>
                  <div className="mb-4">
                    <h4 className="font-bold text-sm text-slate-700 mb-2">Coverage:</h4>
                    <p className="text-green-700 font-medium">{stream.amount}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-700 mb-2">Eligibility:</h4>
                    <ul className="space-y-1">
                      {stream.eligibility.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Self-Pay Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Self-Pay Options</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Not eligible for government funding? We offer flexible payment options.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {selfPayOptions.map((option) => (
              <Card key={option.title} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <option.icon className="h-6 w-6 text-brand-blue-900" />
                  </div>
                  <h3 className="font-bold mb-2">{option.title}</h3>
                  <p className="text-slate-600 text-sm">{option.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility Checker */}
      <section id="eligibility" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Am I Eligible?</h2>
            <p className="text-center text-slate-600 mb-12">
              Most funding programs consider factors like income, employment status, and education level.
            </p>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Common Eligibility Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Income Guidelines</h4>
                        <p className="text-sm text-slate-600">Varies by program and family size</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Residency</h4>
                        <p className="text-sm text-slate-600">Most require Indiana residency</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Work Authorization</h4>
                        <p className="text-sm text-slate-600">Must be legally authorized to work</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Education Level</h4>
                        <p className="text-sm text-slate-600">HS diploma/GED often required</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Employment Status</h4>
                        <p className="text-sm text-slate-600">Unemployed or underemployed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-medium">Career Goals</h4>
                        <p className="text-sm text-slate-600">Committed to completing training</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">How to Get Started</h2>
            <p className="text-xl text-blue-200 mb-8">
              We'll help you navigate the funding process every step of the way.
            </p>

            <div className="space-y-4 text-left">
              <div className="bg-white/10 rounded-lg p-4 flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-orange-500 rounded-full flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-bold">Apply Online</h3>
                  <p className="text-blue-200 text-sm">Fill out our quick application form</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-orange-500 rounded-full flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold">Schedule a Consultation</h3>
                  <p className="text-blue-200 text-sm">We'll review your situation and suggest funding options</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-orange-500 rounded-full flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-bold">Gather Documents</h3>
                  <p className="text-blue-200 text-sm">We'll help you collect required paperwork</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 flex items-start gap-4">
                <div className="w-8 h-8 bg-brand-orange-500 rounded-full flex items-center justify-center shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-bold">Start Training</h3>
                  <p className="text-blue-200 text-sm">Once funding is approved, you're ready to begin!</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/apply">
                <Button size="lg" className="bg-brand-orange-500 hover:bg-orange-600 text-white">
                  Start Your Application <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How long does funding approval take?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Processing times vary by funding source. WIOA typically takes 2-4 weeks, while 
                  Workforce Ready Grant can be faster. We'll keep you updated throughout the process.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I get funding if I'm already employed?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Yes, some funding programs are available to employed individuals. Work with our 
                  team to find options that fit your situation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What if I don't qualify for funding?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  We offer payment plans and can discuss other options. Don't let cost prevent you 
                  from applying – we'll find a solution together.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I use multiple funding sources?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  In some cases, yes! We can help stack funding sources to maximize your coverage. 
                  Our advisors will work with you to explore all options.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-slate-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Have Questions About Funding?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Our team is here to help you navigate the funding process.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact">
              <Button size="lg">Contact Us</Button>
            </Link>
            <a href={`tel:${PLATFORM_DEFAULTS.phone}`}>
              <Button size="lg" variant="outline">Call {PLATFORM_DEFAULTS.phone}</Button>
            </a>
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
