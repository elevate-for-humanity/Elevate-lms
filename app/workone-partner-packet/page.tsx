import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Award, 
  
  Users, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Phone, 
  Mail, 
  Building2,
  GraduationCap,
  Shield,
  Clock,
  DollarSign,
  Target
} from 'lucide-react';
import { PrintButton } from './PrintButton';

export const metadata: Metadata = {
  title: 'WorkOne Partner Packet | Elevate for Humanity',
  description:
    'Registered Apprenticeship Sponsor | ETPL Approved | WIOA & WRG Eligible. Complete partner information for WorkOne regions and workforce development boards.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/workone-partner-packet',
  },
};

export default function WorkOnePartnerPacketPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'WorkOne Partner Packet' }]} />
        </div>
      </div>

      {/* Hero Section with Video */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          >
            <source src="https://cms-artifacts.artlist.io/content/generated-video-v1/video__2/generated-video-acfed647-8bb1-44ed-8505-876b1d573896.mp4?Expires=2083808563&Key-Pair-Id=K2ZDLYDZI2R1DF&Signature=BO~IkvikD0UAyMYmWQoBNskXM7I8fMAXUJW3T-zgJh1jg78q3LhNDpFOLhVcCpTBW1Rscp0c0YXEi-CQ29NDjSUKoclWTKq4q-bPLNxXgOpKLYxr5B5X3LzzDQQYnq5ilkgAvEZ~VzT3P8HEixv9WPRLFnAd5V3f~829SadfMPddUPxQZDZc29hrBn-Kxv-EKfugudcZ3depV1X-T1F5UxzvRMqFCXxjfT658RlSt0IupI0LxtywFYkChqJQmH6A~2JBncMUPerBqqt0Gdyp4ettIltCFvBX70ai6784jneJJrWcBJ0l7GyJPx1WBPAqjAdnCeJwyPC2Spp3~u93pQ__" type="video/mp4" />
          </video>
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <span className="px-4 py-2 bg-brand-green-500/20 border border-brand-green-400/30 rounded-full text-sm font-bold text-brand-green-300">Registered Apprenticeship Sponsor</span>
              <span className="px-4 py-2 bg-brand-blue-500/20 border border-brand-blue-400/30 rounded-full text-sm font-bold text-brand-blue-300">ETPL Approved</span>
              <span className="px-4 py-2 bg-brand-blue-500/20 border border-brand-blue-400/30 rounded-full text-sm font-bold text-brand-blue-300">WIOA | WRG Eligible</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">WorkOne Partner Packet</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-6">
              Everything WorkOne regions need to refer participants to our ETPL-approved training programs and registered apprenticeships. We handle enrollment, training delivery, and outcome reporting with full transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-700 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                <Phone className="w-5 h-5 mr-2" />
                Contact Us
              </Link>
              <PrintButton />
            </div>
          </div>
        </div>
      </section>

      {/* Organization Overview */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Organization Overview</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-slate-900">Organization Type</div>
                  <div className="text-slate-600 text-sm">Registered Apprenticeship Sponsor & Workforce Intermediary</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-slate-900">Federal Oversight</div>
                  <div className="text-slate-600 text-sm">U.S. Department of Labor</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-slate-900">State Alignment</div>
                  <div className="text-slate-600 text-sm">Indiana Department of Workforce Development</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold text-slate-900">ETPL Status</div>
                  <div className="text-slate-600 text-sm">Approved Training Provider - All Indiana Regions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are with Image */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-teal-600 font-semibold">Section 1</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Who We Are
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="mb-4">
                  Elevate for Humanity is a <strong>workforce training institute</strong> and registered apprenticeship sponsor and 
                  <strong> ETPL-approved workforce intermediary</strong> that helps Indiana employers 
                  implement earn-and-learn apprenticeship programs aligned with WIOA and WRG funding.
                </p>
                <p className="mb-4">
                  We are <strong>not a staffing agency</strong> and <strong>not a traditional school</strong>. 
                  We provide infrastructure, compliance, and training coordination so employers can hire, 
                  train, and retain talent with reduced cost and risk.
                </p>
                <p>
                  Our model connects workforce boards, employers, and job seekers in a structured 
                  pathway that produces measurable outcomes and meets all federal reporting requirements.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="relative h-64 rounded-2xl overflow-hidden">
                <Image
                  src="/images/pages/workone-partner-packet-page-1.jpg"
                  alt="Workforce partnership"
                  fill
                  quality={85} className="object-cover"
                />
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">What Makes Us Different</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <div className="font-semibold text-gray-900">Employer-Driven Model</div>
                      <div className="text-gray-600 text-sm">Training aligned with actual job requirements</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <div className="font-semibold text-gray-900">Compliance Built-In</div>
                      <div className="text-gray-600 text-sm">WIOA, FERPA, ADA, EEO compliant from day one</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <div className="font-semibold text-gray-900">Outcome-Focused</div>
                      <div className="text-gray-600 text-sm">Employment and wage gains, not just completions</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <div className="font-semibold text-gray-900">Automated Reporting</div>
                      <div className="text-gray-600 text-sm">Real-time data for case managers and funders</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works with Images */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-brand-blue-600 font-semibold">Section 2</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works for WorkOne
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A streamlined process for referring WIOA and WRG participants to our programs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-32 overflow-hidden">
                <Image src="/images/pages/workone-partner-packet-page-1.jpg" alt="Referral" fill sizes="100vw" quality={85} className="object-cover" />
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 -mt-10 relative z-10 border-4 border-white">1</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Referral</h3>
                <p className="text-gray-600 text-sm">
                  WorkOne case manager identifies eligible participant and submits referral through our online portal or via email.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-32 overflow-hidden">
                <Image src="/images/pages/workone-partner-packet-page-1.jpg" alt="Enrollment" fill sizes="100vw" quality={85} className="object-cover" />
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 -mt-10 relative z-10 border-4 border-white">2</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Enrollment</h3>
                <p className="text-gray-600 text-sm">
                  We complete intake, verify eligibility, and enroll participant in appropriate training program within 48 hours.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-32 overflow-hidden">
                <Image src="/images/pages/workone-packet-1.jpg" alt="Training" fill sizes="100vw" quality={85} className="object-cover" />
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 -mt-10 relative z-10 border-4 border-white">3</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Training</h3>
                <p className="text-gray-600 text-sm">
                  Participant completes training with progress updates sent to case manager weekly. Support services available.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="relative h-32 overflow-hidden">
                <Image src="/images/pages/workone-packet-2.jpg" alt="Placement" fill sizes="100vw" quality={85} className="object-cover" />
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 -mt-10 relative z-10 border-4 border-white">4</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Placement</h3>
                <p className="text-gray-600 text-sm">
                  Upon completion, we provide job placement assistance and report employment outcomes for WIOA performance measures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Available with Images */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-brand-blue-600 font-semibold">Section 3</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ETPL-Approved Programs
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              All programs are approved on Indiana&apos;s Eligible Training Provider List and lead to industry-recognized credentials.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Barber Apprenticeship', duration: '18 months', credential: 'Indiana Barber License', funding: 'WIOA, WRG, Apprenticeship', image: '/images/pages/barber-gallery-1.jpg' },
              { title: 'Healthcare Certifications', duration: '4-12 weeks', credential: 'CNA, Medical Assistant, Home Health Aide', funding: 'WIOA, WRG', image: '/images/pages/comp-pathway-healthcare.jpg' },
              { title: 'IT & Cybersecurity', duration: '8-12 weeks', credential: 'Certiport IT Specialist, Cisco CCST', funding: 'WIOA, WRG', image: '/images/pages/comp-cta-training.jpg' },
              { title: 'CDL Training', duration: '4-6 weeks', credential: 'Class A CDL', funding: 'WIOA, WRG', image: '/images/pages/comp-cta-training.jpg' },
              { title: 'Skilled Trades', duration: '8-24 weeks', credential: 'OSHA, NCCER, Industry Certs', funding: 'WIOA, WRG, Apprenticeship', image: '/images/pages/comp-pathway-trades.jpg' },
              { title: 'Business & Office', duration: '4-8 weeks', credential: 'Microsoft Office, QuickBooks', funding: 'WIOA, WRG', image: '/images/pages/comp-cta-training.jpg' },
            ].map((program, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                <div className="relative h-40 overflow-hidden">
                  <Image src={program.image} alt={program.title} fill sizes="100vw" quality={85} className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{program.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>{program.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-4 h-4 text-teal-600" />
                      <span>{program.credential}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4 text-teal-600" />
                      <span>{program.funding}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/programs" className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors">
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Funding & Billing */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-brand-green-600" />
                </div>
                <span className="text-brand-green-600 font-semibold">Section 4</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Funding & Billing</h2>
              <p className="text-lg text-gray-600 mb-4">
                We accept all major workforce funding streams and provide transparent billing with no hidden fees.
              </p>
              <p className="text-gray-600 mb-8">
                ITA vouchers, direct contracts, and employer-sponsored arrangements are all supported. Our team handles all enrollment paperwork, progress reporting, and outcome documentation required for WIOA performance measures.
              </p>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">Accepted Funding Sources</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['WIOA Title I (Adult)', 'WIOA Title I (DW)', 'WIOA Title I (Youth)', 'WRG (Workforce Ready Grant)', 'SNAP E&T', 'TANF', 'TAA', 'Veterans Benefits'].map((source, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-gray-700 text-sm">{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-teal-50 rounded-2xl p-8 border border-teal-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Billing Process</h3>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'ITA/Voucher Submission', desc: 'Case manager submits ITA or funding authorization' },
                  { step: '2', title: 'Enrollment Confirmation', desc: 'We confirm enrollment and send start date' },
                  { step: '3', title: 'Progress Updates', desc: 'Weekly progress reports sent to case manager' },
                  { step: '4', title: 'Completion & Invoice', desc: 'Invoice submitted upon successful completion with credential documentation' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{item.step}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{item.title}</div>
                      <div className="text-gray-600 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Refer Participants?</h2>
          <p className="text-xl text-white/90 mb-8">
            Contact our WorkOne liaison to set up your referral process or request additional information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/support" className="inline-flex items-center justify-center px-8 py-4 bg-white text-teal-600 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              <Phone className="w-5 h-5 mr-2" />
              Get Help Online
            </a>
            <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-800 transition-colors border-2 border-white/30">
              <Mail className="w-5 h-5 mr-2" />
              our contact form
            </a>
          </div>
          <p className="text-white/70 text-sm mt-8">
            Elevate for Humanity | 501(c)(3) Nonprofit | EIN: 93-3915599
          </p>
        </div>
      </section>
    </div>
  );
}
