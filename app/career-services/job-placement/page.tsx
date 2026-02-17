import Link from 'next/link';
import { Metadata } from 'next';
import { Briefcase, Building2, TrendingUp, ArrowRight, Users, Target, Award, Search, Handshake } from 'lucide-react';
import { CareerHero } from '../components/CareerHero';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Job Placement Services | Elevate for Humanity',
  description: 'Direct connections to employers actively hiring our graduates. Job matching, employer partnerships, interview coordination, and ongoing career support.',
  keywords: ['job placement', 'career placement', 'employer connections', 'job matching', 'hiring partners', 'career services', 'job search assistance'],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/career-services/job-placement',
  },
};

export default function JobPlacementPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Job Placement' }]} />
        </div>
      </div>

      <CareerHero />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-black text-brand-orange-600 mb-2">Active</div>
            <div className="text-gray-600">Employer Network</div>
          </div>
          <div>
            <div className="text-4xl font-black text-brand-orange-600 mb-2">Included</div>
            <div className="text-gray-600">Job Placement</div>
          </div>
          <div>
            <div className="text-4xl font-black text-brand-orange-600 mb-2">Full</div>
            <div className="text-gray-600">Support Services</div>
          </div>
          <div>
            <div className="text-4xl font-black text-brand-orange-600 mb-2">Free</div>
            <div className="text-gray-600">For All Graduates</div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black text-black mb-4 text-center">
          Comprehensive Job Placement Support
        </h2>
        <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
          From resume submission to your first day on the job, we're with you every step of the way.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-brand-orange-600 transition">
            <div className="w-12 h-12 bg-brand-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-brand-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">Direct Employer Connections</h3>
            <p className="text-gray-600">
              We maintain relationships with pre-vetted hiring partners across Central Indiana. Our graduates get access to exclusive job postings and direct referrals to hiring managers — not just online applications. Employers in our network have agreed to interview qualified Elevate graduates as a priority.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-brand-orange-600 transition">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-brand-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">Personalized Job Matching</h3>
            <p className="text-gray-600">
              Your career coach reviews your skills, certifications, location preferences, schedule needs, and long-term career goals. We then match you with open positions that fit — not just any job, but the right job for your situation and ambitions.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-brand-orange-600 transition">
            <div className="w-12 h-12 bg-brand-green-100 rounded-xl flex items-center justify-center mb-4">
              <Handshake className="w-6 h-6 text-brand-green-600" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">Interview Coordination</h3>
            <p className="text-gray-600">
              We handle interview scheduling with employers, prepare you with company-specific coaching so you know what to expect, and follow up with the employer after your interview. If you need transportation or professional attire, we can help with that too.
            </p>
          </div>
        </div>

        <div className="bg-brand-orange-50 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">How Job Placement Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Complete Your Training
                  </h3>
                  <p className="text-gray-600">
                    Finish your program, complete your training, and demonstrate job-ready skills.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Career Assessment
                  </h3>
                  <p className="text-gray-600">
                    Meet with your career coach to discuss goals, preferences, and target employers.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Job Matching
                  </h3>
                  <p className="text-gray-600">
                    We identify opportunities that match your skills, location, and career goals.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Employer Introduction
                  </h3>
                  <p className="text-gray-600">
                    We submit your resume and credentials directly to hiring managers.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xl">
                  5
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Interview Support
                  </h3>
                  <p className="text-gray-600">
                    Prepare for interviews with company-specific coaching and practice sessions.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xl">
                  6
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Start Your Career
                  </h3>
                  <p className="text-gray-600">
                    Accept your offer and begin working with ongoing support from our team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="employers" className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4 text-center">
            Our Employer Partners
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            We partner with leading employers across multiple industries who are committed to 
            hiring and developing our graduates.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Technology</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Software development companies</li>
                <li>• IT service providers</li>
                <li>• Tech startups and enterprises</li>
                <li>• Cybersecurity firms</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-brand-green-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Business Services</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Accounting and tax firms</li>
                <li>• Financial services</li>
                <li>• Consulting companies</li>
                <li>• Professional services</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Healthcare</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Hospitals and clinics</li>
                <li>• Healthcare IT companies</li>
                <li>• Medical billing services</li>
                <li>• Health insurance providers</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-brand-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Manufacturing</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Advanced manufacturing</li>
                <li>• Logistics and supply chain</li>
                <li>• Quality assurance</li>
                <li>• Production management</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-brand-red-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-brand-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Nonprofit</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Community organizations</li>
                <li>• Educational institutions</li>
                <li>• Social services agencies</li>
                <li>• Foundations and charities</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Government</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Federal agencies</li>
                <li>• State and local government</li>
                <li>• Public schools and libraries</li>
                <li>• Government contractors</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-black mb-4">
              Interested in Hiring Our Graduates?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join our employer network and gain access to skilled, motivated candidates 
              ready to contribute to your organization.
            </p>
            <Link
              href="/employers"
              className="inline-flex items-center gap-2 bg-brand-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-orange-700 transition"
            >
              Partner With Us
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black text-black mb-12 text-center">
          What Makes Our Placement Services Different
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-black mb-4">Employer Relationships</h3>
            <p className="text-gray-600">
              We don&apos;t just post job listings. We build long-term partnerships with employers 
              who understand our training and trust our graduates. Our team meets regularly with 
              hiring managers to understand their needs, workplace culture, and open positions. 
              This means when we refer you, the employer already knows the quality of training you received.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-black mb-4">Personalized Matching</h3>
            <p className="text-gray-600">
              Every graduate gets one-on-one career coaching. We assess your skills, interests, 
              transportation situation, schedule constraints, and salary expectations. Then we 
              match you with positions that actually work for your life — not just any open role.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-black mb-4">Ongoing Support</h3>
            <p className="text-gray-600">
              Our support doesn&apos;t end when you get hired. We do 90-day check-ins after placement 
              to make sure things are going well. If you need help advancing, switching roles, or 
              negotiating a raise, our career coaches are available to alumni at no cost — for life.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-black mb-4">No Cost to You</h3>
            <p className="text-gray-600">
              All job placement services are completely free for our students and alumni. 
              There are no placement fees, no commissions, and no hidden costs. You can use 
              our job search support as many times as you need — whether you are looking for 
              your first job after training or exploring new opportunities years later.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-brand-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-6 text-center">
            Success Stories
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <p className="text-white/90 mb-4 italic">
                "Within two weeks of graduating, I had three job offers. The career services 
                team helped me prepare for interviews and negotiate my salary. I'm now working 
                as a junior developer making $65,000/year."
              </p>
              <div className="font-bold">— Maria S., Web Development Graduate</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <p className="text-white/90 mb-4 italic">
                "I was nervous about changing careers, but the job placement team matched me 
                with an employer who valued my transferable skills. I started as a tax preparer 
                and got promoted to senior preparer within a year."
              </p>
              <div className="font-bold">— James T., Tax Preparation Graduate</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black text-black mb-12 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-black mb-3">When can I start using job placement services?</h3>
            <p className="text-gray-600">
              Job placement services are available as soon as you complete your program and earn your 
              certification. We recommend connecting with career services during your final weeks of training 
              to prepare for your job search.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-black mb-3">Do I have to accept the jobs you recommend?</h3>
            <p className="text-gray-600">
              No. We present opportunities that match your criteria, but you have complete control over 
              which positions you pursue. We're here to support your decisions and help you find the right fit.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-black mb-3">What if I don't get hired right away?</h3>
            <p className="text-gray-600">
              We continue working with you until you find the right position. There's no time limit on our 
              support. We'll refine your approach, expand your search, and keep connecting you with opportunities.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-black mb-3">Can I use job placement services if I'm already employed?</h3>
            <p className="text-gray-600">
              Yes! Our services are available to help you advance your career, find better opportunities, 
              or transition to a new role. We support both job seekers and those looking to level up.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-black mb-3">Do you help with remote job opportunities?</h3>
            <p className="text-gray-600">
              Absolutely. Many of our employer partners offer remote and hybrid positions. We can help you 
              find opportunities that match your location preferences, whether that's in-person, remote, or hybrid.
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-black mb-3">Is job placement guaranteed?</h3>
            <p className="text-gray-600">
              While we cannot guarantee employment (as hiring decisions are made by employers), we provide 
              ongoing support until you find the right position. We're committed to your success.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-brand-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Start Your Career?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Complete your training and let us connect you with employers who are ready to hire.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white/20 transition border border-white/20"
            >
              Contact Career Services
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-black mb-8 text-center">
          More Career Services
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/career-services/resume-building"
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-blue-600 transition"
          >
            <h3 className="text-xl font-bold text-black mb-2">
              Resume Building
            </h3>
            <p className="text-gray-600">
              Professional resume writing and review services
            </p>
          </Link>
          <Link
            href="/career-services/interview-prep"
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-blue-600 transition"
          >
            <h3 className="text-xl font-bold text-black mb-2">
              Interview Preparation
            </h3>
            <p className="text-gray-600">
              Mock interviews and coaching to ace your interviews
            </p>
          </Link>
          <Link
            href="/career-services/career-counseling"
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-blue-600 transition"
          >
            <h3 className="text-xl font-bold text-black mb-2">
              Career Counseling
            </h3>
            <p className="text-gray-600">
              Long-term career planning and guidance
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
