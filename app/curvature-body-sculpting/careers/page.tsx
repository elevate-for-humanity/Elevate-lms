import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Heart,
  Users,
  Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers | Curvature Body Sculpting | Join Our Team',
  description: 'Join Curvature Body Sculpting. We hire graduates from Elevate for Humanity esthetician and beauty programs. Start your career in body sculpting and wellness.',
};

const openPositions = [
  {
    id: 'body-sculpting-tech',
    title: 'Body Sculpting Technician',
    type: 'Full-time',
    location: 'Indianapolis, IN',
    salary: '$35,000 - $50,000 + Commission',
    description: 'Perform non-invasive body contouring treatments using advanced equipment. Provide consultations and develop treatment plans for clients.',
    requirements: [
      'Esthetician license or certification (or enrolled in program)',
      'Strong customer service skills',
      'Ability to learn new technologies',
      'Professional appearance and demeanor',
    ],
    benefits: [
      'Paid training on all equipment',
      'Commission on services and product sales',
      'Health insurance after 90 days',
      'Flexible scheduling',
      'Career advancement opportunities',
    ],
  },
  {
    id: 'esthetician',
    title: 'Licensed Esthetician',
    type: 'Full-time',
    location: 'Indianapolis, IN',
    salary: '$32,000 - $45,000 + Commission',
    description: 'Provide skincare treatments, facials, and skin analysis. Recommend products and home care routines for clients.',
    requirements: [
      'Valid Indiana Esthetician License',
      'Experience with facial treatments',
      'Knowledge of skincare products',
      'Excellent communication skills',
    ],
    benefits: [
      'Competitive base pay + commission',
      'Product discounts',
      'Continuing education support',
      'Flexible scheduling',
    ],
  },
  {
    id: 'wellness-consultant',
    title: 'Wellness Consultant',
    type: 'Part-time',
    location: 'Indianapolis, IN',
    salary: '$15 - $20/hour + Commission',
    description: 'Help clients select wellness products, provide product education, and support the retail operations of our wellness shop.',
    requirements: [
      'Passion for wellness and self-care',
      'Retail or customer service experience',
      'Knowledge of aromatherapy and wellness products a plus',
      'Friendly and approachable personality',
    ],
    benefits: [
      'Flexible hours',
      'Product discounts',
      'Commission on sales',
      'Path to full-time',
    ],
  },
  {
    id: 'apprentice',
    title: 'Esthetician Apprentice',
    type: 'Full-time',
    location: 'Indianapolis, IN',
    salary: '$14 - $16/hour during training',
    description: 'Learn body sculpting and esthetics while earning. Perfect for Elevate for Humanity program graduates or current students.',
    requirements: [
      'Enrolled in or completed esthetician program',
      'Eager to learn',
      'Reliable and punctual',
      'Professional attitude',
    ],
    benefits: [
      'Paid on-the-job training',
      'Path to technician role',
      'Mentorship from experienced staff',
      'Tuition assistance available',
    ],
  },
];

export default function CurvatureCareersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/images/beauty/cosmetology.jpg"
            alt="Careers at Curvature Body Sculpting"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/90 via-purple-900/80 to-indigo-900/70" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
            <Briefcase className="w-4 h-4" />
            We're Hiring
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Join Curvature Body Sculpting
          </h1>
          <p className="text-xl text-pink-100 max-w-2xl mx-auto mb-8">
            Start your career in body sculpting and wellness. We hire graduates from 
            Elevate for Humanity's esthetician and beauty programs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#positions"
              className="px-8 py-4 bg-white text-purple-700 font-bold rounded-lg hover:bg-pink-50 transition"
            >
              View Open Positions
            </a>
            <Link
              href="/programs/esthetician-apprenticeship"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition"
            >
              Get Trained First
            </Link>
          </div>
        </div>
      </section>

      {/* Why Work Here */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Work With Us?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-bold mb-2">Paid Training</h3>
              <p className="text-gray-600 text-sm">Learn on the job with full pay and mentorship</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold mb-2">Competitive Pay</h3>
              <p className="text-gray-600 text-sm">Base salary plus commission on services and sales</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-bold mb-2">Growth Opportunities</h3>
              <p className="text-gray-600 text-sm">Clear path from apprentice to senior technician</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold mb-2">Community Impact</h3>
              <p className="text-gray-600 text-sm">Partner with VITA and Selfish Inc. nonprofits</p>
            </div>
          </div>
        </div>
      </section>

      {/* Elevate Partnership */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Elevate for Humanity Partnership</h2>
                <p className="text-gray-600 mb-4">
                  We partner with Elevate for Humanity to hire graduates from their esthetician 
                  and beauty programs. If you're looking to start a career in body sculpting, 
                  you can get trained for FREE through WIOA funding.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/programs/esthetician-apprenticeship"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    Esthetician Program <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/programs/cosmetology-apprenticeship"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition"
                  >
                    Cosmetology Program <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Open Positions</h2>
          <p className="text-gray-600 text-center mb-12">
            {openPositions.length} positions available in Indianapolis, IN
          </p>
          <div className="space-y-6">
            {openPositions.map((position) => (
              <div
                key={position.id}
                className="bg-white rounded-2xl border hover:shadow-lg transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{position.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {position.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {position.salary}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/curvature-body-sculpting/apply?position=${position.id}`}
                      className="px-6 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition"
                    >
                      Apply Now
                    </Link>
                  </div>
                  <p className="text-gray-600 mb-4">{position.description}</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                      <ul className="space-y-1">
                        {position.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                      <ul className="space-y-1">
                        {position.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Career?</h2>
          <p className="text-pink-100 mb-8">
            Apply today or get trained first through our partner Elevate for Humanity.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/curvature-body-sculpting/apply"
              className="px-8 py-4 bg-white text-purple-700 font-bold rounded-lg hover:bg-pink-50 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/programs/esthetician-apprenticeship"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition"
            >
              Get Free Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
