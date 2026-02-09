import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  GraduationCap,
  Briefcase,
  Monitor,
  Users,
  Award,
  Building2,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | Free Funded Program | Elevate for Humanity',
  description: 'Free HVAC technician training through Indiana Career Connect. Earn while you learn with OJT and internships. Online coursework plus hands-on training. WRG funded program.',
  openGraph: {
    title: 'HVAC Technician Training | Free Funded Program',
    description: 'Free HVAC technician training through Indiana Career Connect. Earn while you learn with OJT and internships.',
    images: ['/images/hvac/hvac-hero.jpg'],
  },
};

export default function HVACProgramPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* VIDEO HERO - Clean, no text overlay */}
      <section className="relative h-[50vh] min-h-[350px] max-h-[450px]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/hvac/hvac-hero.jpg"
        >
          <source src="/videos/hvac-training.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </section>

      {/* Avatar Section */}
      <PageAvatar 
        videoSrc="/videos/avatars/hvac-guide.mp4" 
        title="Learn About HVAC Training"
      />

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'HVAC Technician' },
          ]}
        />
      </div>

      {/* Program Title & Quick Info */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
            FREE FUNDED PROGRAM
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            HVAC Technician Training
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Launch your career in heating, ventilation, and air conditioning through Indiana Career Connect. 
            100% funded for those who qualify.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">$0</div>
            <div className="text-sm text-slate-600">Tuition Cost*</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">12-16</div>
            <div className="text-sm text-slate-600">Weeks Training</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Briefcase className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">Paid</div>
            <div className="text-sm text-slate-600">OJT & Internships</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-6 text-center">
            <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">EPA 608</div>
            <div className="text-sm text-slate-600">Certification</div>
          </div>
        </div>
        <p className="text-center text-sm text-slate-500 mt-4">
          *For eligible participants through Indiana Career Connect / WRG funding
        </p>
      </section>

      {/* Indiana Career Connect Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/images/indiana-career-connect-logo.png"
                alt="Indiana Career Connect"
                width={200}
                height={60}
                className="mb-6 bg-white p-2 rounded"
              />
              <h2 className="text-3xl font-bold mb-4">
                Funded Through Indiana Career Connect
              </h2>
              <p className="text-blue-100 text-lg mb-6">
                This program is part of the Workforce Ready Grant (WRG) initiative, providing 
                free training for in-demand careers. Indiana Career Connect helps Hoosiers 
                access education and training at no cost.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>100% tuition covered for eligible participants</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Books, materials, and certification fees included</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Supportive services available (transportation, childcare assistance)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Career coaching and job placement support</span>
                </li>
              </ul>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <Image
                src="/images/hvac/hvac-classroom.jpg"
                alt="HVAC Training Classroom"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How Training Works */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            How the Training Works
          </h2>
          <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">
            Our hybrid training model combines online learning with hands-on experience
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Phase 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-sm font-semibold text-blue-600 mb-2">PHASE 1</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Online Coursework</h3>
              <p className="text-slate-600 mb-4">
                Start with foundational HVAC theory, safety protocols, and technical knowledge 
                through our online learning platform. Study at your own pace from home.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  HVAC fundamentals & theory
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Safety & EPA regulations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Electrical basics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Refrigeration principles
                </li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-sm font-semibold text-orange-600 mb-2">PHASE 2</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Hands-On Labs</h3>
              <p className="text-slate-600 mb-4">
                Apply your knowledge in supervised lab environments with real HVAC equipment. 
                Practice installations, repairs, and diagnostics.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Equipment installation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  System diagnostics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Repair techniques
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  EPA 608 certification prep
                </li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-sm font-semibold text-green-600 mb-2">PHASE 3</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">OJT & Internship</h3>
              <p className="text-slate-600 mb-4">
                Earn while you learn through paid on-the-job training with local HVAC employers. 
                Get real-world experience and build industry connections.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Paid work experience
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Employer mentorship
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Job placement support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Career advancement path
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Earn While You Learn */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <Image
                src="/images/hvac/hvac-technician-work.jpg"
                alt="HVAC Technician at Work"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Earn While You Learn
              </h2>
              <p className="text-slate-600 text-lg mb-6">
                Through our On-the-Job Training (OJT) and internship partnerships, you can 
                earn money while gaining real-world experience. Our employer partners are 
                actively hiring and ready to train.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-green-800 mb-2">OJT Benefits</h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Paid training hours with employer partners
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Wages subsidized through WRG funding
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Direct path to full-time employment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Build your professional network
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-4 text-slate-600">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="font-semibold text-slate-900">15+ Employer Partners</div>
                  <div className="text-sm">Ready to hire program graduates</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HRI Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                High Road Initiative (HRI)
              </h2>
              <p className="text-slate-300 text-lg mb-6">
                This program is part of Indiana's High Road Initiative, connecting 
                training programs directly with employer needs. HRI ensures that 
                the skills you learn are exactly what employers are looking for.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Industry-Aligned Curriculum</div>
                    <div className="text-slate-400 text-sm">Training designed with employer input</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Direct Employer Connections</div>
                    <div className="text-slate-400 text-sm">Meet hiring managers during training</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Career Pathway Support</div>
                    <div className="text-slate-400 text-sm">Ongoing advancement opportunities</div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <Image
                src="/images/hvac/hvac-team.jpg"
                alt="HVAC Team"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            What You'll Learn
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Heating Systems', items: ['Furnace installation', 'Heat pump systems', 'Boiler basics', 'Combustion analysis'] },
              { title: 'Cooling Systems', items: ['AC installation', 'Refrigerant handling', 'Compressor service', 'Ductwork design'] },
              { title: 'Ventilation', items: ['Air quality systems', 'Duct installation', 'Exhaust systems', 'Balancing airflow'] },
              { title: 'Controls & Electrical', items: ['Thermostat wiring', 'Control boards', 'Electrical safety', 'Troubleshooting'] },
            ].map((category, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">{category.title}</h3>
                <ul className="space-y-2">
                  {category.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-slate-600 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            Certifications Included
          </h2>
          <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">
            Graduate with industry-recognized credentials that employers value
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">EPA 608 Certification</h3>
              <p className="text-sm text-slate-600">Required for handling refrigerants</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">OSHA 10 Safety</h3>
              <p className="text-sm text-slate-600">Workplace safety certification</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Program Certificate</h3>
              <p className="text-sm text-slate-600">Elevate for Humanity completion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
              Who Qualifies for Free Training?
            </h2>
            <p className="text-center text-slate-600 mb-8">
              This program is funded through Indiana Career Connect for eligible participants
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
              <h3 className="font-bold text-blue-900 mb-4">You may qualify if you:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Are an Indiana resident',
                  'Are 18 years or older',
                  'Have a high school diploma or GED',
                  'Are unemployed or underemployed',
                  'Receive public assistance (SNAP, TANF, etc.)',
                  'Are a veteran or military spouse',
                  'Have a disability',
                  'Are a single parent',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-blue-800">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-sm text-blue-700 mt-6">
                Not sure if you qualify? Complete our quick eligibility check to find out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Career Outcomes
          </h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">$45K+</div>
              <div className="text-slate-600">Average Starting Salary</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">90%</div>
              <div className="text-slate-600">Job Placement Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">15%</div>
              <div className="text-slate-600">Industry Growth Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">500+</div>
              <div className="text-slate-600">Local Job Openings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your HVAC Career Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Free training for those who qualify. No cost, no debt, just opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/inquiry?program=hvac"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Check Eligibility & Apply
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-full transition-all border border-blue-500"
            >
              Learn About Funding
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-6">
            Complete the online application in 5 minutes. We'll contact you within 24 hours.
          </p>
        </div>
      </section>
    </main>
  );
}
