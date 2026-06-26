import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { 
  Building2, 
  CheckCircle, 
  Users, 
  BookOpen,
  Briefcase,
  Award,
  DollarSign,
  Globe,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding/dol',
  },
  title: 'DOL Grants & Programs | Department of Labor Funding | Elevate For Humanity',
  description: 'Learn about Department of Labor grants and workforce development programs. Access federal funding for career training and employment services.',
};

const DOL_PROGRAMS = [
  {
    name: 'Registered Apprenticeship',
    description: 'Earn while you learn through employer-sponsored apprenticeship programs with DOL certification.',
    funding: 'Employer-funded with tax credits',
    icon: Briefcase,
  },
  {
    name: 'H-1B Skills Training Grants',
    description: 'Training for in-demand occupations in IT, healthcare, and advanced manufacturing.',
    funding: 'Up to $5M per grant',
    icon: BookOpen,
  },
  {
    name: 'YouthBuild',
    description: 'Education and job training for at-risk youth ages 16-24, focusing on construction.',
    funding: 'Full program coverage',
    icon: Users,
  },
  {
    name: 'Reentry Employment Opportunities',
    description: 'Training and employment services for adults and youth with criminal records.',
    funding: 'Full program coverage',
    icon: Award,
  },
  {
    name: 'National Dislocated Worker Grants',
    description: 'Emergency funding for workers affected by mass layoffs or natural disasters.',
    funding: 'Varies by situation',
    icon: DollarSign,
  },
  {
    name: 'Trade Adjustment Assistance',
    description: 'Support for workers who lost jobs due to foreign trade impacts.',
    funding: 'Training + income support',
    icon: Globe,
  },
];

const GRANT_BENEFITS = [
  'Tuition and training costs covered',
  'Supportive services (transportation, childcare)',
  'Career counseling and job placement',
  'Credential and certification fees',
  'On-the-job training wage subsidies',
  'Work-based learning opportunities',
];

export default function DOLFundingPage() {
  return (
    <div className="min-h-screen bg-white">
      {' '}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Funding', href: '/funding' }, { label: 'DOL Apprenticeship' }]}
          />
        </div>
      </div>
      {/* Hero */}
      <section className="relative h-[clamp(190px,32vw,360px)] overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/apprenticeship-hero.webp"
          alt="DOL Registered Apprenticeship"
          fill
          className="object-cover"
          priority
          sizes="100vw" 
        />
      </section>
      {/* What Is It */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                What Is a Registered Apprenticeship?
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                A Registered Apprenticeship is an employer-driven, &quot;earn and learn&quot;
                training model approved by the U.S. Department of Labor. Apprentices receive paid
                on-the-job training combined with classroom instruction, leading to a nationally
                recognized credential.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                {PLATFORM_DEFAULTS.orgName} is a DOL Registered Apprenticeship Sponsor for select programs
                (currently Barber Apprenticeship), meaning these programs meet federal standards for
                quality, safety, and outcomes.
              </p>
              <Link
                href="/start"
                className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold transition hover:scale-105 shadow-lg"
              >
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-[300px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/ojt-and-funding.webp"
                alt="Hands-on apprenticeship training"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw" 
              />
            </div>
          </div>
        </div>
      </section>
      {/* Benefits */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-6">
            Apprenticeship Benefits
          </h2>
          <div className="max-w-3xl mx-auto bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-slate-700 leading-relaxed">
              Registered Apprenticeships let you earn wages during training through paid on-the-job
              learning. You receive industry-recognized credentials upon completion that are
              portable and nationally recognized. Experienced professionals provide structured
              mentorship throughout the program. Funding may cover full tuition for eligible
              participants, and the apprenticeship creates a direct pathway to full-time employment
              with the training employer.
            </p>
          </div>
        </div>
      </section>
      {/* Available Programs */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">
            Available Apprenticeship Programs
          </h2>
          <p className="text-black text-center mb-10 max-w-2xl mx-auto">
            Programs registered with the U.S. Department of Labor.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {programs.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 hover:border-brand-blue-300 hover:shadow-sm transition group"
              >
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-brand-blue-600 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-sm text-black">{p.duration}</p>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                  DOL Grants & Programs
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  The U.S. Department of Labor funds numerous workforce development programs 
                  that provide free training, apprenticeships, and employment services.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/apply"
                    className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg"
                  >
                    Find Programs
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-blue-600/30 backdrop-blur text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600/40 transition border border-white/30"
                  >
                    Get Help
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/heroes/dol-programs.jpg"
                    alt="DOL Programs"
                    fill
                    className="object-cover"
                    sizes="50vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Programs Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                DOL-Funded Programs
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Explore the various Department of Labor programs that may fund your training.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {DOL_PROGRAMS.map((program) => {
                const IconComponent = program.icon;
                return (
                  <div
                    key={program.name}
                    className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition"
                  >
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {program.name}
                    </h3>
                    <p className="text-slate-600 mb-4">
                      {program.description}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <DollarSign className="w-4 h-4" />
                      {program.funding}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/business/training-workshop.jpg"
                  alt="Training Workshop"
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
                  What DOL Grants Cover
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  DOL-funded programs provide comprehensive support to help you succeed in your 
                  training and find employment.
                </p>
                
                <div className="space-y-4">
                  {GRANT_BENEFITS.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Access */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                How to Access DOL Programs
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Most DOL programs are accessed through your local American Job Center.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Visit Job Center', description: 'Find your local American Job Center' },
                { step: '2', title: 'Assessment', description: 'Complete skills and eligibility assessment' },
                { step: '3', title: 'Program Match', description: 'Get matched with appropriate programs' },
                { step: '4', title: 'Enrollment', description: 'Enroll and begin your training' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Ready to Explore Your Options?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Let us help you find the right DOL program for your career goals.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 bg-blue-500/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500/40 transition border border-white/30"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
