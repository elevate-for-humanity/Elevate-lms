import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Shield, 
  Award, 
  Circle,
  Building, 
  Heart, 
  Users, 
  Briefcase,
  GraduationCap,
  ArrowRight,
  Star,
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/founder',
  },
  title: 'Elizabeth Greene - Founder | Elevate For Humanity',
  description:
    'Meet Elizabeth Greene, Founder & CEO of Elevate for Humanity. A transformational leader in workforce development creating pathways out of poverty.',
};

const credentials = [
  { icon: Shield, title: 'DOL Registered', desc: 'Apprenticeship Sponsor', color: 'blue' },
  { icon: Circle, title: 'WIOA Approved', desc: 'Training Provider', color: 'green' },
  { icon: Building, title: 'Indiana DWD', desc: 'INTraining Provider', color: 'blue' },
  { icon: GraduationCap, title: 'Indiana DOE', desc: 'State Recognized', color: 'indigo' },
  { icon: Heart, title: 'JRI Approved', desc: 'Justice Programs', color: 'red' },
  { icon: Award, title: 'Certiport CATC', desc: 'Testing Center', color: 'orange' },
];

const achievements = [
  'Built Indiana\'s most innovative workforce development organization',
  'Secured DOL Registered Apprenticeship Sponsor status',
  'Achieved WIOA, WRG, and JRI funding approvals',
  'Established partnerships with WorkOne Centers and EmployIndy',
  'Created integrated ecosystem combining training, support, and employment',
  'Founded RISE Foundation 501(c)(3) for philanthropic support',
  'Launched Certiport Authorized Testing Center',
  'Developed trauma-informed, wraparound support model',
];

const organizations = [
  {
    name: 'Elevate for Humanity',
    type: 'Workforce Development',
    desc: 'Training coordination, funding navigation, and employer partnerships serving individuals across Indiana.',
    status: 'Active SAM.gov Registration',
  },
  {
    name: 'RISE Foundation',
    type: '501(c)(3) Nonprofit',
    desc: 'Philanthropic support for workforce development initiatives. IRS determination received July 2024.',
    status: 'Tax-Exempt Status',
  },
  {
    name: 'Certiport Testing Center',
    type: 'Authorized CATC',
    desc: 'Industry-recognized certification exams including Microsoft Office Specialist, IC3, and Adobe credentials.',
    status: 'Authorized Provider',
  },
];

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Founder" }]} />
      </div>
{/* Avatar Video Overlay */}
      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-end overflow-hidden">
        <Image
          src="/images/team/elizabeth-greene.jpg"
          alt="Elizabeth Greene - Founder"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-12">
          <p className="text-brand-blue-400 font-semibold mb-2">Founder & Chief Executive Officer</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4">
            Elizabeth Greene
          </h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Transformational leader and workforce development pioneer creating pathways out of poverty and into prosperity.
          </p>
        </div>
      </section>

      {/* Credentials Bar */}
      <section className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-white font-semibold mb-6">Credentials & Approvals Achieved</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {credentials.map((cred, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-4 text-center">
                <cred.icon className="w-8 h-8 text-brand-blue-400 mx-auto mb-2" />
                <div className="font-bold text-white text-sm">{cred.title}</div>
                <div className="text-slate-400 text-xs">{cred.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Photo */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl mb-6">
                  <Image
                    src="/images/team/elizabeth-greene.jpg"
                    alt="Elizabeth Greene"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="bg-brand-blue-50 rounded-xl p-6">
                  <h3 className="font-bold text-slate-900 mb-3">Contact</h3>
                  <p className="text-slate-600 text-sm mb-2">elizabeth@elevateforhumanity.org</p>
                  <Link href="/contact" className="text-brand-blue-600 text-sm font-semibold hover:text-brand-blue-700">
                    Schedule a Meeting →
                  </Link>
                </div>
              </div>
            </div>

            {/* Bio Content */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">About Elizabeth</h2>
              
              <div className="prose prose-lg max-w-none text-slate-700 space-y-4">
                <p>
                  Elizabeth Greene is a transformational leader, workforce development pioneer, and social 
                  entrepreneur who has dedicated her career to creating pathways out of poverty and into 
                  prosperity.
                </p>
                
                <p>
                  As Founder and Chief Executive Officer of Elevate for Humanity Technical & Career Institute, 
                  she has built one of Indiana's most innovative workforce development organizations—serving 
                  justice-involved individuals, low-income families, and barrier-facing populations with 
                  dignity, excellence, and measurable results.
                </p>

                <p>
                  Under Elizabeth's visionary leadership, Elevate for Humanity has achieved unprecedented 
                  recognition and approval from federal, state, and local agencies. The organization is a 
                  U.S. Department of Labor (DOL) Registered Apprenticeship Sponsor, approved by the Indiana 
                  Department of Workforce Development (DWD) as an INTraining provider, and recognized by 
                  the Indiana Department of Education (DOE).
                </p>

                <p>
                  Elizabeth's accomplishments extend far beyond credentials. She has created a fully integrated 
                  ecosystem that combines workforce training, apprenticeship programs, case management, mental 
                  health support, housing assistance, and employer partnerships—all designed to address the 
                  root causes of poverty and recidivism.
                </p>
              </div>

              {/* Key Achievements */}
              <div className="mt-10">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Key Achievements</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {achievements.map((achievement, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-slate-700 text-sm">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Philosophy */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Leadership Philosophy</h2>
          
          <blockquote className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-brand-blue-600 mb-8">
            <p className="text-xl text-slate-700 italic mb-4">
              "Every person—regardless of their past—deserves access to quality education, living-wage 
              employment, and the opportunity to build a better future. When you invest in people, 
              you transform communities."
            </p>
            <cite className="text-slate-600 font-semibold">— Elizabeth Greene</cite>
          </blockquote>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Equity & Empowerment</h3>
              <p className="text-slate-600 text-sm">
                Creating opportunities for those who have been overlooked by traditional systems.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Holistic Support</h3>
              <p className="text-slate-600 text-sm">
                Addressing root causes with wraparound services and trauma-informed care.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Excellence & Accountability</h3>
              <p className="text-slate-600 text-sm">
                Maintaining the highest standards of quality and measurable outcomes.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Systems Building</h3>
              <p className="text-slate-600 text-sm">
                Connecting funding, training, and employers into a seamless ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Organizations Founded */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Organizations Founded</h2>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto mb-12">
            Elizabeth has built a network of organizations working together to transform lives.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {organizations.map((org, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                <div className="inline-block px-3 py-1 bg-brand-blue-100 text-brand-blue-700 text-xs font-semibold rounded-full mb-4">
                  {org.type}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{org.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{org.desc}</p>
                <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  {org.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Improve Your Future?
          </h2>
          <p className="text-brand-blue-100 text-lg mb-8">
            Join the thousands of individuals who have found their pathway to prosperity through Elevate.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/programs"
              className="inline-flex items-center bg-white text-brand-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-blue-50 transition"
            >
              Explore Programs
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-600 transition"
            >
              Apply Now <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
