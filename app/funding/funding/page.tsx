'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
  DollarSign,
  Users,
  FileText,
  Building2,
  Handshake,
  TrendingUp,
  Shield,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Clock,
} from 'lucide-react';



export default function FundingPage() {
  const fundingResources = [
    {
      title: 'WIOA Eligibility',
      description:
        'Check if you qualify for Workforce Innovation and Opportunity Act funding. Most adults qualify for free training.',
      fullDescription: 'The Workforce Innovation and Opportunity Act (WIOA) is the primary federal workforce development program. WIOA provides funding for job training, education, and employment services to help individuals gain skills and find good jobs. Most adults qualify based on income, public assistance receipt, veteran status, or displacement from previous employment.',
      href: '/wioa-eligibility',
      icon: CheckCircle,
      color: 'green',
      category: 'Eligibility',
      image: '/images/heroes/hero-state-funding.jpg',
    },

    {
      title: 'Grants',
      description:
        'Federal and state grant programs that cover 100% of training costs with no repayment required.',
      fullDescription: 'Federal and state workforce grants provide 100% funding for career training programs. Unlike loans, grants never need to be repaid. These include WIOA, Workforce Ready Grant (WRG), and other state-administered programs that cover tuition, books, supplies, and support services.',
      href: '/grants',
      icon: DollarSign,
      color: 'emerald',
      category: 'Funding',
      image: '/images/funding/funding-dol-program-v2.jpg',
    },
    {
      title: 'JRI Funding',
      description:
        'Justice Reinvestment Initiative funding for individuals with criminal justice involvement.',
      fullDescription: 'The Justice Reinvestment Initiative (JRI) provides funding for workforce training and support services for individuals with criminal justice involvement. JRI helps justice-impacted individuals gain skills, find employment, and successfully reintegrate into their communities.',
      href: '/jri',
      icon: Shield,
      color: 'purple',
      category: 'Funding',
      image: '/images/apprenticeships-card.jpg',
    },
    {
      title: 'SNAP E&T',
      description:
        'Supplemental Nutrition Assistance Program Employment & Training funding for SNAP recipients.',
      fullDescription: 'SNAP Employment & Training (SNAP E&T) provides job training and support services for individuals receiving SNAP benefits (food stamps). The program helps SNAP recipients gain skills and find employment to achieve self-sufficiency.',
      href: '/snap-et-partner',
      icon: Users,
      color: 'orange',
      category: 'Funding',
      image: '/images/heroes/hero-state-funding.jpg',
    },
    {
      title: 'FSSA Partnership',
      description:
        'Family and Social Services Administration partnership programs and funding opportunities.',
      fullDescription: 'The Indiana Family and Social Services Administration (FSSA) partners with workforce providers to deliver training and support services to vulnerable populations. FSSA programs help individuals receiving public assistance gain skills and achieve self-sufficiency.',
      href: '/fssa-partnership-request',
      icon: Handshake,
      color: 'pink',
      category: 'Partnerships',
      image: '/images/apprenticeships-card.jpg',
    },
    {
      title: 'OJT & Funding',
      description:
        'On-the-Job Training programs with employer wage reimbursement and participant support.',
      fullDescription: 'On-the-Job Training (OJT) programs provide wage reimbursement to employers who hire and train new workers. Participants earn a paycheck while learning job skills, and employers receive funding to offset training costs. OJT programs are available through WIOA and other workforce initiatives.',
      href: '/ojt-and-funding',
      icon: Briefcase,
      color: 'indigo',
      category: 'Programs',
      image: '/images/apprenticeships-card.jpg',
    },
    {
      title: 'Funding Impact',
      description:
        'See how federal funding transforms lives and communities through workforce development.',
      fullDescription: 'Federal workforce funding has helped thousands of Hoosiers gain skills, find good jobs, and achieve economic stability. See real stories of how WIOA, JRI, and other programs have transformed lives and strengthened communities across Indiana.',
      href: '/fundingimpact',
      icon: TrendingUp,
      color: 'cyan',
      category: 'Impact',
      image: '/images/funding/funding-dol-program-v2.jpg',
    },
    {
      title: 'Workforce Partners',
      description:
        'Our network of workforce development boards, agencies, and community partners.',
      fullDescription: 'We partner with WorkOne centers, workforce development boards, community organizations, and government agencies across Indiana to connect students with funding and support services. Our collaborative approach ensures students receive comprehensive assistance.',
      href: '/workforce-partners',
      icon: Users,
      color: 'violet',
      category: 'Partnerships',
      image: '/images/apprenticeships-card.jpg',
    },
    {
      title: 'WorkOne Partner Packet',
      description:
        'Information for WorkOne centers and workforce board partners.',
      fullDescription: 'Resources and information for WorkOne career advisors and workforce board staff. Learn about our programs, enrollment process, and how to refer clients for training services.',
      href: '/workone-partner-packet',
      icon: FileText,
      color: 'rose',
      category: 'Resources',
      image: '/images/heroes/hero-state-funding.jpg',
    },
    {
      title: 'Partner Agencies',
      description:
        'Government agencies and community organizations we work with to serve students.',
      fullDescription: 'We collaborate with federal, state, and local agencies including DWD, FSSA, DOC, and community-based organizations to provide training and support services to diverse populations across Indiana.',
      href: '/agencies',
      icon: Building2,
      color: 'amber',
      category: 'Partnerships',
      image: '/images/apprenticeships-card.jpg',
    },
    {
      title: 'Government Programs',
      description:
        'Federal and state workforce programs that fund training at no cost to students.',
      fullDescription: 'Learn about federal programs like WIOA, SNAP E&T, and state initiatives like Workforce Ready Grant that provide 100% funding for career training. These programs are administered through WorkOne centers and local workforce boards.',
      href: '/government',
      icon: Shield,
      color: 'lime',
      category: 'Programs',
      image: '/images/funding/funding-dol-program-v2.jpg',
    },
    {
      title: 'Federal Compliance',
      description:
        'Our compliance with federal workforce development regulations and reporting requirements.',
      fullDescription: 'We maintain full compliance with federal workforce development regulations including WIOA, Equal Opportunity, and data privacy requirements. Our programs meet all federal standards for quality, accountability, and student outcomes.',
      href: '/federal-compliance',
      icon: CheckCircle,
      color: 'teal',
      category: 'Compliance',
      image: '/images/heroes/hero-state-funding.jpg',
    },
    {
      title: 'Equal Opportunity',
      description:
        'Our commitment to equal opportunity and non-discrimination in all programs and services.',
      fullDescription: '{PLATFORM_DEFAULTS.orgName} is an equal opportunity provider. We do not discriminate based on race, color, religion, sex, national origin, age, disability, or political affiliation. All programs and services are available to all eligible individuals.',
      href: '/equal-opportunity',
      icon: Users,
      color: 'sky',
      category: 'Compliance',
      image: '/images/apprenticeships-card.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero with Image */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        <Image
          src="/images/heroes/hero-state-funding.jpg"
          alt="Free career training funding"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
              100% Free Training
            </h1>

            {/* Subheadline */}
            <p className="text-2xl md:text-3xl font-bold mb-6 text-green-600">
              No Tuition. No Student Debt. Ever.
            </p>

            {/* Description */}
            <p className="text-xl text-gray-700 mb-6 max-w-2xl mx-auto leading-relaxed">
              All training is funded through federal workforce programs like WIOA,
              SNAP E&T, and JRI. You pay nothing. We handle all the paperwork.
            </p>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <Link href="/wioa-eligibility" className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition-colors">
                WIOA Eligibility
              </Link>
              <Link href="/financial-aid" className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
                Financial Aid
              </Link>
              <Link href="/jri" className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors">
                JRI Programs
              </Link>
              <Link href="/how-it-works" className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors">
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Indiana Career Connect Instructions */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              How to Get Free Training Through Indiana Career Connect
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Follow these steps to apply for WIOA funding and get your training paid for
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mb-10">
            <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">
              Step-by-Step Instructions
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Create Your Indiana Career Connect Account</h4>
                  <p className="text-gray-600 mb-3">
                    Go to <strong>indianacareerconnect.com</strong> and click &quot;Create Account.&quot; 
                    You&apos;ll need your email address, Social Security number, and basic contact information.
                    This is the state&apos;s official workforce system - it&apos;s free and secure.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Have your ID and Social Security card ready</li>
                    <li>• Use an email you check regularly</li>
                    <li>• Complete your full profile including work history</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Schedule an Appointment with WorkOne</h4>
                  <p className="text-gray-600 mb-3">
                    After creating your account, schedule an appointment with a WorkOne career advisor.
                    You can do this online through Indiana Career Connect or by calling your local WorkOne office.
                    The advisor will review your eligibility for WIOA funding.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Appointments are free and typically 30-60 minutes</li>
                    <li>• Bring your ID, Social Security card, and proof of income</li>
                    <li>• Tell them you want to enroll in training at {PLATFORM_DEFAULTS.orgName}</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Get Your Eligibility Verified</h4>
                  <p className="text-gray-600 mb-3">
                    Your WorkOne advisor will verify your eligibility for WIOA funding based on your 
                    income, employment status, and other factors. Most people who are unemployed, 
                    underemployed, or low-income qualify.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Eligibility is based on household income and size</li>
                    <li>• Veterans and their spouses get priority</li>
                    <li>• Public assistance recipients often qualify automatically</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Receive Your Training Voucher (ITA)</h4>
                  <p className="text-gray-600 mb-3">
                    Once approved, you&apos;ll receive an Individual Training Account (ITA) voucher.
                    This voucher covers 100% of your tuition at {PLATFORM_DEFAULTS.orgName}.
                    Bring this voucher to us to complete your enrollment.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• The ITA covers tuition, books, and certification fees</li>
                    <li>• You may also qualify for support services (transportation, childcare)</li>
                    <li>• Processing typically takes 1-2 weeks</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">5</div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Start Your Training!</h4>
                  <p className="text-gray-600 mb-3">
                    Bring your ITA voucher to {PLATFORM_DEFAULTS.orgName} and we&apos;ll complete your enrollment.
                    You&apos;ll start your training program with $0 out of pocket.
                    We&apos;ll also help you track your progress and prepare for employment.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• We handle all paperwork with WorkOne</li>
                    <li>• Career coaching and job placement included</li>
                    <li>• Support services available throughout your training</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              Make Your Appointment on Indiana Career Connect
              <ArrowRight className="w-6 h-6" />
            </a>
            <p className="text-gray-500 mt-4 text-sm">
              Opens indianacareerconnect.com in a new tab
            </p>
          </div>
        </div>
      </section>

      {/* What Happens After */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">
            What Happens After You Make Your Appointment?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">We Track Your Progress</h3>
              <p className="text-gray-600">
                Once you start the process, we monitor your application status and help 
                resolve any issues. You&apos;ll receive updates at each milestone.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Dedicated Support</h3>
              <p className="text-gray-600">
                Our enrollment team is available to answer questions and guide you 
                through the process. Call us at {PLATFORM_DEFAULTS.supportPhone} anytime.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Paperwork Assistance</h3>
              <p className="text-gray-600">
                Need help with forms or documentation? We can help you gather 
                the required documents and complete applications correctly.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Fast Processing</h3>
              <p className="text-gray-600">
                Most applications are processed within 1-2 weeks. We work with 
                WorkOne to expedite your approval so you can start training quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-4xl font-black mb-2">$0</div>
              <div className="text-sm text-green-100">Tuition Cost</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-4xl font-black mb-2">100%</div>
              <div className="text-sm text-green-100">Funded</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-4xl font-black mb-2">5,000+</div>
              <div className="text-sm text-green-100">Students Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Qualifies Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-black mb-8 text-center">
            Who Qualifies for Free Training?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-black mb-4">WIOA Eligibility</h3>
              <p className="text-black mb-4">Most adults qualify if you meet ONE of these:</p>
              <ul className="space-y-2 text-black">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Low income (based on family size)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Receiving public assistance (SNAP, TANF, SSI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Veteran or military spouse</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Displaced worker or laid off</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Individual with a disability</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-black mb-4">Other Funding Options</h3>
              <div className="space-y-4 text-black">
                <div>
                  <strong className="text-blue-900">JRI Funding:</strong> For individuals with criminal justice involvement
                </div>
                <div>
                  <strong className="text-blue-900">SNAP E&T:</strong> For SNAP (food stamps) recipients
                </div>
                <div>
                  <strong className="text-blue-900">Workforce Ready Grant:</strong> For high-demand programs like HVAC
                </div>
                <div>
                  <strong className="text-blue-900">Employer Sponsorship:</strong> Some employers pay for employee training
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-8 text-center">
            <p className="text-xl text-black mb-4">
              <strong>Not sure if you qualify?</strong> Most people do! The WorkOne advisor will help you determine eligibility during your appointment.
            </p>
            <Link
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-orange-700 transition-all"
            >
              <span>Check Eligibility on Indiana Career Connect</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended Resources Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-black mb-4">
              Explore Funding Resources
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              Learn about federal funding programs, eligibility requirements,
              and partnership opportunities
            </p>
          </div>

          {/* Resource Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {fundingResources.map((resource) => {
              const Icon = resource.icon;
              return (
                <div
                  key={resource.href}
                  className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-green-500"
                >
                  {/* Image */}
                  {resource.image && (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={resource.image}
                        alt={resource.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Category Badge Overlay */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-xs font-bold text-black uppercase tracking-wider">
                          {resource.category}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 bg-${resource.color}-100 rounded-xl flex items-center justify-center mb-4`}
                    >
                      <Icon className={`w-7 h-7 text-${resource.color}-600`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-black mb-3">
                      {resource.title}
                    </h3>

                    {/* Description */}
                    <p className="text-black mb-4 leading-relaxed">
                      {resource.description}
                    </p>
                    
                    {/* Full Description (if available) */}
                    {resource.fullDescription && (
                      <p className="text-sm text-black mb-6 leading-relaxed border-t border-gray-200 pt-4">
                        {resource.fullDescription}
                      </p>
                    )}

                    {/* Learn More Button */}
                    <Link
                      href={resource.href}
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-all w-full justify-center"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Apply CTA */}
          <div className="mt-16 text-center">
            <Link
              href="/apply"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-5 rounded-xl text-lg font-black shadow-xl hover:shadow-2xl hover:scale-105 transition-all uppercase"
            >
              <span>Apply for Free Training</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
            <p className="text-black mt-4">
              Takes 5 minutes • No commitment required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-12 px-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-black mb-2">
            Questions about funding eligibility?
          </p>
          <p className="text-sm text-black">
            Contact us at{' '}
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="text-green-600 hover:underline font-semibold"
            >
              elevate4humanityedu@gmail.com
            </a>{' '}
            or call{' '}
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="text-green-600 hover:underline font-semibold"
            >
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
