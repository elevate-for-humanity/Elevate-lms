import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
  CheckCircle, 
  ArrowRight, 
  Heart, 
  Briefcase, 
  GraduationCap, 
  Home, 
  Users, 
  Shield,
  Phone,
  Clock,
  DollarSign,
  MapPin
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding/jri',
  },
  title: 'JRI Program - Free Reentry Training | Justice Reinvestment Initiative | Elevate For Humanity',
  description:
    'Free career training for justice-involved individuals in Indiana. JRI covers 100% of training costs including certifications, supplies, and job placement support. Your past does not define your future.',
};

export default function JriPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'JRI Program' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/pages/jri-hero.jpg"
            alt="Second chance career training"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-indigo-900/70" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6">
              <Heart className="w-5 h-5 text-red-400" />
              <span className="text-white font-semibold text-sm">Justice Reinvestment Initiative</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Your Past Doesn&apos;t Define
              <span className="block text-indigo-300">Your Future</span>
            </h1>

            <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
              100% FREE career training for justice-involved individuals in Indiana. 
              Get certified, get hired, and build the life you deserve.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <Link
                href="/apply?program=jri"
                className="inline-flex items-center gap-2 bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all"
              >
                Apply Now - It&apos;s Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={`tel:${PLATFORM_DEFAULTS.supportPhone}`}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20"
              >
                <Phone className="w-5 h-5" />
                Call {PLATFORM_DEFAULTS.supportPhone}
              </a>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span>$0 Cost to You</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span>Programs 3 Weeks - 18 Months</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-400" />
                <span>Indianapolis, IN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What JRI Covers */}
      <section className="py-16 bg-green-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              What JRI Pays For (Everything)
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The Justice Reinvestment Initiative covers ALL costs so you can focus on your training and future.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: GraduationCap, title: 'Tuition & Training', desc: 'All classroom and hands-on instruction', color: 'bg-blue-100 text-blue-600' },
              { icon: Shield, title: 'Certifications', desc: 'Industry credentials and licenses', color: 'bg-green-100 text-green-600' },
              { icon: Briefcase, title: 'Tools & Supplies', desc: 'Everything you need for training', color: 'bg-purple-100 text-purple-600' },
              { icon: Users, title: 'Support Services', desc: 'Case management & job placement', color: 'bg-orange-100 text-orange-600' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border text-center">
                <div className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Programs Available */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Career Training Programs
            </h2>
            <p className="text-xl text-gray-600">
              Choose a career path that fits your goals. All programs lead to real jobs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Barber Apprenticeship',
                image: '/images/programs/barber-hero.jpg',
                duration: '18 months',
                outcome: 'Indiana Barber License',
                salary: '$35,000 - $60,000+/year',
                desc: 'Learn to cut hair, build clientele, and own your own business. Work in a real barbershop while you train.'
              },
              {
                title: 'CNA / Healthcare',
                image: '/images/programs/cna-hero.jpg',
                duration: '4-8 weeks',
                outcome: 'State CNA Certification',
                salary: '$30,000 - $40,000/year',
                desc: 'Start a career in healthcare. CNAs are in high demand at hospitals, nursing homes, and home health agencies.'
              },
              {
                title: 'CDL Truck Driving',
                image: '/images/programs/cdl-hero.jpg',
                duration: '3-4 weeks',
                outcome: 'Commercial Driver License',
                salary: '$45,000 - $70,000+/year',
                desc: 'Get your CDL and hit the road. Trucking companies are hiring immediately with sign-on bonuses.'
              },
              {
                title: 'Building Maintenance',
                image: '/images/programs/building-maintenance-hero.jpg',
                duration: '8-12 weeks',
                outcome: 'Multiple Certifications',
                salary: '$32,000 - $50,000/year',
                desc: 'Learn HVAC basics, electrical, plumbing, and general maintenance. Every building needs maintenance techs.'
              },
              {
                title: 'Forklift & Warehouse',
                image: '/images/hero/hero-skilled-trades.jpg',
                duration: '1-2 weeks',
                outcome: 'OSHA Forklift Certification',
                salary: '$30,000 - $45,000/year',
                desc: 'Quick certification to get you working fast. Warehouses and distribution centers are always hiring.'
              },
              {
                title: 'Construction Trades',
                image: '/images/pages/construction-trades.jpg',
                duration: '8-16 weeks',
                outcome: 'OSHA 10 + Trade Certs',
                salary: '$35,000 - $55,000/year',
                desc: 'Learn carpentry, drywall, painting, or concrete work. Construction is booming in Indianapolis.'
              },
            ].map((program, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg border group hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <Image src={program.image} alt={program.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    JRI FUNDED
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{program.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{program.desc}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">{program.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">You Get:</span>
                      <span className="font-medium text-green-600">{program.outcome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Salary Range:</span>
                      <span className="font-medium">{program.salary}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Qualifies */}
      <section className="py-16 bg-indigo-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
                Do You Qualify for JRI?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                JRI is specifically for people who have been involved in the criminal justice system 
                and want to build a legitimate career. If any of these apply to you, you likely qualify:
              </p>

              <ul className="space-y-4">
                {[
                  'Currently on probation or parole in Indiana',
                  'Recently released from jail or prison (within 3 years)',
                  'On community corrections or home detention',
                  'Referred by your probation/parole officer',
                  'Participating in a reentry program',
                  'Have a felony conviction and want to work legally',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800">
                  <strong>Not sure if you qualify?</strong> Call us at {PLATFORM_DEFAULTS.supportPhone}. 
                  We&apos;ll help you figure it out — no judgment, just answers.
                </p>
              </div>
            </div>

            <div className="relative">
              <Image
                src="/images/funding/funding-jri-program-v2.jpg"
                alt="JRI participant in training"
                width={600}
                height={500}
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-6 shadow-lg max-w-xs">
                <p className="text-gray-900 font-medium italic">
                  &quot;JRI gave me a second chance when no one else would. Now I have my CDL and make $55K a year.&quot;
                </p>
                <p className="text-gray-500 text-sm mt-2">— Marcus T., JRI Graduate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Services */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              More Than Just Training
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We know reentry is hard. JRI includes wraparound support to help you succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Case Management',
                desc: 'A dedicated case manager helps you navigate training, appointments, and any challenges that come up.'
              },
              {
                icon: Briefcase,
                title: 'Job Placement',
                desc: 'We connect you with employers who hire people with records. Many of our partners specifically want JRI graduates.'
              },
              {
                icon: Home,
                title: 'Housing Assistance',
                desc: 'Need help finding stable housing? We can connect you with reentry housing resources in Indianapolis.'
              },
              {
                icon: Shield,
                title: 'Record Expungement Help',
                desc: 'Learn about Indiana expungement laws and get connected to legal aid if you qualify.'
              },
              {
                icon: Heart,
                title: 'Mental Health Support',
                desc: 'Access to counseling and mental health resources to help you stay on track.'
              },
              {
                icon: DollarSign,
                title: 'Financial Coaching',
                desc: 'Learn to budget, build credit, and manage money so you can stay stable long-term.'
              },
            ].map((service, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 border">
                <service.icon className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="font-bold text-gray-900 text-lg mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              How to Get Started
            </h2>
            <p className="text-xl text-gray-400">
              Three simple steps to start your new career
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: 1,
                title: 'Apply Online or Call Us',
                desc: 'Fill out a short application (10 minutes) or call {PLATFORM_DEFAULTS.supportPhone}. Tell us about yourself and what career interests you.'
              },
              {
                step: 2,
                title: 'Meet With Our Team',
                desc: 'We\'ll verify your JRI eligibility, discuss your goals, and help you choose the right training program.'
              },
              {
                step: 3,
                title: 'Start Training',
                desc: 'Begin your program with everything paid for. Focus on learning — we handle the rest.'
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center font-black text-2xl flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Ready for Your Second Chance?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Don&apos;t let your past hold you back. JRI exists because Indiana believes in second chances — and so do we.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/apply?program=jri"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all"
            >
              Apply Now — It&apos;s Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone}`}
              className="inline-flex items-center gap-2 bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-800 transition-all border border-white/30"
            >
              <Phone className="w-5 h-5" />
              Call {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
          <p className="text-indigo-200 mt-6 text-sm">
            Questions? We&apos;re here to help. No judgment, just support.
          </p>
        </div>
      </section>
    </div>
  );
}
